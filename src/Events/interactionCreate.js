const { MessageFlags } = require("discord.js");
const config = require("../../config");
const { getWeather } = require("../Services/cwaService");
const {
  subscribeWeather,
  unsubscribeWeather,
} = require("../Services/subscriptionService");
const { formatCityName } = require("../Utils/helper");
const { buildWeatherEmbed } = require("../Utils/weatherEmbed");
const { buildCityModal, formatScheduleTime } = require("../Utils/helpUi");

const EPHEMERAL = { flags: [MessageFlags.Ephemeral] };

function resolveCity(raw) {
  const trimmed = raw?.trim();
  return formatCityName(trimmed || config.weather.defaultCity);
}

module.exports = async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "help_menu") {
    const selected = interaction.values[0];

    if (selected === "weather") {
      return interaction.showModal(
        buildCityModal(
          "help_weather_modal",
          "明日天氣查詢",
          `留空則使用 ${config.weather.defaultCity}`,
        ),
      );
    }

    if (selected === "subscribe") {
      return interaction.showModal(
        buildCityModal(
          "help_subscribe_modal",
          "訂閱每日預報",
          "例如：高雄、臺北",
        ),
      );
    }

    if (selected === "unsubscribe") {
      await interaction.deferReply(EPHEMERAL);

      try {
        const result = await unsubscribeWeather(
          interaction.channel,
          interaction.user.id,
        );

        if (!result.found) {
          return interaction.editReply("❌ 你在此頻道沒有天氣訂閱。");
        }

        return interaction.editReply(
          "✅ 已取消天氣訂閱，此頻道不再自動推送預報。",
        );
      } catch (error) {
        console.error("選單取消訂閱錯誤:", error);
        return interaction.editReply("❌ 取消訂閱失敗。");
      }
    }

    if (selected === "ping") {
      const pingTime = Date.now() - interaction.createdTimestamp;
      return interaction.reply({
        content: `🏓 Pong! (延遲: ${pingTime}ms)`,
        ...EPHEMERAL,
      });
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "help_weather_modal") {
      const city = resolveCity(
        interaction.fields.getTextInputValue("city"),
      );

      await interaction.deferReply(EPHEMERAL);

      try {
        const data = await getWeather(city, { dayOffset: 1 });
        if (!data) {
          return interaction.editReply(
            `找不到「${city}」的天氣資訊，請確認城市名稱。`,
          );
        }

        return interaction.editReply({
          embeds: [buildWeatherEmbed(data)],
        });
      } catch (error) {
        console.error("選單查詢天氣錯誤:", error);
        return interaction.editReply("❌ 查詢天氣時發生錯誤，請稍後再試。");
      }
    }

    if (interaction.customId === "help_subscribe_modal") {
      const rawCity = interaction.fields.getTextInputValue("city")?.trim();
      if (!rawCity) {
        return interaction.reply({
          content: "❌ 請輸入要訂閱的城市名稱。",
          ...EPHEMERAL,
        });
      }

      await interaction.deferReply(EPHEMERAL);

      try {
        const { city } = await subscribeWeather({
          guildId: interaction.guild?.id || "DM",
          guildName: interaction.guild?.name || "私訊",
          channelId: interaction.channel.id,
          userId: interaction.user.id,
          userName: interaction.user.username,
          cityName: rawCity,
        });

        const scheduleTime = formatScheduleTime(config.weather.schedule);

        return interaction.editReply(
          `✅ 已訂閱 **${city}** 的每日預報！\n將於每日 **${scheduleTime}**（${config.weather.timezone}）推送到此頻道。`,
        );
      } catch (error) {
        console.error("選單訂閱錯誤:", error);
        return interaction.editReply("❌ 訂閱失敗。");
      }
    }
  }
};

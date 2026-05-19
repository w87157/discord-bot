const { MessageFlags } = require("discord.js");
const config = require("../../config");
const { getWeather } = require("../Services/cwaService");
const {
  subscribeWeather,
  unsubscribeWeather,
} = require("../Services/subscriptionService");
const { formatCityName } = require("../Utils/helper");
const { buildWeatherEmbed } = require("../Utils/weatherEmbed");
const {
  CITY_BACK_VALUE,
  buildHelpEmbed,
  buildCitySelectEmbed,
  buildHelpComponents,
  buildCitySelectComponents,
  formatScheduleTime,
  resetHelpSelectMenu,
} = require("../Utils/helpUi");

const EPHEMERAL = { flags: [MessageFlags.Ephemeral] };

async function resetHelpMenu(interaction) {
  try {
    await resetHelpSelectMenu(interaction.message);
  } catch (error) {
    console.error("重設指令選單失敗:", error);
  }
}

module.exports = async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "help_menu") {
    const selected = interaction.values[0];

    if (selected === "weather") {
      await interaction.update({
        embeds: [buildCitySelectEmbed("🌦️ 明日天氣查詢")],
        components: buildCitySelectComponents("weather"),
      });
      return;
    }

    if (selected === "subscribe") {
      await interaction.update({
        embeds: [buildCitySelectEmbed("🔔 訂閱每日預報")],
        components: buildCitySelectComponents("subscribe"),
      });
      return;
    }

    if (selected === "unsubscribe") {
      await interaction.deferReply(EPHEMERAL);

      try {
        const result = await unsubscribeWeather(
          interaction.channel,
          interaction.user.id,
        );

        if (!result.found) {
          await interaction.editReply("❌ 你在此頻道沒有天氣訂閱。");
        } else {
          await interaction.editReply(
            "✅ 已取消天氣訂閱，此頻道不再自動推送預報。",
          );
        }
      } catch (error) {
        console.error("選單取消訂閱錯誤:", error);
        await interaction.editReply("❌ 取消訂閱失敗。");
      }

      await resetHelpMenu(interaction);
      return;
    }

    if (selected === "ping") {
      const pingTime = Date.now() - interaction.createdTimestamp;
      await interaction.reply({
        content: `🏓 Pong! (延遲: ${pingTime}ms)`,
        ...EPHEMERAL,
      });
      await resetHelpMenu(interaction);
    }
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("help_city_")
  ) {
    const action = interaction.customId.replace("help_city_", "");
    const selected = interaction.values[0];

    if (selected === CITY_BACK_VALUE) {
      await interaction.update({
        embeds: [buildHelpEmbed()],
        components: buildHelpComponents(),
      });
      return;
    }

    const city = formatCityName(selected);

    if (action === "weather") {
      await interaction.deferReply(EPHEMERAL);

      try {
        const data = await getWeather(city, { dayOffset: 1 });
        if (!data) {
          await interaction.editReply(
            `找不到「${city}」的天氣資訊，請確認城市名稱。`,
          );
        } else {
          await interaction.editReply({ embeds: [buildWeatherEmbed(data)] });
        }
      } catch (error) {
        console.error("選單查詢天氣錯誤:", error);
        await interaction.editReply("❌ 查詢天氣時發生錯誤，請稍後再試。");
      }

      await resetHelpMenu(interaction);
      return;
    }

    if (action === "subscribe") {
      await interaction.deferReply(EPHEMERAL);

      try {
        const { city: subscribedCity } = await subscribeWeather({
          guildId: interaction.guild?.id || "DM",
          guildName: interaction.guild?.name || "私訊",
          channelId: interaction.channel.id,
          userId: interaction.user.id,
          userName: interaction.user.username,
          cityName: city,
        });

        const scheduleTime = formatScheduleTime(config.weather.schedule);

        await interaction.editReply(
          `✅ 已訂閱 **${subscribedCity}** 的每日預報！\n將於每日 **${scheduleTime}**（${config.weather.timezone}）推送到此頻道。`,
        );
      } catch (error) {
        console.error("選單訂閱錯誤:", error);
        await interaction.editReply("❌ 訂閱失敗。");
      }

      await resetHelpMenu(interaction);
    }
  }
};

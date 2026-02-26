const cron = require("node-cron");
const config = require("../../config");

const { EmbedBuilder } = require("discord.js");
const { getWeather } = require("../Services/cwaService");

module.exports = (client) => {
  console.log(`✅ ${client.user.tag} 已就緒！`);

  const sendWeatherReport = async () => {
    console.log("⏰ 執行天氣發送任務...");

    const data = await getWeather(config.weather.defaultCity);
    if (!data) return;

    const channel = client.channels.cache.get(process.env.WEATHER_CHANNEL_ID);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle(`🌅 每日天氣預報 - ${data.location}`)
        .addFields(
          {
            name: "🌡️ 溫度範圍",
            value: `${data.MinT}°C ~ ${data.MaxT}°C`,
            inline: true,
          },
          {
            name: "☔ 降雨機率",
            value: `${data.PoP}%`,
            inline: true,
          },
          { name: "\u200B", value: "\u200B", inline: true },
          {
            name: "☁️ 天氣狀態",
            value: data.Wx,
            inline: true,
          },
          {
            name: "🏃 舒適度評估",
            value: data.CI,
            inline: true,
          },
          { name: "\u200B", value: "\u200B", inline: true },
        )
        .setFooter({
          text: `預報時間：${data.startTime} ~ ${new Date().toLocaleString("zh-TW", { hour12: true })}`,
        });

      channel.send({ embeds: [embed] });
    }
  };

  sendWeatherReport();

  // 每天 06:00 執行定時發送訊息
  cron.schedule(
    config.weather.schedule,
    async () => {
      await sendWeatherReport();
    },
    { timezone: config.weather.timezone },
  );
};

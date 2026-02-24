const cron = require("node-cron");
const config = require("../../config");

const { EmbedBuilder } = require("discord.js");
const { getWeather } = require("../Services/cwaService");

module.exports = (client) => {
  console.log(`✅ ${client.user.tag} 已就緒！`);

  // 每天 06:00 執行定時天氣任務
  cron.schedule(
    config.weather.schedule,
    async () => {
      console.log("⏰ 執行定時天氣發送任務...");

      const data = await getWeather(config.weather.defaultCity);
      if (!data) return;

      const channel = client.channels.cache.get(process.env.WEATHER_CHANNEL_ID);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`📢 早安！今日 ${data.location} 天氣預報`)
          .setDescription(`${data.Wx}，溫度約 ${data.MinT}~${data.MaxT}°C`)
          .setColor(0x0099ff);

        channel.send({ embeds: [embed] });
      }
    },
    { timezone: config.weather.timezone },
  );
};

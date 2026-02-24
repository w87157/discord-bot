const cron = require("node-cron");
const config = require("../../config");

module.exports = (client) => {
  console.log(`✅ ${client.user.tag} 已就緒！`);

  // 每天 06:00 執行定時天氣任務
  cron.schedule(
    config.weather.schedule,
    () => {
      console.log("⏰ 執行定時天氣發送任務...");
      // 呼叫發送邏輯 (例如呼叫 sendDailyWeather)
    },
    { timezone: config.weather.timezone },
  );
};

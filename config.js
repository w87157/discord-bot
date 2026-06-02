module.exports = {
  prefix: "!",
  weather: {
    defaultCity: "臺北市",
    timezone: "Asia/Taipei",
    schedule: "0 6 * * *", // 每日 06:00 推播天氣
  },
  attendance: {
    timezone: "Asia/Taipei",
    schedule: "5 0 * * *", // 每日 00:05 執行簽到
  },
};

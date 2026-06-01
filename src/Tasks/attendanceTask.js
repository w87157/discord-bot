const cron = require("node-cron");
const { autoClaimFunction } = require("../Services/attendanceService");
const { createReportEmbed } = require("../Utils/attendanceEmbed");

module.exports = (client) => {
  // 設定定時任務：每天早上 00:05 自動執行並發送到指定頻道
  cron.schedule(
    "5 0 * * *",
    async () => {
      console.log("時鐘已到，觸發自動簽到任務...");
      const result = await autoClaimFunction();
      try {
        // 確保你的 .env 有定義 CHANNEL_ID
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        if (channel) {
          const embed = createReportEmbed(result);
          await channel.send({ embeds: [embed] });
        }
      } catch (e) {
        console.error("發送定時訊息失敗:", e.message);
      }
    },
    {
      timezone: "Asia/Taipei",
    },
  );
};

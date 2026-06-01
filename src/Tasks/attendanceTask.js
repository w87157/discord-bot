const cron = require("node-cron");
const { autoClaimFunction } = require("../Services/attendanceService");
const { createReportEmbed } = require("../Utils/attendanceEmbed");
const logger = require("../Utils/logger");

module.exports = (client) => {
  // 設定定時任務：每天早上 00:05 自動執行並發送到指定頻道
  cron.schedule(
    "5 0 * * *",
    async () => {
      logger.info("[AttendanceTask] 時鐘已到，觸發自動簽到任務...");
      const result = await autoClaimFunction();
      try {
        // 確保你的 .env 有定義 CHANNEL_ID
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        if (channel) {
          const embed = createReportEmbed(result);
          await channel.send({ embeds: [embed] });
          logger.info("[AttendanceTask] 成功將簽到報告發送至指定頻道。");
        } else {
          logger.warn(
            "[AttendanceTask] 找不到指定的發送頻道，請檢查 CHANNEL_ID 變數。",
          );
        }
      } catch (e) {
        logger.error(
          `[AttendanceTask] 發送定時訊息失敗: ${e.stack || e.message}`,
        );
      }
    },
    {
      timezone: "Asia/Taipei",
    },
  );

  // 記錄排程已成功啟動
  logger.info("[系統] 自動簽到 排程已載入完成");
};

const { Events, ActivityType } = require("discord.js");
const logger = require("../Utils/logger");
const startAttendanceTask = require("../Tasks/attendanceTask");
const startWeatherTask = require("../Tasks/weatherTask");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      // 記錄機器人成功連線與登入身分
      logger.info(`[系統] 機器人連線成功！已登入身分：${client.user.tag}`);
      logger.info(`[系統] 目前正在監聽 ${client.guilds.cache.size} 個伺服器`);

      // 設定機器人的狀態
      client.user.setActivity("伺服器運行中...", {
        type: ActivityType.Playing,
      });
      logger.info(`[系統] 機器人狀態 (Activity) 已更新`);

      // 啟動背景排程任務
      startAttendanceTask(client);
      startWeatherTask(client);
    } catch (error) {
      // 捕捉在啟動過程中發生的任何預期外錯誤 (例如模組載入失敗、網路斷線等)
      logger.error(
        `[錯誤] ready.js 啟動初始化時發生異常: ${error.stack || error.message}`,
      );
    }
  },
};

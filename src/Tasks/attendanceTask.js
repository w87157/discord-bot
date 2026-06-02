// src/Tasks/attendanceTask.js
const cron = require("node-cron");
const config = require("../../config");
const { autoClaimFunction } = require("../Services/attendanceService");
const supabase = require("../Services/supabase");
const logger = require("../Utils/logger");

const runDailyAttendance = async () => {
  logger.info("[AttendanceTask] ⏰ 執行全體定時自動簽到任務...");

  try {
    // 撈出所有使用者的憑證設定
    const { data: userConfigs, error } = await supabase
      .from("attendance_configs")
      .select("*");

    if (error) throw error;
    if (!userConfigs || userConfigs.length === 0) {
      logger.info("[AttendanceTask] 目前沒有任何使用者設定憑證，跳過簽到。");
      return;
    }

    // 依序幫每位使用者簽到
    for (const userConfig of userConfigs) {
      try {
        const result = await autoClaimFunction({
          cred: userConfig.cred,
          skGameRole: userConfig.sk_game_role,
        });

        logger.info(
          `[AttendanceTask] 使用者 ${userConfig.user_name} (${userConfig.account_name}) 執行結果: ${result.status}`,
        );

        // 為了避免同時發送大量請求導致被官方 API 封鎖或判定異常，建議每次請求間隔 2~3 秒
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } catch (userErr) {
        logger.error(
          `[AttendanceTask] 使用者 ${userConfig.user_name} 簽到失敗: ${userErr.message}`,
        );
      }
    }
  } catch (err) {
    logger.error(`[AttendanceTask] 執行全體簽到任務時發生錯誤: ${err.message}`);
  }
};

module.exports = (client) => {
  // 註冊背景定時排程 (讀取 config.js 裡設定好的時間)
  cron.schedule(
    config.attendance.schedule,
    async () => {
      await runDailyAttendance();
    },
    { timezone: config.attendance.timezone },
  );

  logger.info(
    `[系統] 自動簽到 排程已載入完成 (時區: ${config.attendance.timezone})`,
  );
};

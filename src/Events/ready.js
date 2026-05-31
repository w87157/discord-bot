const weatherTask = require("../Tasks/weatherTask");
const attendanceTask = require("../Tasks/attendanceTask");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`[系統] 機器人已上線：${client.user.tag}`);
    // 啟動定時任務
    weatherTask(client);
    attendanceTask(client);
  },
};

const weatherTask = require("../Tasks/weatherTask");

module.exports = (client) => {
  console.log(`✅ ${client.user.tag} 已就緒！`);

  // 註冊排程任務
  weatherTask(client);
};

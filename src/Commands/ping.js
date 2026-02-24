module.exports = {
  name: "ping",
  description: "測試機器人延遲",
  execute(message) {
    const pingTime = Date.now() - message.createdTimestamp;
    message.reply(`🏓 Pong! (延遲: ${pingTime}ms)`);
  },
};

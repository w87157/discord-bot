const config = require("../../config");
const weatherCmd = require("../commands/weather");

module.exports = async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // 簡單的指令分發
  if (commandName === "ping") {
    message.reply("pong!");
  } else if (commandName === "天氣") {
    await weatherCmd.execute(message, args);
  }
};

const config = require("../../config");
const logger = require("../Utils/logger");

module.exports = async (message) => {
  // 忽略機器人自身的訊息，或是沒有以指定 prefix 開頭的訊息
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // 從 Collection 中尋找指令
  const command = message.client.commands.get(commandName);

  if (!command) {
    // 若想知道使用者是否經常打錯文字指令，也可以在這裡加上 warn
    logger.warn(
      `[Message] 找不到文字指令: ${config.prefix}${commandName} (觸發者: ${message.author.tag})`,
    );
    return;
  }

  try {
    // 記錄誰執行了什麼文字指令
    logger.info(
      `[Message] 使用者 ${message.author.tag} 執行了文字指令: ${config.prefix}${commandName}`,
    );

    await command.execute(message, args);
  } catch (error) {
    logger.error(
      `[錯誤] 執行文字指令 ${config.prefix}${commandName} 時發生錯誤: ${error.stack || error.message}`,
    );
    message.reply("執行指令時發生錯誤！");
  }
};

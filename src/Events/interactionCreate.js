const logger = require("../Utils/logger");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    // 確認這是一個斜線指令 (Chat Input Command)
    if (!interaction.isChatInputCommand()) return;

    // 從 client 中取得對應的指令
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      // 使用 logger.warn 記錄找不到指令的警告
      logger.warn(
        `[Interaction] 找不到指令: /${interaction.commandName} (觸發者: ${interaction.user.tag})`,
      );
      return;
    }

    try {
      // 記錄誰執行了什麼指令
      logger.info(
        `[Interaction] 使用者 ${interaction.user.tag} 開始執行指令: /${interaction.commandName}`,
      );

      // 執行指令的 execute 函式
      await command.execute(interaction);
    } catch (error) {
      // 使用 logger.error 記錄詳細的錯誤堆疊 (Stack Trace)
      logger.error(
        `[錯誤] 執行斜線指令 /${interaction.commandName} 時發生錯誤: ${error.stack || error.message}`,
      );

      // 錯誤處理：如果已經回覆過(如使用了 deferReply)，則用 followUp；否則用 reply
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "執行此指令時發生錯誤！",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "執行此指令時發生錯誤！",
          ephemeral: true,
        });
      }
    }
  },
};

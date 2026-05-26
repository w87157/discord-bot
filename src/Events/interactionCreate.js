module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    // 確認這是一個斜線指令 (Chat Input Command)
    if (!interaction.isChatInputCommand()) return;

    // 從 client 中取得對應的指令
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`找不到指令 ${interaction.commandName}。`);
      return;
    }

    try {
      // 執行指令的 execute 函式
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      // 錯誤處理：如果已經回覆過(如使用了 deferReply)，則用 editReply；否則用 reply
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

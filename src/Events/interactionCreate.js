const { MessageFlags } = require("discord.js");

module.exports = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "help_menu") {
    const selected = interaction.values[0];

    // 根據選擇的值給予對應的回應或指引
    if (selected === "weather") {
      await interaction.reply({
        content: "請輸入 `!天氣 [城市]` 來查詢。",
        flags: [MessageFlags.Ephemeral],
      });
    } else if (selected === "subscribe") {
      await interaction.reply({
        content: "請輸入 `!訂閱 天氣 [城市]` 來開啟自動預報。",
        flags: [MessageFlags.Ephemeral],
      });
    } else if (selected === "ping") {
      // 也可以直接調用 ping 指令的邏輯
      const pingTime = Date.now() - interaction.createdTimestamp;
      await interaction.reply({
        content: `🏓 Pong! (延遲: ${pingTime}ms)`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  }
};

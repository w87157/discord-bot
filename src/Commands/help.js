const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const helpUi = require("../Utils/helpUi"); // 引入你的 UI 工具

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("查看機器人的功能清單與指令教學"),

  async execute(interaction) {
    try {
      // 1. 修正函式名稱為 helpUi.js 中實際匯出的 buildHelpEmbed
      const embedMessage = helpUi.buildHelpEmbed();

      // 2. 取得下拉式選單組件，讓使用者可以點擊互動
      const components = helpUi.buildHelpComponents();

      // 發送 Embed 與選單組件回覆
      await interaction.reply({
        embeds: [embedMessage],
        components: components,
      });
    } catch (error) {
      console.error("[指令錯誤] help:", error);

      // 如果 helpUi.js 發生問題，提供備用的純文字說明
      const fallbackText =
        `📖 **天氣機器人指令選單**\n\n` +
        `\`/weather [縣市]\` - 查詢特定縣市的即時天氣\n` +
        `\`/subscribe [縣市]\` - 在此頻道訂閱每日天氣預報 (限管理員)\n` +
        `\`/unsubscribe\` - 取消本頻道的訂閱 (限管理員)\n` +
        `\`/ping\` - 檢查機器人連線延遲`;

      // 3. 修正 ephemeral 警告，改用 MessageFlags.Ephemeral
      await interaction.reply({
        content: fallbackText,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

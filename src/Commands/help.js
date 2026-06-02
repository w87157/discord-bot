const {
  SlashCommandBuilder,
  ComponentType,
  MessageFlags,
} = require("discord.js");
const helpUi = require("../Utils/helpUi");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("查看功能清單與指令教學"),

  async execute(interaction) {
    try {
      // 預設為指令總表畫面
      let currentView = "main";

      // 產生初始的 Embed 與按鈕
      const embedMessage = helpUi.buildHelpEmbed(currentView);
      const components = helpUi.buildHelpComponents(currentView);

      // 發送訊息並取得該訊息的參照 (fetchReply: true 確保能建立收集器)
      await interaction.reply({
        embeds: [embedMessage],
        components: components,
      });

      const response = await interaction.fetchReply();

      // 建立按鈕收集器，有效時間設定為 5 分鐘 (300000 毫秒)
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000,
      });

      // 當有人點擊按鈕時觸發
      collector.on("collect", async (i) => {
        // 確保只有呼叫指令的本人可以點擊切換，其他人點擊會跳出警告
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "❌ 這不是您的指令選單，請自己輸入 `/help` 呼叫。",
            flags: MessageFlags.Ephemeral,
          });
        }

        // 判斷按下的按鈕並切換狀態
        if (i.customId === "show_help_tutorial") {
          currentView = "tutorial";
        } else if (i.customId === "show_help_main") {
          currentView = "main";
        }

        // 重新生成對應狀態的 Embed 與按鈕
        const updatedEmbed = helpUi.buildHelpEmbed(currentView);
        const updatedComponents = helpUi.buildHelpComponents(currentView);

        // 更新原本的那則訊息 (覆蓋舊畫面)
        await i.update({
          embeds: [updatedEmbed],
          components: updatedComponents,
        });
      });

      // 時間到之後，自動把按鈕移除，避免產生無效的互動
      collector.on("end", async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (e) {
          // 防止因為訊息在時間到之前已被使用者刪除而報錯
        }
      });
    } catch (error) {
      console.error("[指令錯誤] help:", error);

      // 如果發生錯誤，提供備用的純文字說明
      const fallbackText =
        `📖 **機器人指令選單**\n\n` +
        `【🌤️ 天氣預報】\n` +
        `\`/weather [縣市]\` - 查詢特定縣市的即時天氣\n` +
        `\`/subscribe [縣市]\` - 在此頻道訂閱每日天氣預報\n` +
        `\`/unsubscribe\` - 取消本頻道的訂閱\n\n` +
        `【🎮 遊戲簽到】\n` +
        `\`/set_profile\` - 設定個人的終末地簽到憑證 (回應僅您可見)\n` +
        `\`/claim\` - 手動執行個人的自動簽到任務\n\n` +
        `【🛠️ 其他】\n` +
        `\`/ping\` - 檢查機器人連線延遲`;

      // 確保回覆僅使用者可見
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: fallbackText,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};

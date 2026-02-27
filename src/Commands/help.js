const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

module.exports = {
  name: "功能",
  description: "顯示指令總表選單",
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🤖 機器人指令總表")
      .setDescription("請從下方選單選擇你想執行的功能：")
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("選擇一個指令...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("即時天氣查詢")
          .setDescription("查詢指定城市目前的氣象預報")
          .setEmoji("🌦️")
          .setValue("weather"),
        new StringSelectMenuOptionBuilder()
          .setLabel("訂閱每日預報")
          .setDescription("每天早上自動推送天氣資訊")
          .setEmoji("🔔")
          .setValue("subscribe"),
        new StringSelectMenuOptionBuilder()
          .setLabel("延遲測試")
          .setDescription("檢查機器人連線速度")
          .setEmoji("🏓")
          .setValue("ping"),
      );

    const row = new ActionRowBuilder().addComponents(select);

    await message.reply({
      embeds: [embed],
      components: [row],
    });
  },
};

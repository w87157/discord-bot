const { SlashCommandBuilder } = require("discord.js");
const { autoClaimFunction } = require("../Services/attendanceService");
const { createReportEmbed } = require("../Utils/attendanceEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("手動執行自動簽到任務"),

  async execute(interaction) {
    // 因為 API 請求可能需要一點時間，先 deferReply 避免超時
    await interaction.deferReply();

    try {
      const result = await autoClaimFunction();
      const embed = createReportEmbed(result);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ 執行簽到時發生錯誤，請查看後台日誌。");
    }
  },
};

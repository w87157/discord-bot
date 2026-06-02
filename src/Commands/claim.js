const { SlashCommandBuilder } = require("discord.js");
const { autoClaimFunction } = require("../Services/attendanceService");
const { createReportEmbed } = require("../Utils/attendanceEmbed");
const supabase = require("../Services/supabase");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("手動執行個人的自動簽到任務"),

  async execute(interaction) {
    // 使用 ephemeral 避免個人的簽到結果刷屏或洩漏隱私（可自行調整）
    await interaction.deferReply({ ephemeral: true });

    try {
      // 搜尋該使用者的設定
      const { data: config, error } = await supabase
        .from("attendance_configs")
        .select("*")
        .eq("user_id", interaction.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!config) {
        return await interaction.editReply(
          "❌ 您尚未設定簽到憑證！請先使用 `/set_profile` 指令進行設定。",
        );
      }

      // 帶入資料庫撈出來的個人憑證執行
      const result = await autoClaimFunction({
        cred: config.cred,
        skGameRole: config.sk_game_role,
      });

      const embed = createReportEmbed(result);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ 執行簽到時發生錯誤，請查看後台日誌。");
    }
  },
};

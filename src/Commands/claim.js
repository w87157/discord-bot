const { SlashCommandBuilder } = require("discord.js");
const { autoClaimFunction } = require("../Services/attendanceService");
const { createReportEmbed } = require("../Utils/attendanceEmbed");
const supabase = require("../Services/supabase");
const { decrypt } = require("../Utils/crypto");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("手動執行個人的自動簽到任務"),

  async execute(interaction) {
    // 使用 ephemeral 避免個人的簽到結果刷屏或洩漏隱私
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

      const decryptedCred = decrypt(config.cred);
      const decryptedRole = decrypt(config.sk_game_role);

      // 防護機制：如果解密失敗，提示使用者重新設定
      if (!decryptedCred || !decryptedRole) {
        return await interaction.editReply(
          "❌ 您的簽到憑證解密失敗！可能系統安全金鑰已重置，請重新使用 `/set_profile` 指令覆蓋設定。",
        );
      }

      // 帶入解密後的個人憑證執行
      const result = await autoClaimFunction({
        cred: decryptedCred,
        skGameRole: decryptedRole,
      });

      const embed = createReportEmbed(result);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ 執行簽到時發生錯誤，請查看後台日誌。");
    }
  },
};

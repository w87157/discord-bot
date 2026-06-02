const { SlashCommandBuilder } = require("discord.js");
const supabase = require("../Services/supabase");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set_profile")
    .setDescription("設定個人的終末地簽到憑證 (回應僅您可見)")
    .addStringOption((option) =>
      option
        .setName("cred")
        .setDescription("請輸入您的 ENDFIELD_CRED")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("role_id")
        .setDescription("請輸入您的 SK_GAME_ROLE ID")
        .setRequired(true),
    ),

  async execute(interaction) {
    // 確保回應只有使用者自己看得到，保護隱私
    await interaction.deferReply({ ephemeral: true });

    const cred = interaction.options.getString("cred");
    const skGameRole = interaction.options.getString("role_id");

    try {
      const { error } = await supabase.from("attendance_configs").upsert(
        {
          user_id: interaction.user.id,
          user_name: interaction.user.username,
          cred: cred,
          sk_game_role: skGameRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      await interaction.editReply({
        content: `✅ **帳號憑證設定成功！**\n排程系統將會在每日定時幫您自動簽到。`,
      });
    } catch (error) {
      console.error("[指令錯誤] set_profile:", error);
      await interaction.editReply({
        content: "❌ 儲存憑證時發生錯誤，請稍後再試或聯絡管理員。",
      });
    }
  },
};

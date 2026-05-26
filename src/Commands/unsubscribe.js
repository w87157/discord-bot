const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { unsubscribeWeather } = require("../Services/subscriptionService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unsubscribe")
    .setDescription("取消本頻道的天氣預報訂閱")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // 傳入 channel 物件與觸發指令的使用者 ID
      const result = await unsubscribeWeather(
        interaction.channel,
        interaction.user.id,
      );

      if (result.hasSub) {
        await interaction.editReply(
          "✅ **成功取消訂閱！**\n本頻道將不再收到定時天氣預報。",
        );
      } else {
        await interaction.editReply(
          "⚠️ 本頻道目前**沒有**任何由您設定的天氣預報訂閱紀錄。",
        );
      }
    } catch (error) {
      console.error("[指令錯誤] unsubscribe:", error);
      await interaction.editReply(
        "❌ 取消訂閱時發生錯誤，請稍後再試或聯絡管理員。",
      );
    }
  },
};

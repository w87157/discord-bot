const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { subscribeWeather } = require("../Services/subscriptionService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("訂閱每日天氣預報到此頻道")
    .addStringOption((option) =>
      option
        .setName("city")
        .setDescription("請輸入要訂閱的縣市名稱 (例如: 台北市)")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const city = interaction.options.getString("city");
    await interaction.deferReply();

    try {
      // 傳入資料庫所需的物件欄位
      await subscribeWeather({
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        channelId: interaction.channel.id,
        userId: interaction.user.id,
        userName: interaction.user.username,
        cityName: city,
      });

      await interaction.editReply(
        `✅ **訂閱成功！**\n本頻道將會定時收到 **${city}** 的天氣預報。`,
      );
    } catch (error) {
      console.error("[指令錯誤] subscribe:", error);
      await interaction.editReply(
        "❌ 設定訂閱時發生錯誤，請稍後再試或聯絡管理員。",
      );
    }
  },
};

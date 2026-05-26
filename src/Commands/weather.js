const { SlashCommandBuilder } = require("discord.js");
const { fetchWeather } = require("../Services/cwaService");
const { buildWeatherEmbed } = require("../Utils/weatherEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("查詢特定縣市的天氣")
    .addStringOption((option) =>
      option
        .setName("city")
        .setDescription("請輸入縣市名稱 (例如: 台北市)")
        .setRequired(true),
    ),

  async execute(interaction) {
    const city = interaction.options.getString("city");

    // 讓機器人顯示「思考中...」避免超時
    await interaction.deferReply();

    try {
      // 呼叫天氣 API，dayOffset: 1 代表取得明日預報（符合 embed 標題設計）
      const weatherData = await fetchWeather(city, { dayOffset: 1 });

      if (!weatherData) {
        return await interaction.editReply(
          `❌ 找不到 **${city}** 的天氣資料，請確認縣市名稱是否正確。`,
        );
      }

      // 產生 Embed 面板
      const embed = buildWeatherEmbed(weatherData);

      // 回傳結果
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply("查詢天氣時發生錯誤，請稍後再試。");
    }
  },
};

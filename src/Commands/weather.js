const { EmbedBuilder } = require("discord.js");
const { getWeather } = require("../Services/cwaService");

module.exports = {
  name: "天氣",
  async execute(message, args) {
    const city = args.join("") || "臺北市";
    const data = await getWeather(city);

    if (!data) return message.reply("找不到該城市的天氣資訊。");

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🌦️ ${data.location} 天氣預報`)
      .addFields(
        {
          name: "溫度",
          value: `${data.MinT}°C ~ ${data.MaxT}°C`,
          inline: true,
        },
        { name: "降雨機率", value: `${data.PoP}%`, inline: true },
        { name: "天氣狀態", value: data.Wx },
      )
      .setFooter({ text: `${data.dateLabel} 全日預報` });

    await message.reply({ embeds: [embed] });
  },
};

const { EmbedBuilder } = require("discord.js");

function buildWeatherEmbed(data) {
  return new EmbedBuilder()
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
}

module.exports = { buildWeatherEmbed };

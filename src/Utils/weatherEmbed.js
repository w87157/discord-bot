const { EmbedBuilder } = require("discord.js");

function buildWeatherEmbed(data) {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`🌦️ ${data.location} 明日天氣預報`)
    .addFields(
      {
        name: "溫度",
        value: `${data.minT}°C ~ ${data.maxT}°C`,
        inline: true,
      },
      { name: "降雨機率", value: `${data.pop}%`, inline: true },
      { name: "天氣狀態", value: data.wx },
    )
    .setFooter({ text: `${data.dateLabel} ${data.dayLabel}全日預報` });
}

module.exports = { buildWeatherEmbed };

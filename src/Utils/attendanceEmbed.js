const { EmbedBuilder } = require("discord.js");

function createReportEmbed(result) {
  const embedColor = result.success ? 0x57f287 : 0xed4245; // 綠色 或 紅色
  return new EmbedBuilder()
    .setTitle("📡 明日方舟：終末地 簽到回報")
    .setColor(embedColor)
    .addFields(
      { name: "👤 帳號名稱", value: result.name, inline: true },
      { name: "📊 狀態", value: result.status, inline: true },
      { name: "🎁 獎勵內容", value: result.rewards || "無" },
    )
    .setFooter({
      text: `執行時間: ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
    })
    .setThumbnail(
      "https://pbs.twimg.com/profile_images/1984225639407529984/2_3-HRTS_400x400.jpg",
    );

  return embed;
}

module.exports = {
  createReportEmbed,
};

const cron = require("node-cron");
const config = require("../../config");
const { EmbedBuilder } = require("discord.js");
const { fetchWeather } = require("../Services/cwaService");
const supabase = require("../Services/supabase");

const sendWeatherReports = async (client) => {
  console.log("⏰ 執行定時天氣發送任務 (資料庫排程)...");

  try {
    const { data: subs, error } = await supabase
      .from("weather_subscriptions")
      .select("*");

    if (error) throw error;
    if (!subs || subs.length === 0) {
      console.log("目前沒有任何訂閱資料。");
      return;
    }

    for (const sub of subs) {
      const data = await fetchWeather(sub.city);
      if (!data) {
        console.error(`無法獲取城市天氣: ${sub.city}`);
        continue;
      }

      try {
        const channel = await client.channels.fetch(sub.channel_id);
        if (channel) {
          if (sub.last_message_id) {
            try {
              const oldMsg = await channel.messages.fetch(sub.last_message_id);
              if (oldMsg) await oldMsg.delete();
            } catch (err) {
              console.log(`無法刪除舊訊息。`);
            }
          }

          const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle(`🌅 每日天氣預報 - ${data.location}`)
            .addFields(
              {
                name: "🌡️ 溫度範圍",
                value: `${data.minT}°C ~ ${data.maxT}°C`,
                inline: true,
              },
              { name: "☔ 降雨機率", value: `${data.pop}%`, inline: true },
              { name: "\u200B", value: "\u200B", inline: true },
              { name: "☁️ 天氣狀態", value: data.wx, inline: true },
              { name: "🏃 舒適度評估", value: data.ci, inline: true },
              { name: "\u200B", value: "\u200B", inline: true },
            )
            .setFooter({
              text: `${data.dateLabel} ${data.dayLabel}全日預報`,
            });

          const sentMsg = await channel.send({
            embeds: [embed],
          });

          await supabase
            .from("weather_subscriptions")
            .update({ last_message_id: sentMsg.id })
            .match({ channel_id: sub.channel_id, user_id: sub.user_id });
        }
      } catch (err) {
        console.error(`頻道 ${sub.channel_id} 發送失敗:`, err.message);
      }
    }
  } catch (err) {
    console.error("執行定時任務時發生錯誤:", err);
  }
};

module.exports = (client) => {
  sendWeatherReports(client);

  cron.schedule(
    config.weather.schedule,
    async () => {
      await sendWeatherReports(client);
    },
    { timezone: config.weather.timezone },
  );
};

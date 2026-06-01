const cron = require("node-cron");
const config = require("../../config");
const { EmbedBuilder } = require("discord.js");
const { fetchWeather } = require("../Services/cwaService");
const supabase = require("../Services/supabase");
const logger = require("../Utils/logger");

const sendWeatherReports = async (client) => {
  logger.info("[WeatherTask] ⏰ 執行定時天氣發送任務 (資料庫排程)...");

  try {
    const { data: subs, error } = await supabase
      .from("weather_subscriptions")
      .select("*");

    if (error) throw error;
    if (!subs || subs.length === 0) {
      logger.info("[WeatherTask] 目前沒有任何訂閱資料，跳過播報。");
      return;
    }

    for (const sub of subs) {
      const data = await fetchWeather(sub.city);
      if (!data) {
        logger.error(`[WeatherTask] 無法從 API 獲取城市天氣資料: ${sub.city}`);
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
              logger.warn(
                `[WeatherTask] 無法刪除舊訊息 (頻道: ${sub.channel_id}, 訊息 ID: ${sub.last_message_id})`,
              );
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

          logger.info(
            `[WeatherTask] 成功發送 ${data.location} 的預報至頻道 ${sub.channel_id}`,
          );
        }
      } catch (err) {
        logger.error(
          `[WeatherTask] 發送預報至頻道 ${sub.channel_id} 失敗: ${err.stack || err.message}`,
        );
      }
    }
  } catch (err) {
    logger.error(
      `[WeatherTask] 執行天氣定時任務時發生錯誤: ${err.stack || err.message}`,
    );
  }
};

module.exports = (client) => {
  // 啟動機器人時先執行一次
  sendWeatherReports(client);

  // 註冊背景定時排程
  cron.schedule(
    config.weather.schedule,
    async () => {
      await sendWeatherReports(client);
    },
    { timezone: config.weather.timezone },
  );

  // 記錄排程已成功啟動
  logger.info(
    `[系統] 天氣預報 排程已載入完成 (時區: ${config.weather.timezone})`,
  );
};

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

    const weatherCache = {};

    for (const sub of subs) {
      // 檢查快取中是否已經有該城市的資料，若無才向 API 請求
      if (!weatherCache[sub.city]) {
        logger.info(`[WeatherTask] 正在向 API 獲取 ${sub.city} 的天氣資料...`);
        const fetchedData = await fetchWeather(sub.city);
        // 將結果存入快取 (若 API 發生錯誤回傳 null，也會存起來避免重複失敗請求)
        weatherCache[sub.city] = fetchedData;
      }

      // 從快取取得對應城市的資料
      const data = weatherCache[sub.city];

      if (!data) {
        logger.error(
          `[WeatherTask] 無法獲取城市天氣資料: ${sub.city}，已跳過該筆發送任務。`,
        );
        continue;
      }

      try {
        const channel = await client.channels.fetch(sub.channel_id);
        if (channel) {
          // 若有上一則天氣訊息的 ID，嘗試將其刪除以保持頻道整潔
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

          // 建立天氣預報的 Embed 訊息
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

          // 發送訊息至頻道
          const sentMsg = await channel.send({
            embeds: [embed],
          });

          // 更新資料庫中該筆訂閱紀錄的最新訊息 ID
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

const supabase = require("./supabase");
const { formatCityName } = require("../Utils/helper");
const logger = require("../Utils/logger"); // 引入 logger

async function subscribeWeather({
  guildId,
  guildName,
  channelId,
  userId,
  userName,
  cityName,
}) {
  const city = formatCityName(cityName);
  logger.info(
    `[SubscriptionService] 處理訂閱請求: 使用者 ${userName} 訂閱 ${city} (頻道: ${channelId})`,
  );

  const { error } = await supabase.from("weather_subscriptions").upsert(
    {
      guild_id: guildId,
      guild_name: guildName,
      channel_id: channelId,
      user_id: userId,
      user_name: userName,
      city,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "channel_id,user_id" },
  );

  if (error) {
    logger.error(`[SubscriptionService] 寫入訂閱資料庫失敗: ${error.message}`);
    throw error;
  }

  logger.info(
    `[SubscriptionService] 成功更新/新增訂閱資料 (使用者: ${userName}, 城市: ${city})`,
  );
  return { city };
}

async function unsubscribeWeather(channel, userId) {
  logger.info(
    `[SubscriptionService] 處理取消訂閱請求 (使用者 ID: ${userId}, 頻道: ${channel.id})`,
  );

  const { data: existing, error: fetchErr } = await supabase
    .from("weather_subscriptions")
    .select("last_message_id")
    .eq("channel_id", channel.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) {
    logger.error(`[SubscriptionService] 查詢訂閱紀錄失敗: ${fetchErr.message}`);
    throw fetchErr;
  }

  if (!existing) {
    logger.info(`[SubscriptionService] 找不到使用者的訂閱紀錄，無需取消。`);
    return { hasSub: false };
  }

  if (existing.last_message_id) {
    try {
      const oldMsg = await channel.messages.fetch(existing.last_message_id);
      if (oldMsg) {
        await oldMsg.delete();
        logger.info(
          `[SubscriptionService] 已連帶刪除舊的天氣預報訊息 (ID: ${existing.last_message_id})`,
        );
      }
    } catch (err) {
      logger.warn(
        `[SubscriptionService] 嘗試刪除舊訊息失敗 (可能已被手動刪除或無權限): ${err.message}`,
      );
    }
  }

  const { error } = await supabase
    .from("weather_subscriptions")
    .delete()
    .eq("channel_id", channel.id)
    .eq("user_id", userId);

  if (error) {
    logger.error(
      `[SubscriptionService] 刪除資料庫訂閱紀錄失敗: ${error.message}`,
    );
    throw error;
  }

  logger.info(`[SubscriptionService] 成功刪除使用者的訂閱紀錄。`);
  return { hasSub: true };
}

module.exports = { subscribeWeather, unsubscribeWeather };

const supabase = require("./supabase");
const { formatCityName } = require("../Utils/helper");

async function subscribeWeather({
  guildId,
  guildName,
  channelId,
  userId,
  userName,
  cityName,
}) {
  const city = formatCityName(cityName);

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

  if (error) throw error;
  return { city };
}

async function unsubscribeWeather(channel, userId) {
  const { data: existing, error: fetchError } = await supabase
    .from("weather_subscriptions")
    .select("last_message_id")
    .eq("channel_id", channel.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) return { found: false };

  if (existing.last_message_id) {
    try {
      const oldMsg = await channel.messages.fetch(existing.last_message_id);
      if (oldMsg) await oldMsg.delete();
    } catch {
      // 訊息可能已刪除或無權限
    }
  }

  const { error } = await supabase
    .from("weather_subscriptions")
    .delete()
    .eq("channel_id", channel.id)
    .eq("user_id", userId);

  if (error) throw error;
  return { found: true };
}

module.exports = { subscribeWeather, unsubscribeWeather };

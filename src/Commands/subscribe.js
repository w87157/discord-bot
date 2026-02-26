const supabase = require("../Services/supabase");
const { formatCityName } = require("../Utils/helper");

module.exports = {
  name: "訂閱",
  description: "訂閱每日天氣預報",
  async execute(message, args) {
    // 預期格式: !訂閱 天氣 臺北市
    const subType = args[0];
    const cityName = args[1];

    if (subType !== "天氣" || !cityName) {
      return message.reply("❌ 指令格式錯誤。請使用：`!訂閱 天氣 [城市名稱]`");
    }

    const formattedCity = formatCityName(cityName);
    const guildId = message.guild?.id || "DM"; // 如果是私訊則紀錄為 DM
    const channelId = message.channel.id;
    const userId = message.author.id;
    const userName = message.author.username;

    try {
      const { error } = await supabase.from("weather_subscriptions").upsert(
        {
          guild_id: guildId,
          channel_id: channelId,
          user_id: userId,
          user_name: userName,
          city: formattedCity,
        },
        { onConflict: "channel_id,user_id" },
      ); // 根據這兩個欄位判斷是否重複

      if (error) throw error;

      await message.reply(
        `✅ 訂閱成功！`,
      );
    } catch (error) {
      console.error("訂閱錯誤:", error);
      await message.reply("❌ 訂閱失敗。");
    }
  },
};

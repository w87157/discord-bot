const { unsubscribeWeather } = require("../Services/subscriptionService");

module.exports = {
  name: "取消訂閱",
  description: "取消每日天氣預報訂閱",
  async execute(message, args) {
    const subType = args[0];

    if (subType !== "天氣") {
      return message.reply("❌ 指令格式錯誤。請使用：`!取消訂閱 天氣`");
    }

    try {
      const result = await unsubscribeWeather(
        message.channel,
        message.author.id,
      );

      if (!result.found) {
        return message.reply("❌ 你在此頻道沒有天氣訂閱。");
      }

      await message.reply("✅ 已取消天氣訂閱，此頻道不再自動推送預報。");
    } catch (error) {
      console.error("取消訂閱錯誤:", error);
      await message.reply("❌ 取消訂閱失敗。");
    }
  },
};

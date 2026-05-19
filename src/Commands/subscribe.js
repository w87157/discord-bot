const config = require("../../config");
const { subscribeWeather } = require("../Services/subscriptionService");
const { formatScheduleTime } = require("../Utils/helpUi");

module.exports = {
  name: "訂閱",
  description: "訂閱每日天氣預報",
  async execute(message, args) {
    const subType = args[0];
    const cityName = args[1];

    if (subType !== "天氣" || !cityName) {
      return message.reply("❌ 指令格式錯誤。請使用：`!訂閱 天氣 [城市名稱]`");
    }

    try {
      const { city } = await subscribeWeather({
        guildId: message.guild?.id || "DM",
        guildName: message.guild?.name || "私訊",
        channelId: message.channel.id,
        userId: message.author.id,
        userName: message.author.username,
        cityName,
      });

      const scheduleTime = formatScheduleTime(config.weather.schedule);
      await message.reply(
        `✅ 已訂閱 **${city}** 的每日預報！\n將於每日 **${scheduleTime}**（${config.weather.timezone}）推送到此頻道。`,
      );
    } catch (error) {
      console.error("訂閱錯誤:", error);
      await message.reply("❌ 訂閱失敗。");
    }
  },
};

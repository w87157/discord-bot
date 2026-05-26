const config = require("../../config");
const { fetchWeather } = require("../Services/cwaService");
const { formatCityName } = require("../Utils/helper");
const { buildWeatherEmbed } = require("../Utils/weatherEmbed");

module.exports = {
  name: "天氣",
  async execute(message, args) {
    const city = formatCityName(args.join("")) || config.weather.defaultCity;
    const data = await fetchWeather(city, { dayOffset: 1 });

    if (!data) return message.reply("找不到該城市的天氣資訊。");

    await message.reply({ embeds: [buildWeatherEmbed(data)] });
  },
};

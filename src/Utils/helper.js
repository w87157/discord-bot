module.exports = {
  /**
   * 格式化城市名稱，將「台」轉為「臺」，並補齊「縣/市」
   */
  formatCityName(name) {
    if (!name) return "臺北市";
    let city = name.replaceAll("台", "臺");

    const cityList = [
      "臺北",
      "新北",
      "桃園",
      "臺中",
      "臺南",
      "高雄",
      "基隆",
      "新竹",
      "嘉義",
      "彰化",
      "南投",
      "雲林",
      "屏東",
      "宜蘭",
      "花蓮",
      "臺東",
      "澎湖",
      "金門",
      "連江",
    ];

    if (cityList.includes(city)) {
      city += city === "金門" || city === "連江" ? "縣" : "市";
    }
    return city;
  },
};

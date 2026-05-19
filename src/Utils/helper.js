/** F-C0032-001 支援的縣市（完整名稱，供下拉選單使用） */
const CITIES = [
  "臺北市",
  "新北市",
  "桃園市",
  "臺中市",
  "臺南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "臺東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
];

const SHORT_NAMES = new Set([
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
  "苗栗",
]);

module.exports = {
  CITIES,

  /**
   * 格式化城市名稱，將「台」轉為「臺」，並補齊「縣/市」
   */
  formatCityName(name) {
    if (!name) return "臺北市";
    let city = name.replaceAll("台", "臺");

    if (CITIES.includes(city)) return city;

    if (SHORT_NAMES.has(city)) {
      city += city === "金門" || city === "連江" || city === "苗栗" ? "縣" : "市";
    }
    return city;
  },
};

const { formatCityName } = require("../Utils/helper");

async function getWeather(locationName) {
  const city = formatCityName(locationName);
  // 這裡可以引用 utils/helper.js 的轉換邏輯，先簡單寫在 service 中
  const base = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";
  const url = new URL(base);
  url.searchParams.set("Authorization", process.env.CWA_API_KEY);
  url.searchParams.set("format", "JSON");
  url.searchParams.set("locationName", city);

  try {
    const res = await fetch(url.toString());
    const json = await res.json();
    const loc = json?.records?.location?.[0];
    if (!loc) return null;

    const map = {};
    for (const el of loc.weatherElement || []) {
      map[el.elementName] = el.time || [];
    }
    const pick = (name) =>
      map?.[name]?.[0]?.parameter?.parameterName ?? "無資料";

    return {
      location: loc.locationName,
      Wx: pick("Wx"),
      PoP: pick("PoP"),
      MinT: pick("MinT"),
      MaxT: pick("MaxT"),
      CI: pick("CI"),
      startTime: map?.Wx?.[0]?.startTime ?? "未知",
    };
  } catch (err) {
    console.error("CWA API Error:", err);
    return null;
  }
}

module.exports = { getWeather };

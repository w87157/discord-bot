const { formatCityName } = require("../Utils/helper");

/**
 * 過濾出「今天 00:00 ~ 23:59」範圍內的時段
 * CWA F-C0032-001 每個要素各自有自己的時段切割，不能用 index 對齊，
 * 因此每個要素都各自過濾一次。
 */
function getTodaySlots(timeArray) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  return timeArray.filter((slot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    // 只要時段與今天有任何交集就納入
    return start <= todayEnd && end >= todayStart;
  });
}

function pickValues(slots) {
  return slots
    .map((s) => s?.parameter?.parameterName)
    .filter((v) => v !== undefined && v !== null);
}

async function getWeather(locationName) {
  const city = formatCityName(locationName);
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

    // 將各要素整理成 map
    const map = {};
    for (const el of loc.weatherElement || []) {
      map[el.elementName] = el.time || [];
    }

    // 取今天的時段
    const wxSlots = getTodaySlots(map["Wx"] || []);
    const popSlots = getTodaySlots(map["PoP"] || []);
    const minTSlots = getTodaySlots(map["MinT"] || []);
    const maxTSlots = getTodaySlots(map["MaxT"] || []);
    const ciSlots = getTodaySlots(map["CI"] || []);

    // MinT：今日所有時段最低溫
    const minTValues = pickValues(minTSlots).map(Number);
    const MinT = minTValues.length ? Math.min(...minTValues) : "無資料";

    // MaxT：今日所有時段最高溫
    const maxTValues = pickValues(maxTSlots).map(Number);
    const MaxT = maxTValues.length ? Math.max(...maxTValues) : "無資料";

    // PoP：今日所有時段最大降雨機率
    const popValues = pickValues(popSlots).map(Number);
    const PoP = popValues.length ? Math.max(...popValues) : "無資料";

    // Wx：取今天第一個時段的天氣狀態描述（最具代表性）
    const Wx = wxSlots[0]?.parameter?.parameterName ?? "無資料";

    // CI：取今天第一個時段的舒適度
    const CI = ciSlots[0]?.parameter?.parameterName ?? "無資料";

    // 回傳時段範圍標示（今天 00:00 ~ 24:00）
    const now = new Date();
    const dateStr = now.toLocaleDateString("zh-TW", {
      month: "long",
      day: "numeric",
    });

    return {
      location: loc.locationName,
      Wx,
      PoP,
      MinT,
      MaxT,
      CI,
      dateLabel: dateStr, // 例如「3月6日」
    };
  } catch (err) {
    console.error("CWA API Error:", err);
    return null;
  }
}

module.exports = { getWeather };

const { formatCityName } = require("../Utils/helper");

/** CWA 回傳的時間為台灣當地時間，需明確加上 +08:00（避免 VM 在 UTC 時解析錯誤） */
function parseCwaTime(timeStr) {
  return new Date(`${timeStr.replace(" ", "T")}+08:00`);
}

function toTaipeiDateStr(date) {
  return date
    .toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
}

/**
 * 取得台灣時區（Asia/Taipei）的日期字串，格式 YYYY-MM-DD
 * @param {number} offsetDays 0 = 今天，1 = 明天
 */
function getTaipeiDateStr(offsetDays = 0) {
  const ms = Date.now() + offsetDays * 86400000;
  return toTaipeiDateStr(new Date(ms));
}

function getSlotDateStr(startTime) {
  return toTaipeiDateStr(parseCwaTime(startTime));
}

/**
 * 過濾出指定日 00:00 ~ 23:59（台灣時間）範圍內的時段
 */
function getSlotsForDateStr(timeArray, dateStr) {
  const dayStart = new Date(`${dateStr}T00:00:00+08:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59+08:00`);

  return timeArray.filter((slot) => {
    const start = parseCwaTime(slot.startTime);
    const end = parseCwaTime(slot.endTime);
    return start <= dayEnd && end >= dayStart;
  });
}

/**
 * 決定要彙整的目標日期。
 * 查詢今日時，若 API 已無今日時段（常見於傍晚後資料更新），
 * 改採回傳資料中最早一天的時段，避免啟動推播出現「無資料」。
 */
function resolveTargetDateStr(wxArray, dayOffset) {
  const targetStr = getTaipeiDateStr(dayOffset);
  if (getSlotsForDateStr(wxArray, targetStr).length > 0) return targetStr;
  if (dayOffset !== 0 || wxArray.length === 0) return targetStr;
  return getSlotDateStr(wxArray[0].startTime);
}

function getDayLabel(targetDateStr) {
  if (targetDateStr === getTaipeiDateStr(0)) return "今日";
  if (targetDateStr === getTaipeiDateStr(1)) return "明日";
  return "";
}
function pickValues(slots) {
  return slots
    .map((s) => s?.parameter?.parameterName)
    .filter((v) => v !== undefined && v !== null);
}

/**
 * @param {string} locationName
 * @param {{ dayOffset?: number }} [options] dayOffset: 0 = 今天，1 = 明天
 */
async function getWeather(locationName, options = {}) {
  const { dayOffset = 0 } = options;
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

    const wxArray = map["Wx"] || [];
    const targetDateStr = resolveTargetDateStr(wxArray, dayOffset);

    const wxSlots = getSlotsForDateStr(wxArray, targetDateStr);
    const popSlots = getSlotsForDateStr(map["PoP"] || [], targetDateStr);
    const minTSlots = getSlotsForDateStr(map["MinT"] || [], targetDateStr);
    const maxTSlots = getSlotsForDateStr(map["MaxT"] || [], targetDateStr);
    const ciSlots = getSlotsForDateStr(map["CI"] || [], targetDateStr);

    // MinT：該日所有時段最低溫
    const minTValues = pickValues(minTSlots).map(Number);
    const MinT = minTValues.length ? Math.min(...minTValues) : "無資料";

    // MaxT：該日所有時段最高溫
    const maxTValues = pickValues(maxTSlots).map(Number);
    const MaxT = maxTValues.length ? Math.max(...maxTValues) : "無資料";

    // PoP：該日所有時段最大降雨機率
    const popValues = pickValues(popSlots).map(Number);
    const PoP = popValues.length ? Math.max(...popValues) : "無資料";

    // Wx：取該日第一個時段的天氣狀態描述（最具代表性）
    const Wx = wxSlots[0]?.parameter?.parameterName ?? "無資料";

    // CI：取該日第一個時段的舒適度
    const CI = ciSlots[0]?.parameter?.parameterName ?? "無資料";

    const labelDate = parseCwaTime(
      `${targetDateStr}T12:00:00`,
    ).toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
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
      dateLabel: labelDate, // 例如「5月20日」
      // 定時推播（dayOffset=0）固定標示「今日」；手動查明日則依實際日期標示
      dayLabel:
        dayOffset === 0 ? "今日" : getDayLabel(targetDateStr) || "明日",
    };
  } catch (err) {
    console.error("CWA API Error:", err);
    return null;
  }
}

module.exports = { getWeather };

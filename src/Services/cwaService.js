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
function resolveTargetDateStr(wxSlots, dayOffset) {
  const targetStr = getTaipeiDateStr(dayOffset);
  if (getSlotsForDateStr(wxSlots, targetStr).length > 0) return targetStr;
  if (dayOffset !== 0 || wxSlots.length === 0) return targetStr;
  return getSlotDateStr(wxSlots[0].startTime);
}

function getDayLabel(targetDateStr) {
  if (targetDateStr === getTaipeiDateStr(0)) return "今日";
  if (targetDateStr === getTaipeiDateStr(1)) return "明日";
  return "";
}

function pickValues(slots) {
  return slots
    .map((slot) => slot?.parameter?.parameterName)
    .filter((val) => val !== undefined && val !== null);
}

/**
 * @param {string} locationName
 * @param {{ dayOffset?: number }} [options] dayOffset: 0 = 今天，1 = 明天
 */
async function fetchWeather(locationName, options = {}) {
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

    const elMap = {};
    for (const el of loc.weatherElement || []) {
      elMap[el.elementName] = el.time || [];
    }

    const wxSlots = elMap["Wx"] || [];
    const targetDateStr = resolveTargetDateStr(wxSlots, dayOffset);

    const wxDaySlots = getSlotsForDateStr(wxSlots, targetDateStr);
    const popSlots = getSlotsForDateStr(elMap["PoP"] || [], targetDateStr);
    const minTSlots = getSlotsForDateStr(elMap["MinT"] || [], targetDateStr);
    const maxTSlots = getSlotsForDateStr(elMap["MaxT"] || [], targetDateStr);
    const ciSlots = getSlotsForDateStr(elMap["CI"] || [], targetDateStr);

    const minTValues = pickValues(minTSlots).map(Number);
    const minT = minTValues.length ? Math.min(...minTValues) : "無資料";

    const maxTValues = pickValues(maxTSlots).map(Number);
    const maxT = maxTValues.length ? Math.max(...maxTValues) : "無資料";

    const popValues = pickValues(popSlots).map(Number);
    const pop = popValues.length ? Math.max(...popValues) : "無資料";

    const wx = wxDaySlots[0]?.parameter?.parameterName ?? "無資料";
    const ci = ciSlots[0]?.parameter?.parameterName ?? "無資料";

    const labelDate = parseCwaTime(
      `${targetDateStr}T12:00:00`,
    ).toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
      month: "long",
      day: "numeric",
    });

    return {
      location: loc.locationName,
      wx,
      pop,
      minT,
      maxT,
      ci,
      dateLabel: labelDate,
      dayLabel:
        dayOffset === 0 ? "今日" : getDayLabel(targetDateStr) || "明日",
    };
  } catch (err) {
    console.error("CWA API Error:", err);
    return null;
  }
}

module.exports = { fetchWeather };

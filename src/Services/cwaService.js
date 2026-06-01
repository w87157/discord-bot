const { formatCityName } = require("../Utils/helper");
const logger = require("../Utils/logger"); // 引入 logger

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

function getTaipeiDateStr(offsetDays = 0) {
  const ms = Date.now() + offsetDays * 86400000;
  return toTaipeiDateStr(new Date(ms));
}

function getSlotDateStr(startTime) {
  return toTaipeiDateStr(parseCwaTime(startTime));
}

function getSlotsForDateStr(timeArray, dateStr) {
  const dayStart = new Date(`${dateStr}T00:00:00+08:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59+08:00`);

  return timeArray.filter((slot) => {
    const start = parseCwaTime(slot.startTime);
    const end = parseCwaTime(slot.endTime);
    return start <= dayEnd && end >= dayStart;
  });
}

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

async function fetchWeather(locationName, options = {}) {
  const { dayOffset = 0 } = options;
  const city = formatCityName(locationName);
  const base = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";
  const url = new URL(base);
  url.searchParams.set("Authorization", process.env.CWA_API_KEY);
  url.searchParams.set("format", "JSON");
  url.searchParams.set("locationName", city);

  logger.info(
    `[CwaService] 準備向氣象署 API 請求資料 (城市: ${city}, 日期偏移: ${dayOffset})`,
  );

  try {
    const res = await fetch(url.toString());
    const json = await res.json();
    const loc = json?.records?.location?.[0];

    if (!loc) {
      logger.warn(
        `[CwaService] 氣象署 API 回傳成功，但找不到城市資料: ${city}`,
      );
      return null;
    }

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

    logger.info(`[CwaService] 成功解析 ${city} 的天氣預報資料`);

    return {
      location: loc.locationName,
      wx,
      pop,
      minT,
      maxT,
      ci,
      dateLabel: labelDate,
      dayLabel: dayOffset === 0 ? "今日" : getDayLabel(targetDateStr) || "明日",
    };
  } catch (err) {
    // 替換原本的 console.error
    logger.error(
      `[CwaService] 呼叫氣象署 API 或解析資料時發生錯誤: ${err.stack || err.message}`,
    );
    return null;
  }
}

module.exports = { fetchWeather };

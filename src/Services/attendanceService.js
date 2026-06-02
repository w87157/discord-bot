const axios = require("axios");
const crypto = require("crypto");
const logger = require("../Utils/logger");

// 常數設定
const ATTENDANCE_URL =
  "https://zonai.skport.com/web/v1/game/endfield/attendance";
const REFRESH_URL = "https://zonai.skport.com/web/v1/auth/refresh";

// ==== 1. 加密簽名生成 (Node.js 內建 crypto 版) ====
function generateSign(path, body, timestamp, token, platform, vName) {
  let str = path + body + timestamp;
  const headerJson = `{"platform":"${platform}","timestamp":"${timestamp}","dId":"","vName":"${vName}"}`;
  str += headerJson;

  const hmacHex = crypto
    .createHmac("sha256", token || "")
    .update(str)
    .digest("hex");
  const sign = crypto.createHash("md5").update(hmacHex).digest("hex");
  return sign;
}

// ==== 2. 刷新 Token ====
async function refreshToken(cred, platform, vName) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    cred: cred,
    platform: platform,
    vName: vName,
    Origin: "https://game.skport.com",
    Referer: "https://game.skport.com/",
  };

  try {
    const response = await axios.get(REFRESH_URL, { headers });
    const json = response.data;
    if (json.code === 0 && json.data && json.data.token) {
      return json.data.token;
    } else {
      throw new Error(
        `Refresh Failed (Code: ${json.code}, Msg: ${json.message})`,
      );
    }
  } catch (error) {
    throw new Error(`Token Refresh Error: ${error.message}`);
  }
}

// ==== 3. 執行簽到核心邏輯 ====
async function autoClaimFunction(userConfig) {
  const { cred, skGameRole } = userConfig;
  const platform = "3";
  const vName = "1.0.0";

  if (!cred || !skGameRole) {
    return {
      success: false,
      status: "❌ 設定缺失",
      rewards: "未設定 CRED 或 Role ID",
    };
  }

  logger.info(`[AttendanceService] 開始執行簽到流程...`);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  let token = "";
  try {
    token = await refreshToken(cred, platform, vName);
    logger.info(`[AttendanceService  Token 刷新成功。`);
  } catch (e) {
    logger.error(`[AttendanceService] Token 刷新失敗: ${e.message}`);
    return { success: false, status: "💥 Token 刷新失敗", rewards: e.message };
  }

  const sign = generateSign(
    "/web/v1/game/endfield/attendance",
    "",
    timestamp,
    token,
    platform,
    vName,
  );

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0",
    Accept: "*/*",
    "Content-Type": "application/json",
    "sk-language": "zh-tw",
    "sk-game-role": skGameRole,
    cred: cred,
    platform: platform,
    vName: vName,
    timestamp: timestamp,
    sign: sign,
    Origin: "https://game.skport.com",
    Referer: "https://game.skport.com/",
  };

  let result = { success: false, status: "", rewards: "" };

  try {
    const response = await axios({
      method: "post",
      url: "https://zonai.skport.com/web/v1/game/endfield/attendance",
      headers: headers,
      validateStatus: () => true,
    });

    const responseJson = response.data;
    logger.info(
      `[AttendanceService] API 回傳資料: ${JSON.stringify(responseJson)}`,
    );

    if (responseJson.code === 0) {
      if (responseJson.data?.awardIds?.length > 0) {
        result.success = true;
        result.status = "✅ 簽到成功";
        result.rewards = responseJson.data.awardIds
          .map((award) => {
            const resource = responseJson.data.resourceInfoMap?.[award.id];
            return resource
              ? `${resource.name} x${resource.count}`
              : `道具ID: ${award.id}`;
          })
          .join("\n");
      } else {
        result.success = true;
        result.status = "👌 今天已經簽到過囉";
        result.rewards = "無新獎勵";
      }
    } else if (responseJson.code === 10001) {
      result.success = true;
      result.status = "👌 今天已經簽到過囉";
      result.rewards = "無新獎勵";
    } else {
      result.success = false;
      result.status = `❌ 錯誤 (代碼: ${responseJson.code})`;
      result.rewards = responseJson.message || "未知錯誤";
    }
  } catch (error) {
    result.success = false;
    result.status = "💥 程式異常";
    result.rewards = error.message;
  }
  return result;
}

module.exports = { autoClaimFunction };

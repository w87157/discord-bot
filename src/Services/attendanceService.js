const axios = require("axios");
const crypto = require("crypto");

// 常數設定
const ATTENDANCE_URL =
  "https://zonai.skport.com/web/v1/game/endfield/attendance";
const REFRESH_URL = "https://zonai.skport.com/web/v1/auth/refresh";

// ==== 1. 加密簽名生成 (Node.js 內建 crypto 版) ====
function generateSign(path, body, timestamp, token, platform, vName) {
  let str = path + body + timestamp;
  const headerJson = `{"platform":"${platform}","timestamp":"${timestamp}","dId":"","vName":"${vName}"}`;
  str += headerJson;

  // HMAC-SHA256
  const hmacHex = crypto
    .createHmac("sha256", token || "")
    .update(str)
    .digest("hex");
  // MD5
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
async function autoClaimFunction() {
  const cred = process.env.ENDFIELD_CRED;
  const skGameRole = process.env.ENDFIELD_SK_GAME_ROLE;
  const accountName = process.env.ENDFIELD_ACCOUNT_NAME || "預設帳號";
  const platform = "3";
  const vName = "1.0.0";

  console.log(`[${accountName}] 開始執行簽到流程...`);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  let token = "";
  try {
    token = await refreshToken(cred, platform, vName);
    console.log(`[${accountName}] Token 刷新成功。`);
  } catch (e) {
    console.error(`[${accountName}] Token 刷新失敗: ${e.message}`);
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
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
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

  let result = { name: accountName, success: false, status: "", rewards: "" };

  try {
    const response = await axios.post(ATTENDANCE_URL, "", {
      headers,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    const responseJson = response.data;
    console.log(`[${accountName}] API 回傳 Code: ${responseJson.code}`);

    if (responseJson.code === 0) {
      // 檢查是否真的有拿到獎勵資料
      if (
        responseJson.data &&
        responseJson.data.awardIds &&
        responseJson.data.awardIds.length > 0
      ) {
        result.success = true;
        result.status = "✅ 簽到成功";
        result.rewards = responseJson.data.awardIds
          .map((award) => {
            const resource = responseJson.data.resourceInfoMap
              ? responseJson.data.resourceInfoMap[award.id]
              : null;
            return resource
              ? `${resource.name} x${resource.count}`
              : `道具ID: ${award.id}`;
          })
          .join("\n");
      } else {
        // Code 為 0 但沒有獎勵，代表今天稍早已經簽到過了
        result.success = true;
        result.status = "👌 今天已經簽到過囉";
        result.rewards = "無新獎勵";
      }
    } else if (responseJson.code === 10001) {
      // 保留原本的 10001 判斷，以防官方 API 又改回來
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

// 匯出給其他模組 (例如 Commands 和 Tasks) 使用
module.exports = {
  autoClaimFunction,
};

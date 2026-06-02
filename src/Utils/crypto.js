const crypto = require("crypto");

// 確保密鑰長度為 32 bytes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16; // AES 的初始向量長度為 16 bytes

function encrypt(text) {
  if (!text) return text;
  // 每次加密都產生隨機的 IV，確保相同的明文每次加密結果都不同
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // 將 IV 與加密後的內容組合存入資料庫 (格式: iv:encryptedData)
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error("[Crypto] 解密失敗:", error.message);
    return null; // 若金鑰錯誤或資料損毀則回傳 null
  }
}

module.exports = { encrypt, decrypt };
const { createClient } = require("@supabase/supabase-js");
const logger = require("../Utils/logger"); // 引入 logger

// 檢查環境變數是否遺失
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  logger.error(
    "[Supabase] 啟動警告：缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY 環境變數！",
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

logger.info("[Supabase] Supabase 資料庫客戶端已成功初始化。");

module.exports = supabase;

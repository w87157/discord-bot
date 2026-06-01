require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const express = require("express");
const logger = require("./Utils/logger");

// ==========================================
// ## 初始化 Web 伺服器 (防止免費託管平台休眠)
// ==========================================
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("天氣機器人運作中！🤖"));
app.listen(port, () => console.log(`[系統] 網頁伺服器已啟動於 port ${port}`));

// ==========================================
// ## 建立 Discord Client
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ==========================================
// ## 動態載入 Commands (斜線指令)
// ==========================================
const commandsPath = path.join(__dirname, "Commands");
// 讀取 Commands 資料夾內所有 .js 結尾的檔案
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  // 檢查指令檔案是否具備必要的 'data' 與 'execute' 屬性
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[警告] 檔案 ${filePath} 缺少 'data' 或 'execute' 屬性，無法載入為斜線指令。`,
    );
  }
}
console.log(`[系統] 成功載入 ${client.commands.size} 個指令。`);

// ==========================================
// ## 動態載入 Events (事件監聽)
// ==========================================
const eventsPath = path.join(__dirname, "Events");
// 讀取 Events 資料夾內所有 .js 結尾的檔案
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  // 根據 event.once 判斷是使用 client.once 還是 client.on
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
console.log(`[系統] 成功載入 ${eventFiles.length} 個事件。`);

// ==========================================
// ## 機器人登入
// ==========================================
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("[錯誤] 找不到 DISCORD_TOKEN，請確認環境變數設定。");
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error("[錯誤] 機器人登入失敗：", err);
});

// ==========================================
// ## Log紀錄
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
});

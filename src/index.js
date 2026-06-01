require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const logger = require("./Utils/logger");

// 1. 全域錯誤捕捉 (避免機器人因未捕捉的例外而崩潰閃退)
process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `[系統] 未捕捉的 Promise 拒絕 (Unhandled Rejection): ${reason.stack || reason}`,
  );
});

process.on("uncaughtException", (error) => {
  logger.error(
    `[系統] 未捕捉的例外錯誤 (Uncaught Exception): ${error.stack || error.message}`,
  );
});

process.on("uncaughtExceptionMonitor", (error, origin) => {
  logger.error(
    `[系統] 未捕捉的例外監控 (Uncaught Exception Monitor): ${error.stack || error.message} (來源: ${origin})`,
  );
});

// 2. 初始化 Discord 客戶端
logger.info("[Core] 正在初始化 Discord 客戶端...");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 3. 動態載入 Commands
const commandsPath = path.join(__dirname, "Commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        logger.info(`[Core] 成功載入斜線指令: /${command.data.name}`);
      } else if ("name" in command && "execute" in command) {
        // 相容傳統文字指令寫法
        client.commands.set(command.name, command);
        logger.info(`[Core] 成功載入文字指令: ${command.name}`);
      } else {
        logger.warn(
          `[Core] 指令檔案 ${file} 缺少必要的 "data/name" 或 "execute" 屬性。`,
        );
      }
    } catch (err) {
      logger.error(
        `[Core] 載入指令檔案 ${file} 時發生錯誤: ${err.stack || err.message}`,
      );
    }
  }
} else {
  logger.warn("[Core] 找不到 Commands 資料夾，跳過指令載入。");
}

// 4. 動態載入 Events
const eventsPath = path.join(__dirname, "Events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      logger.info(`[Core] 成功載入事件監聽器: ${event.name}`);
    } catch (err) {
      logger.error(
        `[Core] 載入事件檔案 ${file} 時發生錯誤: ${err.stack || err.message}`,
      );
    }
  }
} else {
  logger.warn("[Core] 找不到 Events 資料夾，跳過事件載入。");
}

// 5. 機器人登入
if (!process.env.DISCORD_TOKEN) {
  logger.error("[Core] 啟動失敗：未設定 DISCORD_TOKEN 環境變數！");
  process.exit(1);
}

logger.info("[Core] 準備登入 Discord API...");
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info("[Core] 登入請求發送成功，等待 ready 事件觸發...");
  })
  .catch((error) => {
    logger.error(`[Core] 機器人登入失敗: ${error.stack || error.message}`);
  });

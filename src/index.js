require("dotenv").config();
const config = require("../config"); // 引入根目錄設定
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const express = require("express");

// 引入事件處理器
const readyEvent = require("./Events/ready");
const messageEvent = require("./Events/messageCreate");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * 指令集初始化
 * 我們將指令放在 Collection 中，方便在其他檔案調用
 */
client.commands = new Collection();

// 引入指令檔案
const pingCommand = require("./Commands/ping");
const weatherCommand = require("./Commands/weather");

// 註冊指令
client.commands.set(pingCommand.name, pingCommand);
client.commands.set(weatherCommand.name, weatherCommand);

// --- 註冊事件監聽 ---

// 當 Bot 準備就緒 (使用 clientReady 以符合 v14.15+ 要求)
client.once("clientReady", () => {
  readyEvent(client);
});

// 當有新訊息時
client.on("messageCreate", (message) => {
  messageEvent(message, client);
});

// --- Express 伺服器 (防止 Bot 休眠) ---
const app = express();
app.get("/", (req, res) => res.send("Bot 運作中！"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[System] Express 伺服器已啟動於連接埠 ${PORT}`);
});

// 登入 Bot
client.login(process.env.DISCORD_TOKEN);

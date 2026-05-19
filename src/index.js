require("dotenv").config();
const config = require("../config");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const express = require("express");

// 引入事件處理器
const readyEvent = require("./Events/ready");
const messageEvent = require("./Events/messageCreate");
const interactionEvent = require("./Events/interactionCreate");

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

// 指令檔案
const pingCommand = require("./Commands/ping");
const weatherCommand = require("./Commands/weather");
const subscribeCommand = require("./Commands/subscribe");
const unsubscribeCommand = require("./Commands/unsubscribe");
const helpCommand = require("./Commands/help");

// 註冊指令
client.commands.set(pingCommand.name, pingCommand);
client.commands.set(weatherCommand.name, weatherCommand);
client.commands.set(subscribeCommand.name, subscribeCommand);
client.commands.set(unsubscribeCommand.name, unsubscribeCommand);
client.commands.set(helpCommand.name, helpCommand);

// --- 註冊事件監聽 ---
client.once("clientReady", () => {
  readyEvent(client);
});

client.on("messageCreate", (message) => {
  messageEvent(message, client);
});

client.on("interactionCreate", (interaction) => {
  interactionEvent(interaction, client);
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

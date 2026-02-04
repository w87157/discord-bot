require("dotenv").config();

// ===== supabase =====
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ===== express server =====
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`express server running on port ${PORT}`);
});

// ===== Discord bot =====
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 檢查第一個字是否為 '!'
  if (!message.content.startsWith("!")) return;

  // 去掉 '!' 並拆成指令 + 參數
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 指令區
  if (command === "ping") {
    message.reply("pong 🏓");
  }

  if (command === "register") {
    const { id, username } = message.author;

    const { error } = await supabase.from("users").insert({
      discord_id: id,
      username: username,
    });

    if (error) {
      console.error(error);
      return message.reply("註冊失敗 😢");
    }

    message.reply("註冊成功 ✅");
  }
});

client.login(process.env.DISCORD_TOKEN);

require("dotenv").config();

const config = require("./config");

// ===== supabase =====
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const cron = require("node-cron");

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

  // 每天 06:00（台北時間）執行
  cron.schedule(
    "0 6 * * *",
    () => {
      sendDailyWeather(client);
    },
    { timezone: "Asia/Taipei" },
  );

  // 啟動時先發一次，方便測試
  sendDailyWeather(client);
});

async function getWeather(locationName) {
  const base = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

  const url = new URL(base);
  url.searchParams.set("Authorization", process.env.CWA_API_KEY);
  url.searchParams.set("format", "JSON");
  url.searchParams.set("locationName", locationName);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`CWA API HTTP ${res.status}`);

  const json = await res.json();

  // records.location[0].weatherElement[...]  (36 小時預報):contentReference[oaicite:3]{index=3}
  const loc = json?.records?.location?.[0];
  if (!loc) return null;

  // 把 weatherElement 轉成容易取用的 map：{ Wx: [...time], PoP: [...], ... }
  const map = {};
  for (const el of loc.weatherElement || []) {
    map[el.elementName] = el.time || [];
  }

  // 取第一個時間段做「最近一段」預報（通常就是當下開始那段）
  const pick = (name) => map?.[name]?.[0]?.parameter?.parameterName ?? null;

  return {
    location: loc.locationName,
    Wx: pick("Wx"),
    PoP: pick("PoP"),
    MinT: pick("MinT"),
    MaxT: pick("MaxT"),
    CI: pick("CI"),
    startTime: map?.Wx?.[0]?.startTime ?? null,
    endTime: map?.Wx?.[0]?.endTime ?? null,
  };
}

async function sendDailyWeather(client) {
  try {
    const channelId = process.env.WEATHER_CHANNEL_ID;
    if (!channelId) {
      console.log("WEATHER_CHANNEL_ID not set, skip daily weather.");
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.log("Channel not found or not text-based.");
      return;
    }

    const messages = await channel.messages.fetch({ limit: 10 });
    const lastBotMsg = messages.find((msg) => msg.author.id === client.user.id);

    if (lastBotMsg) {
      await lastBotMsg.delete().catch(() => {});
      console.log("Deleted yesterday weather message.");
    }

    const city = config.weather.defaultCity.replaceAll("台", "臺");
    const w = await getWeather(city);

    if (!w) {
      console.log(`Weather not found for ${city}`);
      return;
    }

    const msg =
      `🌅 每日天氣（06:00）\n` +
      `🌦️ ${w.location}\n` +
      `時間：${w.startTime} ~ ${w.endTime}\n` +
      `天氣：${w.Wx}\n` +
      `溫度：${w.MinT}°C ~ ${w.MaxT}°C\n` +
      `降雨機率：${w.PoP}%\n` +
      `舒適度：${w.CI}`;

    await channel.send(msg);
    console.log("Daily weather sent.");
  } catch (err) {
    console.error("sendDailyWeather error:", err);
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 檢查第一個字是否為 '!'
  if (!message.content.startsWith("!")) return;

  // 去掉 '!' 並拆成指令 + 參數
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 指令區
  if (command === "ping") {
    return message.reply("pong 🏓");
  } else if (command === "天氣") {
    // 用法：
    // !weather 臺北市
    // !weather 台北市  (我們下面會自動把「台」轉「臺」)
    let locationName = args.join("") || "臺北市";
    locationName = locationName.replaceAll("台", "臺");

    try {
      const w = await getWeather(locationName);

      if (!w) {
        return message.reply(
          `查不到「${locationName}」😢（請用縣市名，例如：臺北市、新北市、桃園市）`,
        );
      }

      return message.reply(
        `🌦️ ${w.location}\n` +
          `時間：${w.startTime} ~ ${w.endTime}\n` +
          `天氣：${w.Wx}\n` +
          `溫度：${w.MinT}°C ~ ${w.MaxT}°C\n` +
          `降雨機率：${w.PoP}%\n` +
          `舒適度：${w.CI}`,
      );
    } catch (err) {
      console.error(err);
      return message.reply("天氣查詢失敗 😢");
    }
  }

  // 連接 base
  // if (command === "register") {
  //   const { id, username } = message.author;

  //   const { error } = await supabase.from("users").insert({
  //     discord_id: id,
  //     username: username,
  //   });

  //   if (error) {
  //     console.error(error);
  //     return message.reply("註冊失敗 😢");
  //   }

  //   message.reply("註冊成功 ✅");
  // }
});

client.login(process.env.DISCORD_TOKEN);

const cron = require("node-cron");
const config = require("../../config");
const { EmbedBuilder } = require("discord.js");
const { getWeather } = require("../Services/cwaService");
const supabase = require("../Services/supabase");

module.exports = (client) => {
  console.log(`✅ ${client.user.tag} 已就緒！`);

  // 註冊排程任務
  weatherTask(client);
};

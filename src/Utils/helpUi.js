const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const config = require("../../config");
const { CITIES } = require("./helper");

const CITY_BACK_VALUE = "__back__";

function formatScheduleTime(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length >= 2) {
    const minute = parts[0].padStart(2, "0");
    const hour = parts[1].padStart(2, "0");
    return `${hour}:${minute}`;
  }
  return cron;
}

function buildHelpEmbed() {
  const prefix = config.prefix;
  const scheduleTime = formatScheduleTime(config.weather.schedule);
  const defaultCity = config.weather.defaultCity;

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🤖 機器人指令總表")
    .setDescription(
      [
        "從下方選單**直接操作**，或使用文字指令：",
        "",
        `**明日預報查詢** — \`${prefix}天氣 [城市]\``,
        `**訂閱預報** — \`${prefix}訂閱 天氣 [城市]\``,
        `**取消訂閱** — \`${prefix}取消訂閱 天氣\``,
        `**延遲測試** — \`${prefix}ping\``,
        "",
        `未填城市時預設為 **${defaultCity}**。`,
      ].join("\n"),
    )
    .addFields({
      name: "📅 定時推送",
      value: `每日 **${scheduleTime}**（${config.weather.timezone}）`,
    })
    .setFooter({ text: "查詢／訂閱時請從下拉選單選擇城市" })
    .setTimestamp();
}

function buildCitySelectEmbed(title) {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(title)
    .setDescription("請從下方選單選擇縣市。");
}

function buildHelpSelectMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("help_menu")
    .setPlaceholder("選擇要執行的功能...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("明日天氣查詢")
        .setDescription("選擇城市後顯示明日預報")
        .setEmoji("🌦️")
        .setValue("weather"),
      new StringSelectMenuOptionBuilder()
        .setLabel("訂閱每日預報")
        .setDescription("選擇城市後開啟每日自動推送")
        .setEmoji("🔔")
        .setValue("subscribe"),
      new StringSelectMenuOptionBuilder()
        .setLabel("取消每日預報")
        .setDescription("停止此頻道的自動推送")
        .setEmoji("🔕")
        .setValue("unsubscribe"),
      new StringSelectMenuOptionBuilder()
        .setLabel("延遲測試")
        .setDescription("檢查機器人連線速度")
        .setEmoji("🏓")
        .setValue("ping"),
    );
}

function buildHelpActionRow() {
  return new ActionRowBuilder().addComponents(buildHelpSelectMenu());
}

function buildHelpComponents() {
  return [buildHelpActionRow()];
}

function buildCitySelectMenu(action) {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel("← 返回功能選單")
      .setValue(CITY_BACK_VALUE),
    ...CITIES.map((city) =>
      new StringSelectMenuOptionBuilder().setLabel(city).setValue(city),
    ),
  ];

  return new StringSelectMenuBuilder()
    .setCustomId(`help_city_${action}`)
    .setPlaceholder("請選擇縣市...")
    .addOptions(options);
}

function buildCitySelectComponents(action) {
  return [
    new ActionRowBuilder().addComponents(buildCitySelectMenu(action)),
  ];
}

/** 重設選單未選狀態，讓使用者可再次點選相同項目 */
async function resetHelpSelectMenu(message) {
  await message.edit({
    embeds: [buildHelpEmbed()],
    components: buildHelpComponents(),
  });
}

module.exports = {
  CITY_BACK_VALUE,
  formatScheduleTime,
  buildHelpEmbed,
  buildCitySelectEmbed,
  buildHelpSelectMenu,
  buildHelpComponents,
  buildCitySelectComponents,
  resetHelpSelectMenu,
};

const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../../config");

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
    .setFooter({ text: "選單內「查詢／訂閱」會彈出視窗輸入城市" })
    .setTimestamp();
}

function buildHelpActionRow() {
  return new ActionRowBuilder().addComponents(buildHelpSelectMenu());
}

function buildHelpComponents() {
  return [buildHelpActionRow()];
}

/** 重設選單未選狀態，讓使用者可再次點選相同項目 */
async function resetHelpSelectMenu(message) {
  await message.edit({ components: buildHelpComponents() });
}

function buildHelpSelectMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("help_menu")
    .setPlaceholder("選擇要執行的功能...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("明日天氣查詢")
        .setDescription("輸入城市後顯示明日預報")
        .setEmoji("🌦️")
        .setValue("weather"),
      new StringSelectMenuOptionBuilder()
        .setLabel("訂閱每日預報")
        .setDescription("在此頻道開啟每日自動推送")
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

function buildCityModal(customId, title, placeholder) {
  const cityInput = new TextInputBuilder()
    .setCustomId("city")
    .setLabel("城市名稱")
    .setPlaceholder(placeholder)
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(20);

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(new ActionRowBuilder().addComponents(cityInput));
}

module.exports = {
  formatScheduleTime,
  buildHelpEmbed,
  buildHelpSelectMenu,
  buildHelpComponents,
  resetHelpSelectMenu,
  buildCityModal,
};

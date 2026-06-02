const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

// 根據傳入的 view ('main' 或是 'tutorial') 來產生不同的畫面
function buildHelpEmbed(view = "main") {
  // --- 教學專屬頁面 ---
  if (view === "tutorial") {
    return new EmbedBuilder()
      .setColor(0x3498db) // 教學頁面改用藍色區隔
      .setTitle("🔍 | 如何獲取簽到憑證 (cred / role_id)？")
      .setDescription(
        [
          "請按照以下步驟獲取您的遊戲簽到憑證：",
          "",
          "**1.** 使用電腦瀏覽器登入 [遊戲官方簽到網站](https://game.skport.com/endfield/sign-in)。",
          "**2.** 按下 `F12` 鍵開啟開發者工具，切換至 **Network (網路)** 頁籤。",
          "**3.** **重新整理網頁 (F5)**，在網路請求清單中找到並點擊 `attendance`。",
          "*(💡 提示：若清單空白，請確認左上角「🔴錄製」是否有亮紅燈)*",
          "**4.** 在右側面板點選 **Headers**，向下滑動找到 **Request Headers** 區塊。",
          "**5.** 複製 `Cred` 欄位的值與 `sk-game-role` 欄位的值 (作為 role_id)。",
          "",
          "⚠️ **安全警告：`Cred` 相當於您的帳號憑證，切勿截圖或透露給任何人！**",
        ].join("\n"),
      )
      .setTimestamp();
  }

  // --- 預設的指令總表頁面 ---
  const weatherTime = formatScheduleTime(config.weather.schedule);
  const attendanceTime = formatScheduleTime(config.attendance.schedule);

  const descriptionLines = [
    "請直接輸入以下斜線指令來操作：",
    "",
    "**【🌤️ 天氣預報系統】**",
    `**明日預報查詢** — \`/weather [城市]\``,
    `**訂閱預報** — \`/subscribe [城市]\``,
    `**取消訂閱** — \`/unsubscribe\``,
    "",
    "**【🎮 遊戲簽到系統 (終末地)】**",
    `**設定簽到憑證** — \`/set_profile cred:[您的cred] role_id:[您的role_id]\``,
    `**手動簽到** — \`/claim\``,
    "",
    "**【🛠️ 其他功能】**",
    `**延遲測試** — \`/ping\``,
    `**指令總表** — \`/help\``,
    "",
  ];

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("📖 | 指令總表")
    .setDescription(descriptionLines.join("\n"))
    .addFields({
      name: "📅 定時推送",
      value: [
        `**🌤️ 天氣預報**：每日 **${weatherTime}**（${config.weather.timezone}）`,
        `**🎮 遊戲簽到**：每日 **${attendanceTime}**（${config.attendance.timezone}）`,
      ].join("\n"),
    })
    .setTimestamp();
}

// 根據目前的頁面，產生對應的按鈕
function buildHelpComponents(view = "main") {
  if (view === "tutorial") {
    // 如果在教學頁面，顯示「返回按鈕」
    const backButton = new ButtonBuilder()
      .setCustomId("show_help_main")
      .setLabel("⬅️ 返回指令總表")
      .setStyle(ButtonStyle.Secondary);

    return [new ActionRowBuilder().addComponents(backButton)];
  }

  // 如果在主選單，顯示「前往教學按鈕」
  const tutorialButton = new ButtonBuilder()
    .setCustomId("show_help_tutorial")
    .setLabel("🔍 如何取得簽到憑證")
    .setStyle(ButtonStyle.Primary);

  return [new ActionRowBuilder().addComponents(tutorialButton)];
}

module.exports = {
  formatScheduleTime,
  buildHelpEmbed,
  buildHelpComponents,
};

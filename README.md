# Discord 天氣 Bot

使用 [discord.js](https://discord.js.org/) v14 的台灣天氣機器人：支援前綴指令查詢氣象署資料、頻道訂閱每日預報（Supabase 持久化），以及輕量 Express 服務方便部署在會休眠的託管環境。

## 功能一覽


| 類型                | 說明                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------ |
| **前綴指令**          | 預設前綴 `!`（見 `config.js` 的 `prefix`）                                                   |
| `**!ping`**       | 測試機器人延遲（ms）                                                                          |
| `**!天氣 [城市]**`    | 查詢指定城市「當日（Asia/Taipei）」預報：溫度區間、降雨機率、天氣描述；未填城市時預設臺北市                                  |
| `**!訂閱 天氣 [城市]**` | 將訂閱寫入 Supabase；同一使用者於同一頻道重複訂閱會更新城市（upsert）                                           |
| `**!取消訂閱 天氣**`   | 刪除目前頻道＋使用者的訂閱；若存在上一則預報訊息會嘗試一併刪除                                      |
| `**!功能**`         | 顯示指令總表與下拉選單；可查天氣／訂閱（彈窗輸入城市）、直接取消訂閱或測試延遲（僅自己可見）                              |
| **定時預報**          | Bot 就緒後先執行一次，之後依 `config.js` 的 Cron 與時區對所有訂閱頻道發送 Embed；若資料庫有紀錄上一則訊息 ID，會嘗試刪除舊訊息再發新預報 |
| **Express**       | `GET /` 回傳「Bot 運作中！」，監聽 `process.env.PORT`（預設 `3000`）                                |


資料來源：交通部中央氣象署開放資料平臺 **F-C0032-001**（透過 `CWA_API_KEY`）。

## 專案結構

```text
discord_bot/
├── config.js                 # 前綴、天氣排程（Cron）、時區
├── package.json
├── README.md
└── src/
    ├── index.js              # Client 登入、事件綁定、Express
    ├── Commands/
    │   ├── ping.js           # !ping
    │   ├── weather.js        # !天氣（指令名稱為「天氣」）
    │   ├── subscribe.js      # !訂閱
    │   ├── unsubscribe.js    # !取消訂閱
    │   └── help.js           # !功能（選單說明）
    ├── Events/
    │   ├── ready.js          # 上線後啟動 weatherTask
    │   ├── messageCreate.js  # 解析前綴並分發指令
    │   └── interactionCreate.js  # help 選單（StringSelectMenu）
    ├── Tasks/
    │   └── weatherTask.js    # 定時／啟動時發送預報、更新 last_message_id
    ├── Services/
    │   ├── cwaService.js     # 氣象署 API、今日時段彙整
    │   └── supabase.js       # Supabase 客戶端
    └── Utils/
        ├── helper.js         # 城市名稱格式化（台→臺、補縣市）
        ├── helpUi.js         # 功能選單 Embed、選單、Modal
        └── weatherEmbed.js   # 天氣 Embed 共用
```

## 環境需求

- Node.js（建議與本機開發環境相符的版本；專案使用 `fetch`，需 Node 18+ 或已內建 `fetch` 的執行環境）
- Discord 應用程式與 Bot Token
- 氣象署開放資料 API 金鑰
- Supabase 專案（URL 與 anon key）

## 環境變數

於專案根目錄建立 `.env`（勿提交版控）：


| 變數                  | 說明                           |
| ------------------- | ---------------------------- |
| `DISCORD_TOKEN`     | Discord Bot Token            |
| `CWA_API_KEY`       | 中央氣象署 API `Authorization` 參數 |
| `SUPABASE_URL`      | Supabase 專案 URL              |
| `SUPABASE_ANON_KEY` | Supabase anon（公開）金鑰          |
| `PORT`              | 選用；Express 監聽埠，預設 `3000`     |


## Supabase 資料表

程式假設存在資料表 `**weather_subscriptions**`，且 `**channel_id` + `user_id**` 可作為 upsert 的唯一約束（與 `subscribe.js` 中 `onConflict` 一致）。

建議欄位：


| 欄位                | 類型             | 說明                            |
| ----------------- | -------------- | ----------------------------- |
| `guild_id`        | `text`         | 伺服器 ID；私訊訂閱時程式會寫入字串 `DM`      |
| `guild_name`      | `text`         | 伺服器名稱或「私訊」                    |
| `channel_id`      | `text`         | 頻道 ID                         |
| `user_id`         | `text`         | 使用者 ID                        |
| `user_name`       | `text`         | 使用者名稱                         |
| `city`            | `text`         | 城市名稱（會經 `formatCityName` 正規化） |
| `updated_at`      | `timestamptz`  | 最後更新時間                        |
| `last_message_id` | `text`，可為 NULL | 定時預報最後一則訊息 ID，供下次刪除舊訊息        |


請在 Supabase 為 `(channel_id, user_id)` 建立 **唯一索引**，並依需求設定 RLS；若使用 anon key，需允許 client 對該表執行 `select`／`insert`／`update`／`delete`（與程式實際呼叫一致）。

## `config.js` 說明

- `**prefix`**：訊息指令前綴，預設 `!`。
- `**weather.defaultCity**`：邏輯上可作為預設城市（即時查詢在 `weather.js` 內另有預設字串）。
- `**weather.timezone**`：Cron 使用的時區，預設 `Asia/Taipei`。
- `**weather.schedule**`：Cron 表達式，預設 `0 6 * * *`（每日 06:00）。

## Discord 開發者設定

1. 在 [Discord Developer Portal](https://discord.com/developers/applications) 建立 Application，啟用 Bot，複製 Token 到 `DISCORD_TOKEN`。
2. **Privileged Gateway Intents**：本專案使用 `MessageContent` 讀取頻道訊息內容以解析 `!` 指令，請在 Bot 設定中啟用 **MESSAGE CONTENT INTENT**。
3. 邀請 Bot 時請授予足夠權限，至少包含：在訂閱頻道 **檢視頻道**、**傳送訊息**、**嵌入連結**；若需刪除舊預報則需 **管理訊息**。

## 安裝與執行

```bash
npm install
npm start
```

預設會執行 `node src/index.js`。

## 指令格式摘要

```text
!ping
!天氣
!天氣 高雄
!訂閱 天氣 臺中市
!取消訂閱 天氣
!功能
```

私訊中亦可使用（若 Bot 允許 DM）；此時 `guild_id` 會存為 `DM`。

## 授權

見 `package.json` 的 `license` 欄位。
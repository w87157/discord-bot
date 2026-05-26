# Discord 天氣 Bot

使用 [discord.js](https://discord.js.org/) v14 的台灣天氣機器人：支援前綴指令查詢氣象署資料、頻道訂閱每日預報（Supabase 持久化），以及輕量 Express 服務方便部署在會休眠的託管環境。

## 指令一覽


| 類型                | 說明                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------ |
| **前綴指令**          | 預設前綴 `!`（見 `config.js` 的 `prefix`）                                                   |
| `**!ping`**       | 測試機器人延遲（ms）                                                                          |
| `**!天氣 [城市]`**    | 查詢指定城市「明日（Asia/Taipei）」預報：溫度區間、降雨機率、天氣描述；未填城市時預設臺北市                                  |
| `**!訂閱 天氣 [城市]**` | 將訂閱寫入 Supabase；同一使用者於同一頻道重複訂閱會更新城市（upsert）                                           |
| `**!取消訂閱 天氣**`    | 刪除目前頻道＋使用者的訂閱；若存在上一則預報訊息會嘗試一併刪除                                                      |
| `**!指令**`         | 顯示指令總表與下拉選單；可查天氣／訂閱（彈窗輸入城市）、直接取消訂閱或測試延遲（僅自己可見）                                       |
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
    │   └── help.js           # !指令（選單說明）
    ├── Events/
    │   ├── ready.js          # 上線後啟動 weatherTask
    │   ├── messageCreate.js  # 解析前綴並分發指令
    │   └── interactionCreate.js  # help 選單（StringSelectMenu）
    ├── Tasks/
    │   └── weatherTask.js    # 定時／啟動時發送預報、更新 last_message_id
    ├── Services/
    │   ├── cwaService.js     # 氣象署 API、依日期時段彙整
    │   └── supabase.js       # Supabase 客戶端
    └── Utils/
        ├── helper.js         # 城市名稱格式化（台→臺、補縣市）
        ├── helpUi.js         # 指令選單 Embed、選單、Modal
        └── weatherEmbed.js   # 天氣 Embed 共用
```

## 程式碼命名規範

本專案採用下列 JavaScript 命名慣例，以利閱讀與維護。

### 一、核心命名規則（Casing Rules）

| 類型 | 命名風格 | 規則說明與範例 |
| --- | --- | --- |
| **變數** (Variables) | 小駝峰 `camelCase` | 使用名詞。例：`let userName = "Alice";` |
| **函式** (Functions) | 小駝峰 `camelCase` | 以動詞開頭。例：`function calculateTotal() {}` |
| **類別** (Classes) | 大駝峰 `PascalCase` | 首字母大寫，使用名詞。例：`class ShoppingCart {}` |
| **全域／固定常數** (Constants) | 大寫蛇形 `SCREAMING_SNAKE_CASE` | 程式中不會改變的設定值或魔術數字。例：`const MAX_LOGIN_ATTEMPTS = 3;` |

> **補充：** 雖然 JS 中宣告變數時建議優先使用 `const`（值會變動才用 `let`），但只有「全域的、寫死的配置參數」才使用全大寫蛇形命名。若為程式運算產生的 `const`，仍用小駝峰即可，例如：`const calculatedPrice = basePrice * tax;`。

### 二、常見實戰命名慣例

#### 1. 布林值 (Booleans)

型別轉換頻繁，布林值命名應一眼可辨：

| 前綴 | 範例 |
| --- | --- |
| `is` + 形容詞／狀態 | `isVisible`, `isValid`, `isFetching` |
| `has` + 名詞／狀態 | `hasError`, `hasChildren`, `hasSub` |
| `should` + 動詞 | `shouldUpdate`, `shouldRender` |

#### 2. 事件處理器 (Event Handlers)

| 用途 | 命名 | 範例 |
| --- | --- | --- |
| 綁定事件的屬性 (Props) | `on` 開頭 | `onClick`, `onSubmit`, `onChange` |
| 處理事件的函式 | `handle` 開頭 | `handleClick`, `handleSubmit`, `handleChange` |

```jsx
<button onClick={handleClick}>提交</button>
```

#### 3. 私有變數或方法

傳統上以底線 `_` 表示內部使用、勿在外部直接呼叫，例如：`this._internalState = null;`

> ES2022 起支援 `#` 私有欄位（如 `#internalState`），底線慣例在舊專案中仍常見。

#### 4. 取得、設定與請求資料

| 動詞 | 用途 | 範例 |
| --- | --- | --- |
| `get...` | 取得內部資料 | `getUserName()` |
| `set...` | 設定／更新內部資料 | `setUserName('Bob')` |
| `fetch...` | 向後端 API 非同步請求 | `fetchUserData()` |

#### 5. 陣列方法的 callback 參數

陣列用**複數**，callback 內單一元素用對應**單數**：

```javascript
const users = ['Alice', 'Bob', 'Charlie'];

users.forEach((user) => {
  console.log(user);
});
```

#### 6. 名稱過長時的簡寫

在**不影響可讀性**的前提下，若完整單字造成程式過長（例如迴圈內、短函式、同一區塊反覆出現），可使用**約定俗成的簡寫**，仍維持小駝峰：

| 完整詞 | 簡寫 | 範例 |
| --- | --- | --- |
| subscription | `sub` | `subs`、`subType` |
| message | `msg` | `oldMsg`、`sentMsg` |
| response | `res` | `const res = await fetch(...)` |
| location | `loc` | `loc.locationName` |
| element | `el` | `elMap` |
| error | `err` | `catch (err)` |
| parameter / 參數值 | `val` | `.filter((val) => ...)` |

規則：

- **布林前綴仍保留**：`hasSub`（勿寫成 `sub` 當布林用）。
- **函式名稱**盡量用完整動詞（如 `fetchWeather`）；簡寫主要用在**區域變數**與**callback 參數**。
- **避免過度簡寫**：`s`、`d`、`x` 等單字母僅在極短 callback 且型別明確時使用；優先 `sub`、`msg`、`err`。
- **對外 API／匯出介面**（`module.exports`、回傳物件屬性）優先完整命名；內部實作才簡寫。

```javascript
const { data: subs } = await supabase.from("weather_subscriptions").select("*");

for (const sub of subs) {
  const data = await fetchWeather(sub.city);
  if (!data) continue;
  // ...
}
```

### 三、應避開的命名地雷

| 項目 | 說明 |
| --- | --- |
| **保留字與關鍵字** | 勿使用 `class`, `function`, `let`, `const`, `return`, `default` 等作為變數名 |
| **匈牙利命名法** | 勿在變數名寫入型別前綴（如 `strName`, `arrUsers`）；`name` 與 `users` 已足夠 |
| **DOM 元素** | 可加上 `El`／`Node` 後綴或 `$` 前綴以區分一般變數，例：`const submitBtnEl = document.getElementById('submit');` |

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
- `**weather.defaultCity`**：邏輯上可作為預設城市（即時查詢在 `weather.js` 內另有預設字串）。
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
!指令
```

私訊中亦可使用（若 Bot 允許 DM）；此時 `guild_id` 會存為 `DM`。

## 授權

見 `package.json` 的 `license` 欄位。
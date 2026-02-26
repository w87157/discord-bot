discord-bot/
├── src/
├── config.js       # 全域設定 (Cron 排程字串、時區)
├── .env  
└── package.json     
    ├── index.js
    ├── Commands/
    │   ├── ping.js             # 測試延遲
    │   ├── weather.js          # 即時查詢天氣
    │   └── subscribe.js        # 處理訂閱邏輯並寫入 Supabase
    ├── Events/
    │   ├── ready.js            # Bot 上線初始化，並啟動 Tasks
    │   └── messageCreate.js    # 內容解析與指令分發
    ├── Tasks/
    │   └── weatherTask.js      # 核心業務：循環發送預報、刪除舊訊息
    ├── Services/
    │   ├── cwaService.js       # 氣象局 API 對接
    │   └── supabase.js         # 資料庫連線實例
    └── Utils/
        └── helper.js           # 城市名稱格式化等小工具
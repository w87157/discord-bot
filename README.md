├── config.js # 全域配置
├── .env # 環境變數
├── package.json
└── src/
    ├── index.js            # 入口點：初始化 Client
    ├── Commands/           # 存放所有指令邏輯 (例如：!天氣, !ping)
    │   ├── ping.js
    │   └── weather.js
    ├── Services/           # 存放外部 API 或資料庫邏輯
    │   ├── cwaService.js   # 專門負責 CWA 氣象 API
    │   └── supabase.js     # Supabase 初始化與操作
    ├── Events/             # 存放 Discord 事件處理 (例如：messageCreate)
    │   ├── ready.js
    │   └── messageCreate.js
    └── Utils/              # 存放小工具 (例如：城市名稱轉換)
        └── helper.js

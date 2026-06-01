const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

// 定義日誌的輸出格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // 捕獲錯誤堆疊 (Error Stack)
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
  }),
);

// 建立 Logger 實例
const logger = winston.createLogger({
  level: "info", // 預設紀錄 info 級別以上的日誌 (info, warn, error)
  format: logFormat,
  transports: [
    // 1. 將所有 error 級別的日誌寫入 error-%DATE%.log，保留 14 天
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs", "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
    }),
    // 2. 將所有 info 級別以上的日誌寫入 combined-%DATE%.log，保留 14 天
    new DailyRotateFile({
      filename: path.join(__dirname, "../../logs", "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
    }),
  ],
});

// 3. 在終端機 (Console) 中輸出日誌，並加上顏色標示，方便開發時查看
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `[${timestamp}] ${level}: ${stack || message}`;
      }),
    ),
  }),
);

module.exports = logger;

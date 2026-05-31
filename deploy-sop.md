# GCP 永久免費主機：Discord Bot (Node.js) 部署與資安設定 SOP

這份指南紀錄了如何在 Google Cloud Platform (GCP) 的「永遠免費」層級主機上，從零開始部署基於 Node.js 開發的 Discord 機器人，並完成基礎的資訊安全防護。

---

## 壹、 基礎雲端主機規格 (GCP Always Free)

確保建立 VM 執行個體時符合以下條件，以維持每月 $0 元帳單：
* **區域 (Zone)：** `us-west1-b` (奧勒岡州)
* **機器類型：** `e2-micro` (1 vCPU, 1GB RAM)
* **作業系統：** Debian GNU/Linux 12 (bookworm)
* **開機磁碟：** 30 GB 標準永久磁碟 (`pd-standard`)
* **網路服務級別：** 標準 (Standard Tier)
* **防火牆：** **不勾選**「允許 HTTP 流量」與「允許 HTTPS 流量」
* **使用PM2** pm2 start src/index.js --name "discord-bot"
---
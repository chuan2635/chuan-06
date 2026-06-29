# 🤖 CubeLV - Build Your One-Person AI Team

> **用自然語言創建 AI 員工，指派重複性任務，實現定期自動執行**

[中文說明](#中文說明) | [English](#english)

---

## 中文說明

### 🎯 核心概念

**CubeLV** 讓你創建虛擬 AI 員工，賦予工作指令，系統會自動執行：

- 📊 **監控市場**：每天抓取股市消息、分析走勢
- 📝 **撰寫報告**：自動生成技術分析報告、週報摘要
- 🔔 **推送通知**：重要消息立即提醒
- 💾 **知識累積**：長期記憶系統，Agent 學習歷史

---

## 🚀 快速開始（3 步）

### 1. 環境準備
```bash
git clone https://github.com/chuan2635/chuan-06.git
cd chuan-06
npm install
cp .env.example .env.local
# 編輯 .env.local，填入 Supabase 和 Claude API 密鑰
```

### 2. 初始化數據庫
- 登入 Supabase
- SQL Editor → 貼入 `supabase/migrations/001_init_schema.sql`
- 執行

### 3. 啟動應用
```bash
npm run dev
```

🌐 自動打開 http://localhost:5173

---

## 📚 文檔索引

| 文檔 | 用途 |
|------|------|
| **[HOW_TO_USE.md](./HOW_TO_USE.md)** | ⭐ 新手必讀！完整的使用指南 |
| **[QUICKSTART.md](./QUICKSTART.md)** | 開發者快速開始指南 |
| **[CLAUDE.md](./CLAUDE.md)** | 開發團隊參考（架構、API、計劃） |
| **[CUBELV_PRD.md](./CUBELV_PRD.md)** | 產品規格書（設計、UI、技術細節） |

---

## ✨ 主要功能

### 1️⃣ Agent 建立與管理
- 自然語言指令編寫
- 5 個 Tab 完整配置（設定、記憶、技能、預算、統計）
- 支援多模型選擇（Auto / Claude Opus / Claude Sonnet）

### 2️⃣ AI 自動執行
- 手動、排程、Chat 三種觸發方式
- 多輪對話循環（最多 100 輪）
- 工具自動調用（read、write、search 等）

### 3️⃣ 數據管理
- 筆記（Note）、待辦（Todo）、圖表（Chart）
- Markdown 支援
- 跨 Agent 協作

### 4️⃣ 成本管控
- Credits 預算追蹤
- Tokens 計量
- 執行時長監控
- 預算超限警告

### 5️⃣ 長期記憶
- Agent 記憶累積
- 跨任務知識保留
- 支援多種數據格式

---

## 🛠️ 技術棧

```
前端
├─ React 18 + TypeScript
├─ Tailwind CSS（深色主題）
├─ Zustand（狀態管理）
└─ Recharts（數據可視化）

後端 & 基礎設施
├─ Supabase（PostgreSQL + Auth）
├─ Claude API（AI 引擎）
├─ Vercel Cron（定期排程）
└─ RLS 行級安全

工具
├─ Vite（構建工具）
├─ TypeScript（類型安全）
└─ Tailwind（設計系統）
```

---

## 🎮 7 個 Agent 工具

Agent 可以自動調用這些工具：

| 工具 | 功能 | 範例 |
|------|------|------|
| `read_folder` | 讀取資料夾內容 | 獲取筆記列表 |
| `create_note` | 新增筆記 | 保存分析結果 |
| `update_note` | 更新筆記 | 修改過時資訊 |
| `create_todo` | 新增待辦 | 建立行動項目 |
| `create_chart` | 生成圖表 | 可視化數據 |
| `web_search` | 搜尋網路 | 查詢最新消息 |
| `fetch_stock_data` | 抓取股票資料 | 取得股價資訊 |

---

## 📊 架構圖

```
┌─────────────────────────────────────────────┐
│              React 應用層                    │
│  ┌──────────────────────────────────────┐  │
│  │ FolderListPage    AgentDetailPage    │  │
│  │ (Agent 列表頁)    (詳情頁 × 5 tabs)   │  │
│  └──────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│           API 層 (TypeScript)                │
│  ┌──────────────────────────────────────┐  │
│  │ agentApi    folderApi    noteApi     │  │
│  │ agentExecutor                        │  │
│  │ claudeIntegration                    │  │
│  └──────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴───────┬──────────────┐
       ▼               ▼              ▼
   [Supabase]    [Claude API]    [Web Search]
   (9 tables)    (Tool Calling)   (External API)
```

---

## 🚀 使用場景

### 場景 1：股市監控（你的用例）
```
🕐 觸發：每天 08:30
👤 Agent：消息監控員
🎯 目標：監控台股重大消息
📤 產出：自動寫筆記、標記異常波動
```

### 場景 2：技術分析
```
🕐 觸發：每週五 15:30
👤 Agent：技術研究員
🎯 目標：分析 K 線、生成報告
📤 產出：圖表 + 文本分析報告
```

### 場景 3：個人助理
```
🕐 觸發：每天 09:00
👤 Agent：待辦助理
🎯 目標：整理任務、提醒優先項
📤 產出：今日待辦清單
```

---

## 📖 下一步

1. **[馬上開始](./HOW_TO_USE.md)**：按照使用指南 3 步上手
2. **建立第一個 Agent**：試試「消息監控員」
3. **手動執行測試**：驗證 AI 執行效果
4. **設置排程自動化**：配置定期執行時間
5. **部署到雲端**：Vercel 一鍵部署

---

## 🐛 常見問題

**Q: 需要什麼前置知識？**  
A: 不需要！只要會打字，就能用自然語言創建 AI 員工。

**Q: 費用如何計算？**  
A: 按 Claude API tokens 計費。1 credit ≈ 1000 tokens。[查看定價](https://www.anthropic.com/pricing)

**Q: 可以離線使用嗎？**  
A: 不行。需要連接 Supabase 和 Claude API。

**Q: 支援中文指令嗎？**  
A: 完全支援！Claude 能理解中文。

**Q: 如何設置定期排程？**  
A: 進入「設定」Tab → 打開「定期排程」→ 輸入 Cron 表達式。

更多問題見 [HOW_TO_USE.md#常見問題](./HOW_TO_USE.md#常見問題)

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

## 📜 授權

MIT License - 自由使用和修改

---

## 📞 聯繫

- 📧 Email: x1001002004@gmail.com
- 🐙 GitHub: [chuan2635](https://github.com/chuan2635)

---

<div align="center">

**打造你的一人 AI 團隊 🚀**

[⭐ Star 此項目支持我們](https://github.com/chuan2635/chuan-06)

</div>

---

## English

### 🎯 What is CubeLV?

**CubeLV** lets you create virtual AI employees with natural language instructions and automate repetitive tasks:

- 📊 **Monitor markets** - Daily stock analysis and news tracking
- 📝 **Generate reports** - Auto-generate technical analysis and summaries
- 🔔 **Push notifications** - Alert on important events
- 💾 **Long-term memory** - AI learns from task history

### 🚀 Quick Start (3 Steps)

```bash
# 1. Clone and install
git clone https://github.com/chuan2635/chuan-06.git
cd chuan-06
npm install
cp .env.example .env.local

# 2. Set up Supabase (execute SQL migration)
# In Supabase SQL Editor, run: supabase/migrations/001_init_schema.sql

# 3. Start dev server
npm run dev
```

Open http://localhost:5173 🌐

### 📚 Documentation

- **[HOW_TO_USE.md](./HOW_TO_USE.md)** - Complete usage guide (⭐ Start here!)
- **[QUICKSTART.md](./QUICKSTART.md)** - Developer quickstart
- **[CLAUDE.md](./CLAUDE.md)** - Architecture and technical reference
- **[CUBELV_PRD.md](./CUBELV_PRD.md)** - Full product specification

### ✨ Key Features

✅ Create AI employees with natural language  
✅ 5-tab configuration interface (Settings, Memory, Skills, Budget, Analytics)  
✅ Automatic execution (Manual, Scheduled, Chat-triggered)  
✅ 7 built-in tools (read, write, search, analyze)  
✅ Cost tracking (Credits & Tokens)  
✅ Long-term memory system  
✅ Deep integration with Claude API  

### 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI Engine**: Claude API with tool calling
- **Deployment**: Vercel (with Cron support)

### 🎮 7 Agent Tools

- `read_folder` - Read folder contents
- `create_note` - Add notes
- `update_note` - Update notes
- `create_todo` - Create todos
- `create_chart` - Generate charts
- `web_search` - Search web
- `fetch_stock_data` - Get stock data

### 💡 Use Cases

| Use Case | Trigger | Output |
|----------|---------|--------|
| Stock monitoring | Daily 08:30 | Market alerts & news summary |
| Tech analysis | Weekly Friday 15:30 | Analysis report + charts |
| Task management | Daily 09:00 | Priority todo list |

### 🚀 Next Steps

1. [Start here](./HOW_TO_USE.md) - Follow the complete usage guide
2. Create your first AI employee
3. Test with manual execution
4. Configure scheduling
5. Deploy to Vercel

### 🐛 FAQ

**Q: Do I need coding knowledge?**  
A: No! Just write natural language instructions.

**Q: How much does it cost?**  
A: Based on Claude API usage. ~1 credit per 1000 tokens.

**Q: Does it support Chinese?**  
A: Yes, fully supported!

**Q: Can I use it offline?**  
A: No, it requires Supabase and Claude API connections.

### 📜 License

MIT - Feel free to use and modify

### 📞 Contact

- Email: x1001002004@gmail.com
- GitHub: [chuan2635](https://github.com/chuan2635)

---

<div align="center">

**Build Your One-Person AI Team 🚀**

[⭐ Star this project to support us](https://github.com/chuan2635/chuan-06)

</div>

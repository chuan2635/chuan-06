# CubeLV App 分析文件
> 給 Claude Code 使用的 PRD + 技術規格

---

## 一、產品定位

**名稱：** CubeLV（AI 筆記、待辦、自動化）  
**核心概念：** 「打造你的一人 AI 團隊」—— 用自然語言創建 AI 員工，指派重複性任務，讓 AI 定期自動執行。  
**目標用戶：** 獨立接案者、自媒體、個人投資者、電商賣家等「超級個體」  
**商業模式：** 免費下載 + Pro 訂閱（月 NT$290 / 年 NT$2,990）+ Credits 充值

---

## 二、核心概念模型

```
Workspace（工作區）
└── Folder（資料夾 / 部門）
    ├── Agent（AI 員工）
    │   ├── 設定：名稱、指令、AI 模型、執行輪數、排程、通知
    │   ├── 記憶：長期 context 文字
    │   ├── 技能：可呼叫的 Tools/Functions
    │   ├── 預算：Credits 上限
    │   └── 執行紀錄：每次 run 的 log
    ├── Note（筆記）
    ├── Todo（待辦 / 含子待辦）
    └── Chart（圖表）
```

Agent 可以跨 Folder 讀寫 Note/Todo/Chart，靠 Folder ID 連結。

---

## 三、畫面逐頁規格（來自錄影截圖）

### 3.1 主列表頁（Workspace 首頁）

**用途：** 列出所有 AI 員工（Agent）卡片  
**截圖觀察：** 深色背景，2 欄網格，每張卡片有名稱 + 「開置」狀態標籤

```
┌──────────────────────────────────────────┐
│ ≡  投資研究部        [新增模板] [↑] [...] │
├──────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  消息監控員  │  │   技術研究員     │   │
│  │  開置       │  │   開置          │   │
│  └─────────────┘  └─────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │     ＋ 新增員工                  │    │
│  └──────────────────────────────────┘    │
│                              [⊡ FAB]     │
└──────────────────────────────────────────┘
```

**元件：**
- Header：漢堡選單 + Folder 名稱 + 新增模板 + 分享 + 更多
- Agent 卡片：名稱（大）+ 狀態標籤（小，灰色）+ 頭像 icon
- 新增員工：虛線框 dashed border 按鈕
- FAB：右下角，CubeLV logo icon，白色圓形

---

### 3.2 Agent 詳情頁（底部 Sheet / Push 頁）

**Tab Bar（5個）：** 總覽 ／ 設定 ／ 記憶 ／ 技能 ／ 預算

Header 固定格式：
```
┌────────────────────────────────┐
│  [icon]  消息監控員    [...] [×] │
│  總覽 | 設定 | 記憶 | 技能 | 預算│
│       ^（底線 underline）       │
└────────────────────────────────┘
```

---

### 3.3 Tab：總覽

**統計卡（3格橫排）：**

| 平均 Credits Cost | 平均 Tokens  | 平均執行時長 |
|:-----------------:|:------------:|:------------:|
| **26.40**         | **320.6k**   | **4m 0s**    |
| credits / 每次執行 | 每次執行      | 每次執行     |

**執行紀錄 table：**

| 日期         | 觸發原因 | 狀態   | 時長    | Tokens  |
|:-------------|:---------|:-------|:--------|:--------|
| 06/29 22:44  | 手動     | ✅成功  | 2m 52s  | 314.2k  |
| 06/28 11:31  | 手動     | ⬜已取消| 3m 39s  | 336.9k  |
| 06/27 09:34  | 手動     | ✅成功  | 5m 58s  | 0 ▶     |
| 06/27 01:58  | chat     | ✅成功  | 3m 34s  | 631.1k  |

Badge 顏色：成功=綠色 `#30D158`，已取消=灰色 `#636366`

---

### 3.4 Tab：設定

```
員工名稱
[技術研究員                      ]

員工指令（多行 textarea）
[3. 分析K線走勢，找出關鍵支撐/壓力、
 突破訊號、反轉型態
 4. 撰寫每週技術面研究報告，存入
 📋 投資研究筆記
 5. 若有值得關注的技術訊號，建立圖表存入
 🗃 技術圖表                      ]

AI 模型
[Auto                         ▾]

最大執行輪數
[50 輪                        ▾]

定期排程  ○── （toggle OFF）
[每週五 15:30  ×]  [+ 新增排程]

開啟通知  ●── （toggle ON, 紫色）
```

**指令欄位中的 Mention 元件：**  
`📋 投資研究筆記`、`🗃 技術圖表` — 這是 inline pill，連結到其他 Folder 的筆記/圖表，有底色卡片感

---

### 3.5 Tab：記憶

長文字區塊，以 Markdown 格式呈現 Agent 的 long-term memory：
```markdown
# 消息監控員長期記憶

## 團隊結構
- 投資研究部 AI 公司（AICOMPANY_FOLDER:217965997d8a05ff95fac640）
- 消息監控員 agent（c92d7afd54a92c9d56f6d636）：每日監控台股消息
- 技術研究員 agent（20112556a7db67e2a57d053e）：每週五 15:30 執行技術分析報告
- 協作任務 TODO（6a4284bb541cdaa187d6d935）：統一歸檔所有子任務

## 關鍵資料夾 ID
- 投資研究筆記（NOTE_FOLDER）：084d9b6185c99bde8f842bee
- 投資待辦（TODO_FOLDER）：5b5ef6f89a3c72b165476ac3
```

---

### 3.6 Tab：預算

```
已使用              預算
61 credits         ─（未設定）
未設定預算

過去 7 天平均消耗           8.7 credits / 天

月預算（CREDITS）
[0                    ]  [更新預算]
```

---

### 3.7 筆記/報告頁（Agent 產出內容）

純閱讀頁面，Markdown 渲染：
- Header：`< 返回` + undo/redo + 收藏 + `...`
- 支援 `## 標題`、bullet list、**bold**、⚠️ emoji
- 支援 `資料與工具` 區塊含 inline link pill

---

### 3.8 圖表頁（Agent 產出內容）

```
< 重點追蹤標的的本週漲跌幅比較（6/22-6/26）

  [折線圖 - 多條線，X軸=股票代號，Y軸=漲跌幅%]

  標的        週漲跌幅(%)
  ─────────────────────
  加權指數      -6.64
  台積電 2330   -6.02
  聯發科 2454   -14.4
  台達電 2308   -15.8
  鴻海 2317     -6.5
```

圖表 library：推測用 recharts 或類似

---

## 四、視覺設計規格

### 色彩系統
```
背景      #1C1C1E  (iOS dark bg)
次背景     #2C2C2E  (cards)
分隔線     #3A3A3C
主文字     #FFFFFF
次文字     #8E8E93  (開置、labels)
品牌色/紫  #7B61FF 或 #6C47FF  (toggle on, tab underline)
成功綠     #30D158
取消灰     #636366 (badge)
互動藍     #0A84FF (links)
```

### 字體規格
- 系統字：SF Pro Display / SF Pro Text (iOS native)
- Agent 名稱：~18-20pt semibold
- 統計大數字：~28-32pt bold
- 表格內容：~14pt regular
- 標籤/badge：~12pt medium

### 關鍵元件
1. **Agent 卡片**：`border-radius: 12px`，深灰背景，2欄 grid
2. **Tab Bar**：底線 underline indicator，紫色，無背景填充
3. **Badge pill**：`border-radius: 6px`，小 padding，成功綠 / 灰
4. **Toggle**：iOS 風格，ON = 紫色
5. **Inline Mention Pill**：icon + 文字，圓角卡片，灰底
6. **FAB**：右下角，白色圓形，CubeLV logo，有 shadow
7. **Stats 卡片**：3等分橫排，數字大 label 小

---

## 五、資料結構（建議 Supabase Schema）

```sql
-- Folders（工作區資料夾）
folders: id, name, type, owner_id, created_at

-- Agents（AI 員工）
agents: id, folder_id, name, instructions, 
        ai_model, max_rounds, schedule_cron,
        notifications_enabled, avatar_icon,
        created_at, updated_at

-- Agent Memory
agent_memories: id, agent_id, content (text), updated_at

-- Agent Skills
agent_skills: id, agent_id, skill_type, config (jsonb)

-- Agent Budget
agent_budgets: id, agent_id, monthly_limit, credits_used

-- Execution Logs
execution_logs: id, agent_id, triggered_by (手動/chat/排程),
                status (success/cancelled/failed),
                duration_seconds, tokens_used, credits_used,
                started_at, ended_at

-- Notes
notes: id, folder_id, title, content (markdown), created_by_agent_id, created_at

-- Todos
todos: id, folder_id, title, completed, parent_id,
       assigned_to_agent_id, due_at, created_at

-- Charts
charts: id, folder_id, title, chart_type, data (jsonb), created_by_agent_id, created_at
```

---

## 六、前端技術建議（React SPA）

基於現有的 chuan-06 技術棧（React + Vercel + Supabase）：

```
前端：React 18 + TypeScript
狀態：Zustand 或 React Query
路由：React Router v6
UI：Tailwind CSS（dark theme）
圖表：Recharts
Markdown：react-markdown + remark-gfm
部署：Vercel
資料庫：Supabase（已有）
AI：Anthropic Claude API（已有串接）
排程：Vercel Cron Jobs 或 Supabase Edge Functions
```

---

## 七、AI Agent 執行流程

```
觸發（手動 / chat / 排程 cron）
  ↓
建立 execution_log（status: running）
  ↓
載入 Agent 設定 + 記憶 + 技能清單
  ↓
呼叫 Claude API（claude-sonnet-4-6）
  system = agent.instructions + agent_memory.content
  tools = agent.skills (讀寫 Note/Todo/Chart)
  max_rounds = agent.max_rounds
  ↓
Agent 自主執行（讀取資料 → 分析 → 寫入 Note/Chart/Todo）
  ↓
更新 execution_log（status, duration, tokens, credits）
更新 agent_budgets.credits_used
  ↓
發送通知（若 notifications_enabled）
```

**Agent Tools（技能）範例：**
```typescript
tools: [
  { name: "read_folder", description: "讀取資料夾內容" },
  { name: "create_note", description: "新增筆記" },
  { name: "update_note", description: "更新筆記" },
  { name: "create_todo", description: "新增待辦" },
  { name: "create_chart", description: "新增圖表（帶 JSON 資料）" },
  { name: "web_search", description: "搜尋網路資訊" },
  { name: "fetch_stock_data", description: "抓取台股資料" },
]
```

---

## 八、MVP 建議開發順序

1. **Phase 1 — 基礎架構**
   - Supabase tables 建立（folders, agents, notes, todos）
   - Agent 建立/編輯 UI（設定 tab）
   - 手動觸發執行 + execution log

2. **Phase 2 — 核心 Agent 功能**
   - 記憶 tab（讀寫 long-term memory）
   - 技能設定（選擇可用 tools）
   - 執行紀錄顯示（總覽 tab）

3. **Phase 3 — 自動化**
   - 定期排程（Vercel Cron）
   - 預算管控（credits 追蹤）
   - 通知推播

4. **Phase 4 — 資料視覺化**
   - Chart 元件（Recharts）
   - 筆記 Markdown 渲染
   - Inline Mention Pill

---

## 九、與現有 chuan-06 的整合點

- **Supabase** 已有連線 → 直接新增 tables
- **Claude API（Anthropic）** 已串接 → Agent 執行引擎
- **Vercel** 部署 → 新增 Cron Jobs API routes
- **LINE Bot** 可作為 Agent 觸發入口（chat 觸發）

---

## 開發進度追蹤

- [ ] Phase 1：基礎架構與資料庫設計
- [ ] Phase 2：核心 Agent 功能
- [ ] Phase 3：自動化排程系統
- [ ] Phase 4：資料視覺化

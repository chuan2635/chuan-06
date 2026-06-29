# CubeLV App 開發文檔

## 項目概述

**CubeLV** 是一個「打造一人 AI 團隊」的應用程式，讓用戶用自然語言創建 AI 員工（Agent），指派重複性任務，實現定期自動執行。

**核心用戶**：獨立接案者、自媒體、個人投資者、電商賣家等超級個體

**商業模式**：免費 + Pro 訂閱（月 NT$290 / 年 NT$2,990）+ Credits 充值

---

## 系統架構

### 概念層次
```
Workspace（工作區）
└── Folder（資料夾/部門）
    ├── Agent（AI 員工）
    ├── Note（筆記）
    ├── Todo（待辦）
    └── Chart（圖表）
```

### 核心功能
- **Agent 建立與管理**：設定名稱、指令、AI 模型、執行輪數、排程、通知
- **長期記憶系統**：Agent 可記憶 context，支持跨任務知識累積
- **技能系統**：Agent 可呼叫工具（讀寫 Note/Todo/Chart、搜尋、抓取資料）
- **執行自動化**：支援手動觸發、定時排程、chat 觸發
- **成本管控**：Credits 預算追蹤、Tokens 計量、執行時長監控

---

## 技術棧

### 前端
- **框架**：React 18 + TypeScript
- **UI 庫**：Tailwind CSS（深色主題）
- **狀態管理**：Zustand 或 React Query
- **路由**：React Router v6
- **圖表**：Recharts
- **Markdown**：react-markdown + remark-gfm
- **部署**：Vercel

### 後端 & 基礎設施
- **資料庫**：Supabase（PostgreSQL）
- **AI 引擎**：Anthropic Claude API（claude-sonnet-4-6）
- **排程**：Vercel Cron Jobs 或 Supabase Edge Functions
- **驗證**：Supabase Auth

### 現有資源
- Supabase 已連線
- Claude API 已串接
- Vercel 部署環境已配置

---

## 數據庫設計

### Supabase Tables

```sql
-- 1. Folders（工作區資料夾）
folders:
  - id (uuid, primary)
  - name (text)
  - type (text) -- 'workspace' | 'folder'
  - owner_id (uuid, fk users)
  - created_at (timestamp)
  - updated_at (timestamp)

-- 2. Agents（AI 員工）
agents:
  - id (uuid, primary)
  - folder_id (uuid, fk folders)
  - name (text)
  - instructions (text) -- 員工指令
  - ai_model (text) -- 'Auto' | 'claude-opus-4-8' | 'claude-sonnet-4-6'
  - max_rounds (integer) -- 最大執行輪數
  - schedule_cron (text, nullable) -- Cron 表達式
  - notifications_enabled (boolean)
  - avatar_icon (text, nullable) -- emoji or icon ID
  - created_at (timestamp)
  - updated_at (timestamp)

-- 3. Agent Memory（長期記憶）
agent_memories:
  - id (uuid, primary)
  - agent_id (uuid, fk agents)
  - content (text) -- Markdown 格式
  - updated_at (timestamp)

-- 4. Agent Skills（技能配置）
agent_skills:
  - id (uuid, primary)
  - agent_id (uuid, fk agents)
  - skill_type (text) -- 'read_folder' | 'create_note' | 'web_search' 等
  - config (jsonb, nullable) -- 技能配置參數

-- 5. Agent Budget（預算管控）
agent_budgets:
  - id (uuid, primary)
  - agent_id (uuid, fk agents)
  - monthly_limit (integer) -- 月預算 credits
  - credits_used (integer) -- 已使用 credits
  - period_start (timestamp) -- 計費週期開始
  - period_end (timestamp) -- 計費週期結束

-- 6. Execution Logs（執行紀錄）
execution_logs:
  - id (uuid, primary)
  - agent_id (uuid, fk agents)
  - triggered_by (text) -- 'manual' | 'schedule' | 'chat'
  - status (text) -- 'running' | 'success' | 'cancelled' | 'failed'
  - duration_seconds (integer)
  - tokens_used (integer)
  - credits_used (integer)
  - started_at (timestamp)
  - ended_at (timestamp)
  - error_message (text, nullable)

-- 7. Notes（筆記）
notes:
  - id (uuid, primary)
  - folder_id (uuid, fk folders)
  - title (text)
  - content (text) -- Markdown
  - created_by_agent_id (uuid, nullable, fk agents)
  - created_at (timestamp)
  - updated_at (timestamp)
  - is_favorite (boolean)

-- 8. Todos（待辦事項）
todos:
  - id (uuid, primary)
  - folder_id (uuid, fk folders)
  - title (text)
  - description (text, nullable)
  - completed (boolean)
  - parent_id (uuid, nullable, fk todos) -- 子待辦支持
  - assigned_to_agent_id (uuid, nullable, fk agents)
  - due_at (timestamp, nullable)
  - priority (text) -- 'low' | 'medium' | 'high'
  - created_at (timestamp)
  - updated_at (timestamp)

-- 9. Charts（圖表）
charts:
  - id (uuid, primary)
  - folder_id (uuid, fk folders)
  - title (text)
  - chart_type (text) -- 'line' | 'bar' | 'pie' 等
  - data (jsonb) -- Recharts 格式數據
  - created_by_agent_id (uuid, nullable, fk agents)
  - created_at (timestamp)
  - updated_at (timestamp)
```

---

## 業務流程

### Agent 執行流程

```
1. 觸發
   ├─ 手動執行（按鈕）
   ├─ 定時排程（Cron）
   └─ Chat 觸發（LINE Bot 或系統內）

2. 初始化
   ├─ 建立 execution_log（status: running）
   ├─ 載入 Agent 設定（name, instructions, ai_model, max_rounds）
   ├─ 載入長期記憶（agent_memories.content）
   └─ 載入技能清單（agent_skills）

3. AI 執行
   ├─ 呼叫 Claude API
   │  ├─ system = agent.instructions + agent_memory.content
   │  ├─ tools = agent.skills (tool definitions)
   │  └─ max_rounds = agent.max_rounds
   ├─ Agent 自主循環
   │  ├─ 讀取資料（read_folder, fetch_stock_data）
   │  ├─ 分析資料
   │  └─ 寫入產出（create_note, create_chart, create_todo）
   └─ 直到目標完成或輪數達上限

4. 結算
   ├─ 更新 execution_log（status, duration_seconds, tokens_used, credits_used）
   ├─ 計算 credits（通常 1 credit ≈ 1000 tokens）
   ├─ 更新 agent_budgets.credits_used
   ├─ 檢查預算超限警告
   └─ 發送通知（若 notifications_enabled = true）

5. 記錄
   └─ 儲存執行結果與分析日誌
```

### Agent Tools（技能清單）

```typescript
const AVAILABLE_TOOLS = [
  {
    name: 'read_folder',
    description: '讀取指定資料夾的所有筆記、待辦、圖表',
    params: { folder_id: 'string' }
  },
  {
    name: 'create_note',
    description: '新增筆記到指定資料夾',
    params: { folder_id: 'string', title: 'string', content: 'string (markdown)' }
  },
  {
    name: 'update_note',
    description: '更新既有筆記',
    params: { note_id: 'string', title: 'string', content: 'string' }
  },
  {
    name: 'create_todo',
    description: '新增待辦事項',
    params: { folder_id: 'string', title: 'string', assigned_to_agent_id: 'string (optional)' }
  },
  {
    name: 'create_chart',
    description: '新增圖表',
    params: { folder_id: 'string', title: 'string', chart_type: 'line|bar|pie', data: 'jsonb' }
  },
  {
    name: 'web_search',
    description: '搜尋網路資訊',
    params: { query: 'string', limit: 'number (default 10)' }
  },
  {
    name: 'fetch_stock_data',
    description: '抓取台股資料（收盤價、漲跌幅、成交量等）',
    params: { symbol: 'string', date_range: 'string (optional)' }
  }
]
```

---

## 界面設計規格

### 色彩系統
- **背景**：`#1C1C1E`（iOS dark）
- **次背景**：`#2C2C2E`（cards）
- **分隔線**：`#3A3A3C`
- **主文字**：`#FFFFFF`
- **次文字**：`#8E8E93`
- **品牌紫**：`#7B61FF` 或 `#6C47FF`（toggle on, tab underline）
- **成功綠**：`#30D158`
- **取消灰**：`#636366`
- **互動藍**：`#0A84FF`

### 關鍵元件
1. **Agent 卡片**：border-radius 12px，grid 2列
2. **Tab Bar**：底線 underline indicator（紫色），無背景
3. **Badge**：圓角 6px，成功綠 / 灰色
4. **Toggle**：iOS 風格，ON = 紫色
5. **Mention Pill**：icon + 文字，圓角卡片，灰底
6. **FAB**：右下角，白色圓形，CubeLV logo，有陰影
7. **Stats 卡片**：3等分橫排，大數字 + 小 label

### 頁面列表
- `FolderListPage`：Agent 列表（主頁）
- `AgentDetailPage`：Agent 詳情（5 tabs）
  - Tab 1：總覽（統計卡 + 執行紀錄表）
  - Tab 2：設定（名稱、指令、模型、輪數、排程、通知）
  - Tab 3：記憶（Markdown 編輯器）
  - Tab 4：技能（Checkbox 列表）
  - Tab 5：預算（Credits 統計）
- `NotePage`：筆記詳情（Markdown 渲染）
- `ChartPage`：圖表詳情（Recharts 圖表）

---

## MVP 開發計劃

### Phase 1：基礎架構（Week 1-2）
- [ ] Supabase 數據庫設計 & 表創建
- [ ] Supabase RLS 權限設定
- [ ] React 項目初始化（TypeScript, Tailwind, Router）
- [ ] 基礎認證流程（Supabase Auth）
- [ ] Folder & Agent 的 CRUD API
- [ ] Agent 列表頁 UI（2列網格卡片）
- [ ] Agent 詳情頁骨架（Tab bar 切換）

### Phase 2：設定 & 執行（Week 3-4）
- [ ] Agent 設定 tab UI（編輯指令、模型選擇等）
- [ ] 手動觸發執行 API
- [ ] Claude API 集成（agent execution engine）
- [ ] Execution logs 表設計 & 顯示
- [ ] 總覽 tab UI（統計卡 + 執行紀錄表）
- [ ] 成功/失敗狀態顯示 & 錯誤處理

### Phase 3：Agent 智能（Week 5-6）
- [ ] 記憶 tab UI（Markdown 編輯器 + 自動保存）
- [ ] 技能 tab UI（Checkbox 列表）
- [ ] Agent tools 定義（read_folder, create_note, 等）
- [ ] Note & Chart CRUD 實現
- [ ] Web search tool 集成

### Phase 4：自動化 & 成本控制（Week 7-8）
- [ ] 定期排程設定（Cron 表達式輸入）
- [ ] Vercel Cron Jobs 配置
- [ ] Credits 計算邏輯（tokens → credits 轉換）
- [ ] 預算 tab UI（月預算設定、使用統計）
- [ ] 預算超限警告

### Phase 5：資料可視化（Week 9-10）
- [ ] Markdown 渲染（react-markdown）
- [ ] Chart 頁面（Recharts 集成）
- [ ] Mention pill 組件（inline 連結）
- [ ] Note 列表 & 搜尋

### Phase 6：通知 & 優化（Week 11-12）
- [ ] 通知系統（email / push）
- [ ] LINE Bot 集成（觸發 agent）
- [ ] 性能優化（lazy loading, 分頁）
- [ ] 錯誤邊界 & fallback UI

---

## 快速開始

### 1. 環境變數
```bash
# .env.local
VITE_SUPABASE_URL=<你的 supabase url>
VITE_SUPABASE_ANON_KEY=<你的 anon key>
ANTHROPIC_API_KEY=<你的 claude api key>
```

### 2. 安裝依賴
```bash
npm install
npm install react-markdown remark-gfm recharts zustand react-router-dom
```

### 3. 啟動開發服務器
```bash
npm run dev
```

### 4. Supabase 初始化
執行 `CUBELV_PRD.md` 中的 SQL 建立所有表

---

## 常見任務

### 新增 Agent
```
POST /api/agents
{
  "folder_id": "uuid",
  "name": "消息監控員",
  "instructions": "...",
  "ai_model": "claude-sonnet-4-6",
  "max_rounds": 50,
  "notifications_enabled": true
}
```

### 手動觸發 Agent
```
POST /api/agents/:id/execute
{
  "triggered_by": "manual"
}
```

### 更新 Agent 記憶
```
PUT /api/agents/:id/memory
{
  "content": "# Long-term memory..."
}
```

---

## 參考資源

- **PRD 詳細規格**：見 `CUBELV_PRD.md`
- **Supabase 官方文檔**：https://supabase.io/docs
- **Claude API**：https://docs.anthropic.com
- **Recharts**：https://recharts.org
- **Tailwind CSS**：https://tailwindcss.com

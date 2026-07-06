# CubeLV App 產品規格文件 (PRD)
> 給 Claude Code 使用的完整規格 + 技術指南

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

---

## 三、畫面設計規格

### 主列表頁
- 2欄網格 Agent 卡片
- FAB 按鈕（右下角）
- Header with Folder 名稱

### Agent 詳情頁
- 5 個 Tab：總覽 / 設定 / 記憶 / 技能 / 預算
- 總覽：統計卡（3格）+ 執行紀錄表
- 設定：名稱、指令、模型、輪數、排程、通知
- 記憶：Markdown 編輯器
- 技能：Checkbox 列表
- 預算：Credits 使用統計

---

## 四、色彩系統
```
背景      #1C1C1E
次背景     #2C2C2E
分隔線     #3A3A3C
主文字     #FFFFFF
次文字     #8E8E93
品牌紫     #7B61FF
成功綠     #30D158
取消灰     #636366
互動藍     #0A84FF
```

---

## 五、資料結構

### Supabase Tables
- folders: id, name, owner_id, created_at
- agents: id, folder_id, name, instructions, ai_model, max_rounds, schedule_cron, notifications_enabled, created_at, updated_at
- agent_memories: id, agent_id, content, updated_at
- agent_skills: id, agent_id, skill_type, config
- agent_budgets: id, agent_id, monthly_limit, credits_used, period_start, period_end
- execution_logs: id, agent_id, triggered_by, status, duration_seconds, tokens_used, credits_used, started_at, ended_at
- notes: id, folder_id, title, content, created_by_agent_id, created_at, updated_at
- todos: id, folder_id, title, description, completed, parent_id, assigned_to_agent_id, due_at, priority, created_at, updated_at
- charts: id, folder_id, title, chart_type, data, created_by_agent_id, created_at, updated_at

---

## 六、技術棧
- React 18 + TypeScript
- Tailwind CSS（深色主題）
- React Router v6
- Zustand（狀態管理）
- Recharts（圖表）
- react-markdown + remark-gfm（Markdown渲染）
- Supabase（資料庫 + Auth）
- Anthropic Claude API
- Vercel 部署

---

## 七、Agent 執行流程
```
手動/排程/chat 觸發
  ↓
建立 execution_log (status: running)
  ↓
載入 Agent 設定 + 記憶 + 技能
  ↓
調用 Claude API (claude-sonnet-4-6)
  system = instructions + memory
  tools = skills (read_folder, create_note, etc.)
  ↓
Agent 自主執行迴圈
  ↓
更新 execution_log (status, tokens, credits)
更新預算
  ↓
發送通知
```

---

## 八、MVP 開發順序

### Phase 1：基礎架構
- Supabase schema 建立
- React 項目初始化
- Folder & Agent CRUD
- Agent 列表頁 UI
- Agent 詳情頁骨架

### Phase 2：執行引擎
- Agent 設定編輯
- 手動執行
- Claude API 集成
- 執行紀錄顯示

### Phase 3：Agent 功能
- 記憶編輯
- 技能配置
- Note/Chart CRUD
- Web search 集成

### Phase 4：自動化
- 排程設定
- Vercel Cron
- Credits 計算
- 預算管控

### Phase 5：可視化
- Markdown 渲染
- Recharts
- Note 列表
- 搜尋功能

### Phase 6：完善
- 通知系統
- LINE Bot 集成
- 性能優化
- 錯誤處理

---

## 九、下一步行動
1. ✅ 確認設計規格（本文件）
2. 提交 GitHub
3. 建立 Supabase tables
4. 開發 Phase 1

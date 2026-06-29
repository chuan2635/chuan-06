# 🚀 CubeLV App - 完整使用指南

> 「打造你的一人 AI 團隊」—— 用自然語言創建 AI 員工，指派重複性任務，實現定期自動執行

---

## 📌 一句話總結

**CubeLV** 讓你創建虛擬 AI 員工，賦予它們工作指令，讓它們自動執行日常任務（監控市場、撰寫報告、抓取數據等）。

---

## 🎯 3 種使用場景

### 場景 1：股市監控員（你的用例）

**目標**：每天自動監控台股消息，找出重大事件

```
👤 Agent: 消息監控員
📋 指令: 每日監控台股市場重大消息...
🔧 技能: web_search (搜尋新聞) + create_note (記錄消息)
⏰ 排程: 每天早上 8:30 AM
📤 產出: 自動寫成筆記存檔
```

### 場景 2：技術分析師

**目標**：每週五分析圖表，生成技術分析報告

```
👤 Agent: 技術研究員
📋 指令: 分析 K 線走勢，找出支撐/壓力...
🔧 技能: fetch_stock_data + create_chart + create_note
⏰ 排程: 每週五 15:30（收盤後）
📤 產出: 生成技術分析圖表和報告
```

### 場景 3：個人助理

**目標**：管理待辦事項和筆記

```
👤 Agent: 待辦助理
📋 指令: 整理每日待辦，提醒優先任務...
🔧 技能: create_todo + read_folder + update_note
⏰ 排程: 每天 09:00 AM
📤 產出: 生成優先待辦清單
```

---

## 🛠️ 快速開始（3 步）

### Step 1️⃣：環境準備（5 分鐘）

#### 1.1 克隆項目
```bash
git clone https://github.com/chuan2635/chuan-06.git
cd chuan-06
```

#### 1.2 安裝依賴
```bash
npm install
```

#### 1.3 配置環境變數
複製 `.env.example` 為 `.env.local`：
```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入你的密鑰：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
```

**取得密鑰：**
- 🔗 **Supabase**：https://app.supabase.com → Project → Settings → API
- 🔗 **Claude API**：https://console.anthropic.com → API Keys

---

### Step 2️⃣：初始化數據庫（5 分鐘）

#### 2.1 連接 Supabase
1. 登入 https://app.supabase.com
2. 新建或選擇項目
3. 進入 **SQL Editor**

#### 2.2 執行 Migration
複製 `supabase/migrations/001_init_schema.sql` 全部內容，貼到 SQL Editor 執行。

![SQL Editor](https://user-images.githubusercontent.com/...)

執行結果應該看到 9 個表被建立：
- ✅ folders
- ✅ agents
- ✅ agent_memories
- ✅ agent_skills
- ✅ agent_budgets
- ✅ execution_logs
- ✅ notes
- ✅ todos
- ✅ charts

---

### Step 3️⃣：啟動應用（2 分鐘）

```bash
npm run dev
```

🌐 自動打開 http://localhost:5173

```
  VITE v5.x.x  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

✅ 應用已啟動！

---

## 💡 核心功能速查表

### 建立 AI 員工

| 步驟 | 操作 | 說明 |
|------|------|------|
| 1️⃣ | 點擊 **FAB**（右下角 ⊡ 按鈕）| 打開建立對話 |
| 2️⃣ | 輸入 **Agent 名稱** | 如「消息監控員」 |
| 3️⃣ | 編寫 **工作指令** | 自然語言描述任務 |
| 4️⃣ | 選擇 **AI 模型** | 推薦 claude-sonnet-4-6 |
| 5️⃣ | 設置 **執行輪數** | 20-50（多輪對話深度）|
| 6️⃣ | 打開 **通知** | 完成時發送通知 |
| 7️⃣ | 點擊 **保存** | 建立成功 |

### 編輯 Agent 設定

```
Agent 詳情頁 → 設定 Tab
├─ 名稱：修改 Agent 名稱
├─ 指令：修改工作指令（支援 Markdown）
├─ AI 模型：選擇 Claude 版本
├─ 執行輪數：增加思考深度
├─ 排程：設置定期執行時間
└─ 通知：開啟/關閉完成提醒
```

### 管理 Agent 記憶

```
Agent 詳情頁 → 記憶 Tab
├─ 長期記憶編輯器（Markdown 格式）
├─ 系統自動保存
├─ 支援連結到其他 Note/Chart
└─ 例子：
    # 監控清單
    - 台積電 (2330)
    - 聯發科 (2454)
```

### 配置 Agent 技能

```
Agent 詳情頁 → 技能 Tab
勾選需要的工具：
├─ ✅ read_folder（讀取資料）
├─ ✅ create_note（寫筆記）
├─ ✅ update_note（更新筆記）
├─ ✅ create_chart（生成圖表）
├─ ✅ web_search（搜尋新聞）
└─ ✅ fetch_stock_data（抓取股票）
```

### 查看執行紀錄

```
Agent 詳情頁 → 總覽 Tab
├─ 統計卡片
│  ├─ 平均 Credits Cost
│  ├─ 平均 Tokens
│  └─ 平均執行時長
└─ 執行紀錄表
   ├─ 日期
   ├─ 觸發方式（手動/排程/chat）
   ├─ 執行狀態（✅成功/❌失敗）
   ├─ 消耗時長
   └─ Token 使用量
```

### 設置預算限制

```
Agent 詳情頁 → 預算 Tab
├─ 已使用 Credits：追蹤消耗
├─ 月度預算：設置上限
├─ 過去 7 天平均
└─ 超過預算時會發出警告
```

---

## 📊 主要頁面導覽

### 1. Agent 列表頁（首頁）

```
┌─────────────────────────────────────┐
│ ≡  投資研究部   [新增] [分享] [更多]   │
├─────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  │
│  │ 💬消息監控員  │  │ 📊技術研究員  │  │
│  │   開置       │  │   開置      │  │
│  └──────────────┘  └──────────────┘  │
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  ＋ 新增員工                    │ │
│  └─────────────────────────────────┘ │
│                             [⊡ FAB] │
└─────────────────────────────────────┘

功能：
- 2 欄網格顯示所有 Agents
- 點擊卡片打開詳情頁
- FAB 按鈕快速新增
```

### 2. Agent 詳情頁（5 Tabs）

```
┌─────────────────────────────────────┐
│  🤖 消息監控員      [更多] [關閉]    │
│  總覽 | 設定 | 記憶 | 技能 | 預算    │
├─────────────────────────────────────┤
│                                      │
│  Tab Content                         │
│  (根據選擇的 Tab 顯示不同內容)        │
│                                      │
└─────────────────────────────────────┘

5 個 Tabs：
1. 總覽 - 統計卡片 + 執行紀錄表
2. 設定 - 編輯名稱、指令、模型、排程
3. 記憶 - Markdown 編輯器（長期記憶）
4. 技能 - 勾選 6 個可用工具
5. 預算 - Credits 統計與月預算設定
```

---

## 🎮 常見任務操作

### 任務 1：建立「股市監控員」

**目標**：每天自動監控台股消息

**步驟**：
1. 點擊 FAB（⊡ 按鈕）
2. 輸入名稱：`消息監控員`
3. 輸入指令：
   ```
   每日早上 8:30 搜尋台股重大消息
   - 監控這些股票：台積電(2330)、聯發科(2454)、鴻海(2317)
   - 特別關注：技術面事件、異常波動、法說會公告
   - 將重要消息寫成筆記存入「投資研究筆記」資料夾
   - 如有即時警示，標註「⚠️ 即時警示」
   ```
4. 選擇模型：`Auto` 或 `claude-sonnet-4-6`
5. 執行輪數：`30 輪`
6. 打開通知：✅
7. 點擊保存

**進階設置**：
- 進入「技能」Tab，勾選：
  - ✅ web_search（搜尋新聞）
  - ✅ create_note（寫筆記）
- 進入「記憶」Tab，新增監控清單：
  ```markdown
  # 監控清單
  - 台積電 (2330)
  - 聯發科 (2454)
  - 鴻海 (2317)
  - 台達電 (2308)

  # 重點關注
  - 技術面突破
  - 異常成交量
  - 法說會公告
  ```
- 進入「設定」Tab，設置排程：
  - ☑️ 定期排程：開啟
  - 時間：`每天 08:30`

### 任務 2：手動執行 Agent

**目標**：立即執行一個 Agent，不等排程

**步驟**：
1. 打開 Agent 詳情頁
2. 點擊 Header 上的「🚀 執行」按鈕（待實現）
3. 等待執行完成
4. 查看「總覽」Tab 的執行紀錄

> ⚠️ 目前「執行」按鈕需要你自己在 `AgentDetailPage.tsx` 中實現

### 任務 3：查看 Agent 產出

**目標**：查看 Agent 執行後產生的筆記/圖表

**步驟**：
1. 進入「投資研究筆記」資料夾
2. 查看最新筆記（由 Agent 建立）
3. 點擊筆記查看完整內容
4. 查看圖表和數據

---

## ⚙️ 進階配置

### 設置定期排程

在 Agent 設定中：
```
☑️ 定期排程：打開

排程表達式（Cron Format）：
- 每天 08:30  →  30 8 * * *
- 每週五 15:30 →  30 15 * * 5
- 每月 1 號     →  0 9 1 * *
```

### 連結到其他 Note/Chart

在指令中使用 Mention Pill：
```markdown
## 產出位置
- 筆記存入 📋 投資研究筆記
- 圖表存入 🗃 技術圖表
- 待辦指派給 🎯 協作任務
```

### 設置 Credits 預算

在「預算」Tab：
1. 輸入月預算（如 1000 credits）
2. 點擊「更新預算」
3. 系統會在接近上限時警告

> 1 credit ≈ 1000 tokens（Claude API 用量單位）

---

## 🐛 常見問題

### Q1：App 無法啟動

**症狀**：`npm run dev` 報錯

**解決**：
```bash
# 清除依賴重新安裝
rm -rf node_modules package-lock.json
npm install

# 檢查 Node 版本（需要 >= 18）
node --version
```

### Q2：Supabase 連接失敗

**症狀**：Cannot connect to Supabase

**檢查清單**：
- [ ] `.env.local` 中 `VITE_SUPABASE_URL` 設置正確
- [ ] `VITE_SUPABASE_ANON_KEY` 不為空
- [ ] 網絡連接正常
- [ ] Supabase 項目已建立並激活

### Q3：Claude API 返回 401

**症狀**：API key is invalid

**解決**：
```bash
# 驗證 API Key
echo $ANTHROPIC_API_KEY

# 如果為空，重新設置
export ANTHROPIC_API_KEY=sk-ant-...
```

### Q4：Agent 執行失敗

**檢查**：
1. 進入「總覽」Tab 查看執行紀錄
2. 點擊失敗的記錄查看錯誤信息
3. 檢查指令是否合理（不要過於複雜）
4. 檢查 Credits 預算是否充足

### Q5：筆記無法保存

**可能原因**：
- Supabase RLS 權限未設置
- 用戶未認證
- 資料夾 ID 錯誤

**解決**：在瀏覽器 Console 檢查：
```javascript
import { supabase } from '@/utils/supabaseClient';
const user = await supabase.auth.getUser();
console.log('User:', user);
```

---

## 🚀 部署到生產環境

### Vercel 部署

```bash
# 1. 推送到 GitHub
git push origin claude/taiwan-stock-monitoring-pzhig6

# 2. 連接 Vercel
vercel link

# 3. 設置環境變數
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY

# 4. 部署
vercel deploy --prod
```

### 設置定期排程（Vercel Cron）

建立 `api/cron/execute-agents.ts`：
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { executeAgent } from '@/api/agentExecutor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 驗證 Vercel Cron 密鑰
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 執行所有啟用排程的 Agents
  const agents = await fetchAgentsWithCron();
  
  for (const agent of agents) {
    await executeAgent(agent.id, 'schedule');
  }

  res.status(200).json({ executed: agents.length });
}

// vercel.json 配置
{
  "crons": [{
    "path": "/api/cron/execute-agents",
    "schedule": "*/30 * * * *"  // 每 30 分鐘執行一次
  }]
}
```

---

## 📚 學習資源

| 主題 | 連結 |
|------|------|
| 📖 React | https://react.dev |
| 🎨 Tailwind CSS | https://tailwindcss.com |
| 🗄️ Supabase | https://supabase.com/docs |
| 🤖 Claude API | https://docs.anthropic.com |
| 📊 Recharts | https://recharts.org |

---

## 💬 取得幫助

- 📖 查看 `QUICKSTART.md` 了解詳細的開發指南
- 📝 查看 `CLAUDE.md` 了解項目架構
- 🔍 查看 `CUBELV_PRD.md` 了解完整的產品規格
- 💻 在 GitHub Issues 提問

---

## 🎉 你現在可以

✅ 建立自己的 AI 員工  
✅ 指派自動化任務  
✅ 監控 Credits 消耗  
✅ 追蹤執行紀錄  
✅ 長期記憶累積  
✅ 部署到雲端  

**祝你開發愉快！🚀**

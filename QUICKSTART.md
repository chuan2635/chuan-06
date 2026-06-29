# CubeLV App - 快速開始指南

## 🚀 5 分鐘上手

### 第 1 步：環境設置

#### 1.1 安裝依賴
```bash
cd chuan-06
npm install
npm install react react-dom typescript @types/react @types/react-dom
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
npm install zustand react-markdown remark-gfm recharts
npm install @anthropic-ai/sdk @supabase/supabase-js
```

#### 1.2 設置環境變數
建立 `.env.local` 文件：
```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Claude API
ANTHROPIC_API_KEY=sk-ant-...
```

> 從以下位置取得密鑰：
> - **Supabase**：https://app.supabase.com → Project Settings → API
> - **Claude API**：https://console.anthropic.com → API Keys

---

### 第 2 步：初始化 Supabase 數據庫

#### 2.1 在 Supabase 建立數據庫
1. 登入 Supabase console：https://app.supabase.com
2. 點擊 **SQL Editor**
3. 複製 `supabase/migrations/001_init_schema.sql` 的全部內容
4. 貼到 SQL Editor 並執行

```sql
-- 或直接執行這個 migration：
\i supabase/migrations/001_init_schema.sql
```

#### 2.2 驗證表格已建立
在 Supabase → **Table Editor** 檢查這 9 個表是否存在：
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

### 第 3 步：啟動開發服務器

```bash
npm run dev
```

你應該看到：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

🌐 在瀏覽器打開：http://localhost:5173

---

### 第 4 步：手動測試應用

#### 4.1 建立測試數據

使用 Supabase Studio 直接插入測試數據（或透過 API）：

**1️⃣ 建立 Folder**
```bash
# 在 Supabase SQL Editor 執行
INSERT INTO folders (name, type, owner_id)
VALUES ('投資研究部', 'workspace', 'your-user-uuid');
```

取得你的 user UUID：
- 登入應用後，開啟瀏覽器 DevTools
- 執行：`console.log(await getCurrentUser())`
- 複製 `user.id`

**2️⃣ 建立 Agent**
```sql
INSERT INTO agents (folder_id, name, instructions, ai_model, max_rounds, notifications_enabled)
VALUES (
  'folder-uuid-here',
  '消息監控員',
  '每日監控台股市場重大消息。聚焦技術面相關事件。特別關注異常波動。',
  'claude-sonnet-4-6',
  50,
  true
);
```

#### 4.2 在應用中操作

1. **查看 Agent 列表**
   - 頁面應顯示剛建立的「消息監控員」卡片
   - 點擊卡片打開詳情頁

2. **瀏覽 5 個 Tabs**
   - **總覽**：統計數據 + 執行紀錄表
   - **設定**：編輯名稱、指令、模型、輪數
   - **記憶**：編輯長期記憶（Markdown）
   - **技能**：選擇 6 個可用工具
   - **預算**：設置月度 Credits 預算

3. **測試工具**
   - 在「記憶」tab 輸入 Markdown 測試：
   ```markdown
   # 消息監控員長期記憶

   ## 監控清單
   - 台積電 (2330)
   - 聯發科 (2454)
   - 鴻海 (2317)
   ```

---

## 🎮 核心功能操作指南

### 建立新 Agent

```bash
# 方式 1：點擊 FAB（右下角按鈕）
# 方式 2：點擊虛線框「+ 新增員工」
```

流程：
1. 輸入 Agent 名稱（如「技術分析師」）
2. 編寫詳細指令
3. 選擇 AI 模型（推薦：Auto 或 claude-sonnet-4-6）
4. 設置最大輪數（建議：20-50）
5. 打開通知選項
6. 儲存

### 手動執行 Agent

在實現中，你需要添加「執行」按鈕。以下是代碼示例：

```typescript
// 在 AgentDetailPage.tsx 中添加
import { executeAgent } from '@/api/agentExecutor';

const handleExecute = async () => {
  try {
    const result = await executeAgent(agentId, 'manual');
    console.log('Agent 執行成功:', result);
    // 重新加載執行紀錄
    const logs = await agentApi.listExecutionLogs(agentId);
    setExecutionLogs(logs);
  } catch (error) {
    console.error('執行失敗:', error);
  }
};

// 在 Header 中添加按鈕
<button onClick={handleExecute} className="px-4 py-2 bg-brand-purple text-white rounded-pill">
  🚀 執行
</button>
```

### 編輯 Agent 設定

1. 打開 Agent 詳情頁
2. 進入「設定」tab
3. 修改：
   - 名稱
   - 指令
   - AI 模型
   - 執行輪數
   - 排程設置
   - 通知開關
4. 點擊「保存」（需要實現）

### 管理 Agent 記憶

1. 進入「記憶」tab
2. 編輯 Markdown 內容
3. 系統會自動保存（需要實現自動保存功能）

### 配置 Agent 技能

1. 進入「技能」tab
2. 勾選想要的工具：
   - ✅ 讀取資料夾
   - ✅ 新增筆記
   - ✅ 更新筆記
   - ✅ 新增圖表
   - ✅ 網路搜尋
   - ✅ 抓取台股資料
3. 保存設定

### 設置預算限制

1. 進入「預算」tab
2. 在「月預算」欄位輸入額度（如 1000 credits）
3. 點擊「更新預算」
4. 系統會追蹤每次執行的消耗

---

## 📱 API 調用示例

### 在組件中使用 API

```typescript
import { agentApi } from '@/api';

// 獲取所有 Agents
const agents = await agentApi.listAgents(folderId);

// 建立新 Agent
const newAgent = await agentApi.createAgent({
  folder_id: folderId,
  name: '新員工',
  instructions: '工作指令...',
  ai_model: 'claude-sonnet-4-6',
  max_rounds: 50,
  notifications_enabled: true,
  avatar_icon: '🤖',
});

// 更新 Agent
await agentApi.updateAgent(agentId, {
  name: '更新名稱',
  instructions: '新指令',
});

// 獲取執行統計
const stats = await agentApi.getExecutionStats(agentId);
console.log(stats);
// {
//   totalExecutions: 5,
//   successCount: 4,
//   failureCount: 1,
//   avgDuration: 180,
//   totalTokens: 25000,
//   totalCredits: 25
// }

// 獲取執行日誌
const logs = await agentApi.listExecutionLogs(agentId, 20);

// 管理記憶
const memory = await agentApi.getMemory(agentId);
await agentApi.updateMemory(agentId, '新的記憶內容...');
```

### 執行 Agent

```typescript
import { executeAgent } from '@/api/agentExecutor';

const result = await executeAgent(agentId, 'manual');
if (result.success) {
  console.log('執行成功，Log ID:', result.logId);
} else {
  console.error('執行失敗:', result.error);
}
```

### 使用 Claude API 工具

```typescript
import { executeAgentWithClaude } from '@/api/claudeIntegration';

const result = await executeAgentWithClaude({
  agentId: '...',
  agentName: '消息監控員',
  instructions: '監控台股消息...',
  memory: '# 長期記憶\n...',
  folderId: '...',
  maxRounds: 50,
});

console.log('執行結果:', result);
// {
//   success: true,
//   messages: [...],
//   totalTokens: 5234
// }
```

---

## 🛠️ 常見問題

### Q1：如何連接真實的 Claude API？

目前 `claudeIntegration.ts` 使用的是模擬 API。要連接真實 Claude：

```typescript
// src/api/claudeIntegration.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 已經在代碼中實現了，只需確保 .env.local 有 ANTHROPIC_API_KEY
```

### Q2：如何實現自動保存？

在任何輸入框中添加 `onChange` 和 `debounce`：

```typescript
import { useMemo } from 'react';

const AgentSettings = ({ agentId }) => {
  const [name, setName] = useState('');

  const debouncedSave = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await agentApi.updateAgent(agentId, { name: value });
      }, 1000);
    };
  }, [agentId]);

  return (
    <input
      value={name}
      onChange={(e) => {
        setName(e.target.value);
        debouncedSave(e.target.value);
      }}
    />
  );
};
```

### Q3：如何測試工具系統？

在 DevTools Console 執行：

```typescript
import { executeTool } from '@/api/agentExecutor';

const result = await executeTool(
  'create_note',
  {
    folder_id: 'your-folder-id',
    title: '測試筆記',
    content: '# 測試\n這是一則測試筆記。',
    agent_id: 'your-agent-id',
  },
  'your-folder-id'
);

console.log(result);
```

### Q4：如何在 Vercel 部署？

```bash
# 1. 推送代碼到 GitHub
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

---

## 📊 測試檢查清單

- [ ] Supabase 數據庫已初始化（9 個表）
- [ ] `.env.local` 配置正確
- [ ] `npm install` 完成
- [ ] `npm run dev` 成功啟動
- [ ] 瀏覽器可以訪問 http://localhost:5173
- [ ] 能建立新 Folder
- [ ] 能建立新 Agent
- [ ] 能打開 Agent 詳情頁
- [ ] 5 個 tabs 都能切換
- [ ] 可以編輯 Agent 名稱和指令
- [ ] 執行紀錄表顯示正確

---

## 🎯 下一步開發

### 需要實現的功能：

1. **React Router 路由**
   ```bash
   npm install react-router-dom
   ```
   - `/` → FolderListPage
   - `/folder/:folderId` → Agent 列表
   - `/agent/:agentId` → Agent 詳情

2. **狀態管理（Zustand）**
   ```bash
   npm install zustand
   ```
   - 全局 Agent 狀態
   - 用戶認證狀態
   - 執行日誌訂閱

3. **即時更新（Supabase 訂閱）**
   ```typescript
   supabase
     .from('execution_logs')
     .on('INSERT', (payload) => {
       setExecutionLogs(prev => [payload.new, ...prev]);
     })
     .subscribe();
   ```

4. **定期排程（Vercel Cron）**
   ```bash
   # api/cron/execute-agents.ts
   export default function handler(req: NextApiRequest, res: NextApiResponse) {
     // 每天 8:30 AM 執行所有 cron-enabled agents
   }
   ```

5. **LINE Bot 集成**
   ```bash
   npm install @line/bot-sdk
   ```
   - 透過 LINE 觸發 Agent 執行

---

## 📞 調試技巧

### 在 Browser DevTools 檢查

```javascript
// 檢查 Supabase 連接
import { supabase } from '@/utils/supabaseClient';
const user = await supabase.auth.getUser();
console.log('Current User:', user);

// 檢查 API 響應
import { agentApi } from '@/api';
const agents = await agentApi.listAgents('folder-id');
console.log('Agents:', agents);

// 檢查 Claude API
import { getClaudeClient } from '@/api/claudeTools';
const client = getClaudeClient();
console.log('Claude Client:', client);
```

### 查看網絡請求

1. 打開 DevTools → Network
2. 篩選 `fetch/xhr`
3. 監看 Supabase API 調用

### 檢查錯誤日誌

```javascript
// 在 Console 中
localStorage.setItem('debug', 'app:*');
```

---

## 🎓 學習資源

- **React 文檔**：https://react.dev
- **TypeScript 手冊**：https://www.typescriptlang.org/docs
- **Tailwind CSS**：https://tailwindcss.com/docs
- **Supabase 文檔**：https://supabase.com/docs
- **Claude API**：https://docs.anthropic.com
- **Recharts**：https://recharts.org

---

## 💡 提示

> **使用 VS Code 擴展提升開發效率：**
> - ES7+ React/Redux/React-Native snippets
> - Tailwind CSS IntelliSense
> - Prettier - Code formatter
> - ESLint
> - Thunder Client（REST API 測試）

---

祝你開發愉快！🚀 有問題隨時提問！

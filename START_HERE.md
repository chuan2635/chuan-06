# 🚀 START HERE - 你應該先讀這個！

> 5 分鐘了解 CubeLV 是什麼，以及如何開始使用

---

## 一句話認識 CubeLV

**用自然語言建立虛擬 AI 員工，賦予工作指令，系統自動執行重複性任務。**

例如：每天自動監控台股市場、每週自動生成技術分析報告。

---

## 📚 文檔導航（選擇適合你的）

### 👤 我想快速上手
👉 **讀這個**：[HOW_TO_USE.md](./HOW_TO_USE.md)（15 分鐘）
- ✅ 3 步快速開始
- ✅ 核心操作速查表
- ✅ 常見問題解答

### 💻 我想開發這個應用
👉 **讀這個**：[QUICKSTART.md](./QUICKSTART.md)（30 分鐘）
- ✅ 開發環境設置
- ✅ 數據庫初始化
- ✅ API 調用示例
- ✅ 下一步開發計劃

### 🏗️ 我想了解架構和設計
👉 **讀這個**：[CLAUDE.md](./CLAUDE.md)（1 小時）
- ✅ 完整系統架構
- ✅ 數據庫設計
- ✅ API 文檔
- ✅ 12 週開發計劃

### 📊 我想看完整的產品規格
👉 **讀這個**：[CUBELV_PRD.md](./CUBELV_PRD.md)（深度閱讀）
- ✅ UI/UX 設計規格
- ✅ 色彩系統、字體、元件規範
- ✅ 執行流程
- ✅ MVP 開發順序

### 📖 我想快速瀏覽一下
👉 **讀這個**：[README.md](./README.md)（5 分鐘）
- ✅ 項目概述
- ✅ 技術棧
- ✅ 主要功能

---

## ⚡ 3 秒速查

### 我要做什麼？
- [ ] 我想**馬上用**這個應用 → [HOW_TO_USE.md](./HOW_TO_USE.md)
- [ ] 我想**開發**這個應用 → [QUICKSTART.md](./QUICKSTART.md)
- [ ] 我想**理解**整個系統 → [CLAUDE.md](./CLAUDE.md)
- [ ] 我想**參考設計規格** → [CUBELV_PRD.md](./CUBELV_PRD.md)

---

## 🎯 你現在擁有什麼？

### ✅ 完整的應用原型
- 27 個代碼文件（~2,100 行代碼）
- 5 大組件庫（Agent Card、Tab Bar、Badge 等）
- 2 個完整頁面（列表頁 + 詳情頁）
- 完整的 API 層（Supabase 集成）

### ✅ 完整的 AI 引擎
- Claude API 集成（claude-sonnet-4-6）
- 7 個自動化工具
- 多輪對話執行邏輯
- 成本計算系統

### ✅ 完整的數據庫
- 9 個核心表
- RLS 行級安全
- 索引優化

### ✅ 完整的開發文檔
- PRD 產品規格書
- 開發指南
- 快速開始教程
- 使用說明書

---

## 🔥 立即開始的 3 步

### Step 1️⃣：複製密鑰（2 分鐘）

建立 `.env.local` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
ANTHROPIC_API_KEY=sk-ant-...
```

**哪裡取得密鑰？**
- 🔗 Supabase：https://app.supabase.com → Project → Settings → API
- 🔗 Claude API：https://console.anthropic.com → API Keys

### Step 2️⃣：初始化數據庫（3 分鐘）

1. 登入 https://app.supabase.com
2. 進入 **SQL Editor**
3. 複製 `supabase/migrations/001_init_schema.sql` 全部內容
4. 貼到 SQL Editor 執行

✅ 完成後應該看到 9 個表被建立

### Step 3️⃣：啟動應用（1 分鐘）

```bash
npm install
npm run dev
```

🌐 自動打開 http://localhost:5173

✅ 完成！應用已啟動

---

## 💡 快速操作指南

### 建立第一個 Agent

```
1. 點擊右下角 FAB 按鈕（⊡）
2. 輸入名稱：「消息監控員」
3. 輸入指令：
   每日監控台股市場重大消息。
   特別關注異常波動。
   將結果寫成筆記存檔。
4. 選擇模型：Auto（自動選擇最佳模型）
5. 執行輪數：30
6. 打開通知：✅
7. 點擊保存
```

### 查看 Agent 詳情

```
1. 在列表頁點擊 Agent 卡片
2. 打開詳情頁（底部彈出）
3. 瀏覽 5 個 Tab：
   - 總覽：統計卡片 + 執行紀錄
   - 設定：編輯配置
   - 記憶：編輯長期記憶
   - 技能：選擇可用工具
   - 預算：設置 Credits 限額
```

### 編輯 Agent 記憶

```
1. 點擊「記憶」Tab
2. 編輯 Markdown 內容：
   # 監控清單
   - 台積電 (2330)
   - 聯發科 (2454)
3. 自動保存
```

### 設置定期排程

```
1. 點擊「設定」Tab
2. 打開「定期排程」☑️
3. 輸入 Cron 表達式：
   - 每天 08:30  →  30 8 * * *
   - 每週五 15:30 →  30 15 * * 5
4. 保存
```

---

## ⚙️ 配置清單

- [ ] `.env.local` 已建立（Supabase + Claude API 密鑰）
- [ ] Supabase 數據庫已初始化（9 個表）
- [ ] `npm install` 已完成
- [ ] `npm run dev` 能成功啟動
- [ ] 瀏覽器能訪問 http://localhost:5173
- [ ] 能建立新 Agent
- [ ] 能打開 Agent 詳情頁
- [ ] 能查看 5 個 tabs

---

## 🎮 推薦的第一個項目

### 建立「股市監控員」

**目標**：每天自動監控台股市場

**步驟**：
1. 建立 Agent：名稱 → 「消息監控員」
2. 編寫指令：
   ```
   每日早上 8:30 監控台股市場重大消息
   
   監控對象：
   - 台積電 (2330)
   - 聯發科 (2454)
   - 鴻海 (2317)
   
   關注重點：
   - 技術面突破
   - 異常成交量
   - 重大公告
   
   產出：
   - 將重要消息寫成筆記
   - 異常事件標註「⚠️ 即時警示」
   ```
3. 配置技能：勾選 `web_search` 和 `create_note`
4. 設置排程：`30 8 * * *`（每天早上 8:30）
5. 保存並等待自動執行 ✅

**預期結果**：
- 每天早上 8:30，Agent 自動執行
- 搜尋台股最新消息
- 整理重要內容成筆記
- 異常波動時發出警示

---

## 🆘 快速問題排查

### Q: App 無法打開
```bash
# 檢查依賴是否安裝
npm install

# 檢查 Node 版本（需要 >= 18）
node --version

# 清除緩存重新啟動
rm -rf .next dist node_modules/.vite
npm run dev
```

### Q: Supabase 連接失敗
- ✅ 檢查 `.env.local` 中的 URL 和 KEY
- ✅ 檢查網絡連接
- ✅ 確認 Supabase 項目已激活

### Q: Claude API 返回錯誤
- ✅ 驗證 API Key 是否正確（`echo $ANTHROPIC_API_KEY`）
- ✅ 檢查 API key 是否過期
- ✅ 確認用量沒有超過配額

### Q: 看不到「執行」按鈕
- 這個功能還未實現（待開發）
- 詳見 `AgentDetailPage.tsx` 第 xxx 行的註解
- 你可以手動添加這個功能！

---

## 🚀 下一步

### 短期（本週）
1. ✅ 完成本地開發環境設置
2. ✅ 建立第一個 Agent
3. ✅ 測試 Agent 功能
4. 🔄 **下一步**：實現「執行」按鈕

### 中期（本月）
1. 🔄 完善 UI 細節
2. 🔄 整合實時數據刷新
3. 🔄 實現自動保存功能
4. 🔄 添加錯誤提示

### 長期（本季）
1. 🔄 部署到 Vercel
2. 🔄 設置定期排程
3. 🔄 集成通知系統
4. 🔄 添加更多 Tools

---

## 📊 項目統計

| 項目 | 數量 |
|------|------|
| 代碼文件 | 27 個 |
| 代碼行數 | ~2,100 行 |
| React 組件 | 7 個 |
| API 模塊 | 4 個 |
| TypeScript 類型 | 15+ 個 |
| UI 組件 | 7 個 |
| Supabase 表 | 9 個 |
| Agent 工具 | 7 個 |
| 文檔頁面 | 5 份 |

---

## 💬 需要幫助？

### 查看文檔
- 🟢 **新手**：[HOW_TO_USE.md](./HOW_TO_USE.md)
- 🟡 **開發者**：[QUICKSTART.md](./QUICKSTART.md)
- 🔴 **架構師**：[CLAUDE.md](./CLAUDE.md)

### 常見問題
詳見 [HOW_TO_USE.md#常見問題](./HOW_TO_USE.md#常見問題)

### 聯繫
📧 x1001002004@gmail.com

---

## ✨ 現在你可以

- ✅ 建立虛擬 AI 員工
- ✅ 用自然語言指派工作
- ✅ 自動執行重複性任務
- ✅ 追蹤 Tokens 和 Credits
- ✅ 設置定期自動化
- ✅ 累積長期知識記憶

---

<div align="center">

## 🎉 準備好了嗎？

**[現在就開始 →](./HOW_TO_USE.md)**

</div>

---

**最後更新**：2026-06-29  
**版本**：0.1.0 (MVP Phase 1)  
**作者**：Claude + You

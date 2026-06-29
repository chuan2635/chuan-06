# 🚀 部署到 Vercel - 完整指南

> 5 分鐘將你的應用部署到雲端，全世界都能使用！

---

## 📋 先決條件（檢查清單）

在開始前，請確認你有：

- [ ] GitHub 帳號（免費註冊：https://github.com）
- [ ] Vercel 帳號（免費註冊：https://vercel.com）
- [ ] Supabase 項目已設置
- [ ] Claude API Key 已取得
- [ ] 代碼已推送到 GitHub

---

## 🎯 部署的 5 大步驟

```
Step 1: 推送代碼到 GitHub
   ↓
Step 2: 連接 Vercel
   ↓
Step 3: 配置環境變數
   ↓
Step 4: 部署
   ↓
Step 5: 驗證 + 分享
```

---

## 📍 Step 1️⃣：推送代碼到 GitHub（5 分鐘）

### 1.1 建立 GitHub Repository

1. 訪問：https://github.com/new
2. **Repository name**：輸入 `cubelv-app`
3. **Description**：輸入 `CubeLV - AI Employee Management System`
4. **Public**：選擇公開（免費部署需要）
5. **Initialize this repository**：✅ Add a README file
6. 點擊 **Create repository**

### 1.2 推送你的代碼

在終端機執行：

```bash
# 進入項目目錄
cd chuan-06

# 初始化 git（如果還沒有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial CubeLV commit"

# 添加遠程倉庫（替換 YOUR_GITHUB_USERNAME）
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/cubelv-app.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

✅ **完成！代碼已推送到 GitHub**

> 驗證：訪問 https://github.com/YOUR_GITHUB_USERNAME/cubelv-app
> 應該能看到你的項目文件

---

## 🔗 Step 2️⃣：連接 Vercel（3 分鐘）

### 2.1 登入 Vercel

1. 訪問：https://vercel.com
2. 點擊 **Sign Up**
3. 選擇 **Continue with GitHub**
4. 授權 Vercel 訪問你的 GitHub

### 2.2 導入項目

1. 進入 Vercel Dashboard
2. 點擊 **+ Add New...**
3. 選擇 **Project**
4. 點擊 **Import Git Repository**
5. 在搜尋框輸入 `cubelv-app`
6. 選擇你的項目
7. 點擊 **Import**

### 2.3 配置項目設置

在 **Import Project** 頁面：

**Project Name**：保持 `cubelv-app`

**Framework Preset**：選擇 `Vite`

**Build Command**：已自動填入 `npm run build`

**Output Directory**：已自動填入 `dist`

**Install Command**：已自動填入 `npm install`

✅ 檢查無誤後，點擊 **Continue**

---

## 🔐 Step 3️⃣：配置環境變數（2 分鐘）

### 3.1 添加環境變數

在 **Environment Variables** 區域，添加 3 個變數：

#### 變數 1️⃣：Supabase URL

- **Name**：`VITE_SUPABASE_URL`
- **Value**：粘貼你的 Supabase URL
  ```
  https://your-project.supabase.co
  ```
- 點擊 **Add**

#### 變數 2️⃣：Supabase Anon Key

- **Name**：`VITE_SUPABASE_ANON_KEY`
- **Value**：粘貼你的 Supabase Anon Key
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- 點擊 **Add**

#### 變數 3️⃣：Claude API Key

- **Name**：`ANTHROPIC_API_KEY`
- **Value**：粘貼你的 Claude API Key
  ```
  sk-ant-...
  ```
- 點擊 **Add**

### 3.2 取得你的密鑰

**🔗 Supabase 密鑰**：
1. 登入：https://app.supabase.com
2. 選擇你的項目
3. 進入 **Settings** → **API**
4. 複製：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

**🔗 Claude API Key**：
1. 登入：https://console.anthropic.com
2. 進入 **API Keys**
3. 複製你的 API Key → `ANTHROPIC_API_KEY`

✅ **環境變數已配置**

---

## 🚀 Step 4️⃣：部署（1 分鐘）

在 Vercel 頁面點擊：

```
[ Deploy ]
```

等待部署完成（通常 1-3 分鐘）

你會看到：

```
✓ Deployment successful

Your site is live at:
https://cubelv-app.vercel.app
```

🎉 **應用已上線！**

---

## ✅ Step 5️⃣：驗證 + 分享

### 5.1 驗證應用

1. 點擊 Vercel 提供的連結：`https://cubelv-app.vercel.app`
2. 應用應該成功打開
3. 試試建立一個 AI 員工
4. 檢查功能是否正常

### 5.2 分享連結

你現在可以分享這個連結給任何人：

```
https://cubelv-app.vercel.app
```

他們不需要安裝任何東西，直接在瀏覽器打開就能用！

---

## 🔄 更新應用（有新代碼時）

### 方式 1️⃣：自動部署（推薦）

1. 在本地修改代碼
2. 執行：
   ```bash
   git add .
   git commit -m "更新描述"
   git push origin main
   ```
3. Vercel 自動檢測到新推送
4. 自動重新部署
5. 幾分鐘後應用更新完成 ✅

### 方式 2️⃣：手動部署

1. 進入 Vercel Dashboard
2. 選擇你的項目
3. 點擊 **Redeploy**
4. 等待部署完成

---

## 🐛 常見問題 & 解決方案

### Q1: 部署失敗，顯示「Build Failed」

**症狀**：
```
Build failed: npm ERR!
```

**解決**：
1. 檢查 `package.json` 是否正確
2. 檢查環境變數是否完整（3 個都要有）
3. 檢查代碼是否有語法錯誤
4. 嘗試手動運行：`npm run build`

### Q2: 應用打開但看不到數據

**症狀**：
- 頁面打開但空白
- 控制台有紅色錯誤

**可能原因**：
- [ ] 環境變數配置錯誤
- [ ] Supabase 連接失敗
- [ ] API Key 無效

**檢查方法**：
1. 按 F12 打開開發者工具
2. 進入 **Console** Tab
3. 查看紅色錯誤信息
4. 根據錯誤信息調整環境變數

### Q3: 應用很慢或超時

**可能原因**：
- Supabase 連接慢
- Claude API 響應慢
- 數據庫查詢多

**解決**：
- 檢查網絡連接
- 確認 Supabase 項目狀態
- 減少初始數據加載量

### Q4: 要更換域名

**解決**：
1. 在 Vercel 進入項目設置
2. 進入 **Domains**
3. 添加自定義域名
4. 按照說明配置 DNS

### Q5: 如何隱藏 API Key（安全問題）

⚠️ **重要**：API Key 不應該在客戶端代碼中暴露！

**更安全的方式**：
1. 創建後端 API 路由
2. 在後端存儲 API Key
3. 前端只呼叫後端 API
4. 後端再呼叫 Claude / Supabase

由於時間限制，這個版本使用的是簡單配置。生產環境建議升級！

---

## 📊 部署後的監控

### 查看部署狀態

1. 進入 Vercel Dashboard
2. 選擇你的項目
3. 進入 **Deployments**
4. 查看最新的部署狀態

### 查看日誌

1. 點擊最新的 **Deployment**
2. 進入 **Logs**
3. 查看實時日誌（對調試很有幫助）

### 查看分析

1. 進入 **Analytics**
2. 查看：
   - 訪問次數
   - 性能指標
   - 錯誤日誌

---

## 🎯 部署後要做的事

### 1️⃣ 配置自定義域名（可選）

如果你有自己的域名（如 `cubelv.com`）：

1. 在 Vercel 進入 **Settings** → **Domains**
2. 添加你的域名
3. 按照說明配置 DNS（在域名商那邊）
4. 等待生效（通常 1-24 小時）

### 2️⃣ 設置 HTTPS 證書（自動）

Vercel 自動為你的應用配置 SSL 證書 ✅

### 3️⃣ 配置 Cron 定期排程（進階）

在 `vercel.json` 中配置：

```json
{
  "crons": [{
    "path": "/api/cron/execute-agents",
    "schedule": "0 8 * * *"
  }]
}
```

這樣每天早上 8 點會自動執行排程的 Agents。

### 4️⃣ 配置 GitHub Actions（CI/CD）（進階）

自動測試和部署。但對於初期開發可以跳過。

---

## 📈 性能優化建議

### 1. 啟用 Vercel Analytics
```
Vercel Dashboard → Settings → Analytics → Enable
```

### 2. 配置 Caching
在 `vercel.json`：
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

### 3. 優化初始加載
- 分割代碼（Code Splitting）
- 圖片優化
- 縮小 JavaScript 大小

> 這些是進階優化，初期可以不考慮

---

## 🔐 安全性檢查清單

- [ ] API Key 已安全存儲（環境變數）
- [ ] 代碼中沒有硬編碼密鑰
- [ ] `.env.local` 已加入 `.gitignore`
- [ ] GitHub Repository 設置為私有（可選）
- [ ] Supabase RLS 策略已啟用
- [ ] 定期更新依賴包

---

## 💬 常見部署錯誤速查

| 錯誤信息 | 原因 | 解決方案 |
|---------|------|--------|
| `Build failed` | 代碼有語法錯誤 | 檢查 npm run build 是否成功 |
| `Cannot find module` | 依賴未安裝 | 檢查 package.json |
| `Cannot read property` | 環境變數缺失 | 確認 3 個環境變數都已添加 |
| `CORS error` | 跨域問題 | 檢查 Supabase CORS 設置 |
| `Timeout` | 請求超時 | 檢查 API 響應速度 |

---

## 🎓 下次部署

每次你修改代碼後，只需要：

```bash
# 1. 提交代碼
git add .
git commit -m "修改描述"

# 2. 推送到 GitHub
git push origin main

# 3. 坐等 Vercel 自動部署
# 通常 1-3 分鐘完成
```

Vercel 會自動檢測到 push 並重新部署！

---

## ✨ 你現在擁有

✅ 部署在雲端的 React 應用  
✅ 自動化 CI/CD（push 自動部署）  
✅ 全球 CDN 加速  
✅ SSL 加密  
✅ 監控和分析  
✅ 可分享的公開連結  

---

<div align="center">

## 🎉 部署完成！

### 你的應用現在在雲端運行！

```
https://cubelv-app.vercel.app
```

### 分享給朋友使用吧！ 🚀

</div>

---

## 📞 需要幫助？

### 部署卡住？
1. 查看 Vercel 的 **Deployment Logs**
2. 檢查環境變數配置
3. 確認 GitHub 推送成功

### 應用有 Bug？
1. 按 F12 查看控制台錯誤
2. 檢查 Supabase 連接
3. 本地 `npm run dev` 測試

### 想進階配置？
- 自定義域名
- Cron 定期任務
- 環境隔離（開發/生產）

---

**祝部署順利！** 🎊

有問題隨時問！

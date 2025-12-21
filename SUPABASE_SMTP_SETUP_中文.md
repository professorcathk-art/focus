# Supabase SMTP 設定指南（中文版）

## 為什麼需要設定 SMTP？

Supabase 預設的郵件服務有：
- 發送數量限制（無法發送大量郵件）
- 可能不夠穩定
- 無法自訂

設定自訂 SMTP 可以獲得：
- ✅ 無限制發送郵件
- ✅ 更好的送達率
- ✅ 自訂郵件範本
- ✅ 專業的寄件者地址

---

## Gmail SMTP 設定步驟（免費、簡單）

### 步驟 1：啟用 Gmail 兩步驟驗證

1. **打開瀏覽器，登入你的 Gmail 帳號**
   - 網址：https://mail.google.com
   - 使用你的 Gmail 帳號登入（例如：yourname@gmail.com）

2. **前往 Google 帳戶設定**
   - 點擊右上角**你的頭像**
   - 點擊「**管理你的 Google 帳戶**」或「**Manage your Google Account**」

3. **進入安全性設定**
   - 點擊左側選單的「**安全性**」或「**Security**」
   - 如果介面是英文，點擊「Security」

4. **啟用兩步驟驗證**
   - 找到「**兩步驟驗證**」或「**2-Step Verification**」
   - 點擊進入
   - 如果還沒啟用，點擊「**開始使用**」或「**Get Started**」
   - 按照指示完成設定（通常需要手機號碼）

---

### 步驟 2：產生應用程式密碼

1. **回到 Google 帳戶的安全性頁面**
   - 網址：https://myaccount.google.com/security
   - 確認你已經啟用兩步驟驗證

2. **找到「應用程式密碼」**
   - 在「安全性」頁面中，找到「**應用程式密碼**」或「**App passwords**」
   - 如果找不到，直接訪問：https://myaccount.google.com/apppasswords

3. **建立新的應用程式密碼**
   - 點擊「**選擇應用程式**」或「**Select app**」
   - 選擇「**郵件**」或「**Mail**」
   - 點擊「**選擇裝置**」或「**Select device**」
   - 選擇「**其他（自訂名稱）**」或「**Other (Custom name)**」
   - 輸入名稱：`Supabase`
   - 點擊「**產生**」或「**Generate**」

4. **複製密碼**
   - 會顯示一個 **16 個字元的密碼**（例如：`abcd efgh ijkl mnop`）
   - **重要：立即複製這個密碼**，關閉視窗後就看不到了
   - 如果忘記了，需要重新產生一個

---

### 步驟 3：在 Supabase 設定 SMTP

1. **登入 Supabase Dashboard**
   - 網址：https://app.supabase.com
   - 選擇你的專案（Focus Circle）

2. **前往專案設定**
   - 點擊左側選單的「**設定**」或「**Settings**」
   - 點擊「**專案設定**」或「**Project Settings**」

3. **找到 Auth 設定**
   - 點擊「**Auth**」標籤
   - 向下滾動找到「**SMTP Settings**」或「**SMTP 設定**」

4. **啟用自訂 SMTP**
   - 找到「**Enable Custom SMTP**」或「**啟用自訂 SMTP**」
   - **開啟開關**

5. **填入 Gmail SMTP 資訊**
   ```
   Host（主機）: smtp.gmail.com
   Port（埠號）: 587
   Username（使用者名稱）: 你的完整 Gmail 地址（例如：yourname@gmail.com）
   Password（密碼）: 貼上剛才複製的 16 字元應用程式密碼
   Sender email（寄件者郵件）: 你的完整 Gmail 地址（例如：yourname@gmail.com）
   Sender name（寄件者名稱）: Focus Circle
   ```

6. **儲存設定**
   - 點擊「**儲存**」或「**Save**」
   - 等待 Supabase 測試連線

---

### 步驟 4：測試郵件發送

1. **前往郵件範本頁面**
   - 在 Supabase Dashboard 左側選單
   - 點擊「**Authentication**」或「**驗證**」
   - 點擊「**Email Templates**」或「**郵件範本**」

2. **發送測試郵件**
   - 找到「**Send test email**」或「**發送測試郵件**」按鈕
   - 輸入你的 Gmail 地址
   - 點擊「**Send**」或「**發送**」

3. **檢查收件匣**
   - 打開你的 Gmail
   - 檢查收件匣（如果沒看到，檢查垃圾郵件資料夾）
   - 應該會收到一封測試郵件

---

## 驗證郵件範本設定

設定 SMTP 後，確認郵件範本已啟用：

1. **前往郵件範本**
   - Supabase Dashboard → Authentication → Email Templates

2. **確認這些範本已啟用**：
   - ✅ **Confirm signup**（確認註冊）- 用於郵件驗證
   - ✅ **Magic Link**（魔法連結）- 如果用密碼登入
   - ✅ **Change Email Address**（變更郵件地址）
   - ✅ **Reset Password**（重設密碼）

3. **檢查確認註冊範本**
   - 點擊「**Confirm signup**」
   - 確認範本中有 `{{ .ConfirmationURL }}` 變數
   - 這是確認連結的變數，必須存在

---

## 測試完整的註冊流程

1. **在 App 中註冊**
   - 使用一個測試郵件地址註冊
   - 應該會看到「請檢查你的郵件」訊息

2. **檢查郵件**
   - 打開 Gmail 收件匣
   - 找到來自「Focus Circle」的確認郵件
   - 如果沒看到，檢查垃圾郵件資料夾

3. **點擊確認連結**
   - 郵件中應該有一個確認連結
   - 點擊連結應該會打開 App
   - App 應該會自動登入

---

## 常見問題排除

### 郵件沒有發送

1. **檢查 SMTP 設定**
   - 確認主機是 `smtp.gmail.com`
   - 確認埠號是 `587`
   - 確認使用者名稱是你的完整 Gmail 地址
   - **重要：密碼必須是應用程式密碼，不是你的 Gmail 密碼**

2. **檢查應用程式密碼**
   - 如果使用一般 Gmail 密碼會失敗
   - 必須使用步驟 2 產生的 16 字元應用程式密碼
   - 如果忘記，重新產生一個新的

3. **檢查兩步驟驗證**
   - 必須先啟用兩步驟驗證才能產生應用程式密碼
   - 如果沒啟用，回到步驟 1

4. **檢查郵件範本**
   - 確認「Confirm signup」範本已啟用
   - 確認範本中有 `{{ .ConfirmationURL }}` 變數

5. **檢查 Supabase Auth 設定**
   - 前往 Authentication → Settings
   - 確認「**Enable email confirmations**」已開啟
   - 確認「**Confirm email**」已啟用

6. **檢查垃圾郵件資料夾**
   - Gmail 可能會將第一次收到的郵件標記為垃圾郵件
   - 將寄件者加入聯絡人可避免此問題

### Gmail 特定問題

- **「安全性較低的應用程式」錯誤**
  - 解決方法：使用應用程式密碼（不是一般密碼）
  - 應用程式密碼是 16 個字元，格式如：`abcd efgh ijkl mnop`

- **發送數量限制**
  - Gmail 免費帳號每天約可發送 500 封郵件
  - 如果超過，需要等待 24 小時或升級到 Google Workspace

- **郵件進入垃圾郵件**
  - 第一次發送可能會進入垃圾郵件
  - 將寄件者加入聯絡人可改善
  - 使用自訂網域（如 SendGrid）可大幅改善

---

## 重要提醒

1. **應用程式密碼 vs 一般密碼**
   - ❌ **不要使用**你的 Gmail 登入密碼
   - ✅ **必須使用**應用程式密碼（16 字元）

2. **應用程式密碼格式**
   - 格式：`abcd efgh ijkl mnop`（有空格）
   - 或：`abcdefghijklmnop`（無空格）
   - 兩種格式都可以，Supabase 會自動處理

3. **如果忘記應用程式密碼**
   - 無法找回，必須重新產生
   - 前往 https://myaccount.google.com/apppasswords
   - 產生新的應用程式密碼
   - 更新 Supabase 中的密碼欄位

4. **安全性**
   - 應用程式密碼只能存取郵件功能
   - 即使洩露，也無法登入你的 Gmail 帳號
   - 但還是要妥善保管

---

## 下一步

1. ✅ 完成 Gmail SMTP 設定（按照上述步驟）
2. ✅ 發送測試郵件確認設定正確
3. ✅ 檢查郵件範本設定
4. ✅ 在 App 中測試註冊流程
5. ✅ 確認收到確認郵件並成功驗證

設定完成後，郵件確認功能就會自動運作！

---

## 如果 Gmail 設定有困難

如果 Gmail 設定太複雜，可以考慮：

1. **SendGrid**（推薦用於正式環境）
   - 免費方案：每天 100 封郵件
   - 更好的送達率
   - 設定相對簡單

2. **Resend**（開發者友善）
   - 免費方案：每月 3,000 封郵件
   - 現代化的介面
   - 設定簡單

需要這些選項的詳細中文教學嗎？


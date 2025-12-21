# Supabase SMTP 設定 - Google Workspace（自訂網域）

## 你的設定資訊

✅ **你已經完成的部分：**
- ✅ 已啟用兩步驟驗證
- ✅ 已產生應用程式密碼：`tzrp kozu jqmh knit`
- ✅ 使用 Google Workspace（自訂網域：professor-cat.com）

---

## Supabase SMTP 設定

### 在 Supabase Dashboard 填入以下資訊：

1. **前往 Supabase Dashboard**
   - 網址：https://app.supabase.com
   - 選擇你的專案（Focus Circle）
   - 點擊左側選單「**Settings**」→「**Project Settings**」
   - 點擊「**Auth**」標籤
   - 向下滾動找到「**SMTP Settings**」

2. **啟用自訂 SMTP**
   - 開啟「**Enable Custom SMTP**」開關

3. **填入以下資訊：**

```
Host（主機）: smtp.gmail.com
Port（埠號）: 587
Username（使用者名稱）: chris.lau@professor-cat.com
Password（密碼）: tzrp kozu jqmh knit
Sender email（寄件者郵件）: chris.lau@professor-cat.com
Sender name（寄件者名稱）: Focus Circle
```

**重要提醒：**
- ✅ Host 和 Port 與一般 Gmail 相同（`smtp.gmail.com` 和 `587`）
- ✅ Username 使用你的完整郵件地址（`chris.lau@professor-cat.com`）
- ✅ Password 使用你剛才產生的應用程式密碼（`tzrp kozu jqmh knit`）
- ✅ Sender email 也使用你的完整郵件地址

---

## Google Workspace vs 一般 Gmail 的差異

| 項目 | 一般 Gmail | Google Workspace（你的情況） |
|------|-----------|---------------------------|
| Host | smtp.gmail.com | smtp.gmail.com ✅ **相同** |
| Port | 587 | 587 ✅ **相同** |
| Username | yourname@gmail.com | chris.lau@professor-cat.com |
| Password | 應用程式密碼 | 應用程式密碼 ✅ **相同** |
| Sender email | yourname@gmail.com | chris.lau@professor-cat.com |

**結論：只有郵件地址不同，其他設定完全相同！**

---

## 測試郵件發送

1. **儲存設定**
   - 點擊「**Save**」或「**儲存**」
   - Supabase 會自動測試連線

2. **發送測試郵件**
   - 前往「**Authentication**」→「**Email Templates**」
   - 點擊「**Send test email**」
   - 輸入：`chris.lau@professor-cat.com`
   - 點擊「**Send**」

3. **檢查郵件**
   - 打開你的郵件收件匣（chris.lau@professor-cat.com）
   - 應該會收到測試郵件
   - 如果沒看到，檢查垃圾郵件資料夾

---

## Google Workspace 的優勢

使用 Google Workspace（自訂網域）的好處：

✅ **專業的寄件者地址**
   - 使用 `chris.lau@professor-cat.com` 而不是 `@gmail.com`
   - 看起來更專業、更可信

✅ **更高的發送限制**
   - Google Workspace 每天可發送 2,000 封郵件
   - 一般 Gmail 只有 500 封

✅ **更好的送達率**
   - 自訂網域通常有更好的郵件送達率
   - 較不容易被標記為垃圾郵件

✅ **企業級功能**
   - 可以設定郵件別名
   - 可以設定郵件轉寄規則
   - 更好的管理控制

---

## 常見問題

### Q: 應用程式密碼格式正確嗎？
A: 是的！`tzrp kozu jqmh knit` 是正確的格式（有空格）。Supabase 會自動處理空格，你也可以輸入 `tzrpkozujqmhknit`（無空格）。

### Q: 為什麼 Username 要用完整郵件地址？
A: Google Workspace 需要完整的郵件地址來識別帳號，不能只輸入 `chris.lau`。

### Q: 如果設定失敗怎麼辦？
A: 
1. 確認應用程式密碼正確（複製貼上，不要手動輸入）
2. 確認兩步驟驗證已啟用
3. 確認郵件地址完全正確（包含 `@professor-cat.com`）
4. 檢查 Supabase 的錯誤訊息

### Q: 可以同時使用多個寄件者地址嗎？
A: 可以！你可以設定：
- `chris.lau@professor-cat.com`（主要）
- `noreply@professor-cat.com`（系統郵件）
- `support@professor-cat.com`（客服郵件）

每個都需要在 Supabase 中分別設定，或使用不同的 SMTP 服務。

---

## 下一步

1. ✅ 在 Supabase 填入上述設定
2. ✅ 儲存並測試郵件發送
3. ✅ 確認收到測試郵件
4. ✅ 在 App 中測試註冊流程
5. ✅ 確認確認郵件正常發送

設定完成後，你的 App 就會使用 `chris.lau@professor-cat.com` 發送確認郵件了！

---

## 安全提醒

⚠️ **保護你的應用程式密碼**
- 不要分享給他人
- 不要提交到 Git 儲存庫
- 如果洩露，立即在 Google 帳戶中刪除並重新產生

✅ **應用程式密碼的安全性**
- 只能存取郵件功能
- 無法用來登入你的 Google 帳戶
- 可以隨時撤銷


# 📊 סטטוס המערכת - מה יש ומה חסר

**תאריך עדכון אחרון:** היום

---

## ✅ מה יש במערכת (מוכן ועובד)

### 🏗️ תשתית טכנית

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion** לאנימציות
- **react-hot-toast** להתראות UX
- **Supabase (PostgreSQL)** - בסיס נתונים מלא
- **JWT** לאימות + **Middleware** להגנה על routes
- **OpenAI API** (gpt-4o-mini) לצ'אט AI

---

### 👤 דשבורד עסק (`/dashboard`)

#### ✅ ניהול תפריט
- הוספה/עריכה/מחיקה של מנות
- קטגוריות, מחירים, תמונות, מרכיבים, אלרגנים
- ⭐ **מנות מומלצות** (checkbox) - מופיעות ב-carousel
- 🤰 **מתאים להריון** (checkbox) - תג מיוחד בתפריט
- כפתור ⭐ מהיר להפיכה למומלצת

#### ✅ ניהול שולחנות וקודי QR
- הוספה/מחיקה של שולחנות
- יצירה אוטומטית של QR codes
- הורדה והדפסה של QR codes
- **חסימת הוספת שולחנות** אם `tables.length >= tablesAllowed`

#### ✅ הגדרות עסק
- שם עסק, סוג עסק, תבנית עיצוב
- 🤖 **הוראות מותאמות ל-AI** - שדה טקסט ארוך
- **סטטוס מנוי** - תצוגת סטטוס, שולחנות בשימוש/מותר, תאריך חיוב
- **לוגו עסק** - אפשרות להעלות לוגו או להציג שם טקסט
- כפתור "שדרג / חדש מנוי" → מעבר ל-Stripe Checkout

#### ✅ הגדרות מדפסת / BON
- Enable/Disable מדפסת
- סוג חיבור: HTTP/HTTPS (TCP/Serial - חלקי)
- Endpoint, Port, Payload Type (JSON/Text/XML)
- Headers מותאמים אישית
- כפתור "בדוק מדפסת"

#### ✅ הזמנות ורווחים
- טבלת הזמנות עם כל הפרטים
- סיכומי רווחים (היום/שבוע/חודש)

---

### 🛒 תפריט לקוח (`/menu/[businessId]/[tableId]`)

#### ✅ תצוגה ראשית (עמוד הבית)
- **Hero Section** - Carousel "מבצעים ודילים מומלצים"
  - Auto-rotate כל 4 שניות
  - מנות עם `isFeatured = true`
  - תמונה גדולה, שם, מרכיבים, מחיר
  - כפתור "הוסף לעגלה"
- **קטגוריות:**
  - **מובייל:** Sticky בחלק העליון, גלילה אופקית עם אינדיקטור
  - **דסקטופ:** Sidebar מימין, sticky
  - כפתור "עמוד הבית" + כל הקטגוריות

#### ✅ תצוגת קטגוריה
- Carousel קומפקטי בראש (אם יש מנות מומלצות)
- רשימת מנות מסודרת
- תג "⭐ מומלץ" למנות מומלצות
- תג "🤰 מתאים להריון" למנות מתאימות

#### ✅ הרחבת מנות (In-place Expansion)
- **לחיצה על מנה:**
  - **מובייל:** תצוגה כמעט מלאה, optimized ליד אחת
  - **דסקטופ:** הרחבה במקום, בתוך הפריסה
- **תוכן מורחב:**
  - תמונה גדולה יותר
  - תיאור מלא (מרכיבים, אלרגנים)
  - תג "מתאים להריון" אם רלוונטי
  - כפתור "הוסף לעגלה" בולט
- **סגירה:**
  - כפתור X
  - לחיצה מחוץ לכרטיס (מובייל)
  - החלקה למטה (מובייל)
  - שמירת מיקום גלילה

#### ✅ עגלה (Cart)
- תחתית קבועה עם סיכום
- כפתור "סוגרים הזמנה עם העוזר החכם – שאלות, שינויים ומה שבא לכם →"
- **CartContext** - ניהול גלובלי של העגלה

#### ✅ Theme System - 9 תמות שונות
- **Bar:** `bar-modern`, `bar-classic`, `bar-mid`
- **Pizza:** `pizza-modern`, `pizza-classic`, `pizza-mid`
- **Sushi:** `sushi`
- **Generic:** `generic`
- **Gold:** `gold` (קלאסי זהב)
- כל תמה עם אנימציות ייחודיות

#### ✅ לוגו עסק
- תצוגת לוגו בכותרת (אם קיים)
- Fallback לשם עסק אם אין לוגו
- גודל מותאם (max-h-24 במובייל, max-h-28 בדסקטופ)

#### ✅ לוגיקת מנוי
- בדיקת תוקף אוטומטית
- הודעת אזהרה בולטת אם מנוי פג תוקף
- חסימת הוספה לעגלה

---

### 💬 צ'אט AI (`/menu/[businessId]/[tableId]/chat`)

#### ✅ ממשק צ'אט
- תצוגת היסטוריית שיחה
- הודעות משתמש (מימין) ו-AI (משמאל)
- עיצוב מותאם למובייל (צבעים בהירים, אנימציות)
- כפתור "חזור לתפריט" בכותרת

#### ✅ פונקציונליות AI
- **טעינת נתונים:**
  - `aiInstructions` של העסק
  - כל פריטי התפריט (כולל `isPregnancySafe`)
  - העגלה הנוכחית
- **System Prompt:**
  - לא להמציא מנות
  - עזרה עם אלרגיות, מרכיבים, סוכר, גלוטן
  - עזרה בהריון - משתמש ב-`isPregnancySafe` והוראות העסק
  - סיכום הזמנה לפני אישור
- **Actions JSON:**
  - `add_to_cart` - הוספת מנה לעגלה
  - `remove_from_cart` - הסרת מנה מהעגלה
  - `show_item` - הצגת מנה ויזואלית (כמו בתפריט)
- **הודעת אישור** אוטומטית אחרי פעולה

#### ✅ AI Engagement Features (MVP)
- **Smart Upsell:**
  - API `/api/ai/upsell` - חישוב co-occurrence של מנות
  - הצעה אחת רלוונטית אחרי הוספת מנה לעגלה
  - Threshold 30% confidence
- **"Is everything okay?" Check:**
  - טיימר של 1 דקה (לבדיקות)
  - מופיע רק כשהלקוח חוזר לתפריט/צ'אט
  - לא מפריע אם הלקוח עזב
- **Incomplete Order Detection:**
  - זיהוי הזמנה לא הושלמה
  - הודעה כשהלקוח חוזר: "הייתם באמצע הזמנה – רוצים להמשיך?"

#### ✅ שמירת הודעות
- **localStorage** - הודעות נשמרות אוטומטית
- טעינה אוטומטית כשפותחים את הצ'אט
- ניקוי אוטומטי אחרי אישור הזמנה
- **Hydration-safe** - אין שגיאות hydration

#### ✅ אינדיקטור הודעות חדשות
- תג אדום עם "הודעה חדשה" בכפתור הצ'אט
- נקודה לבנה פועמת
- מופיע רק כשיש הודעה חדשה שלא נקראה

#### ✅ אישור הזמנה
- כפתור "Confirm Order"
- יצירת הזמנה ב-Supabase
- ניקוי העגלה
- הודעת הצלחה

---

### 👨‍💼 סופר אדמין (`/super-admin`)

#### ✅ סקירה כללית
- סטטיסטיקות כלליות (עסקים, הזמנות, הכנסות, שולחנות)
- API: `GET /api/super-admin/stats`

#### ✅ ניהול עסקים
- טבלת עסקים עם כל הפרטים
- כפתור "השבת/הפעל" → מעדכן `isEnabled`
- Dropdown סטטוס מנוי → מעדכן `subscription.status`
- שדה מספר שולחנות → מעדכן `subscription.tablesAllowed`
- תצוגת הוראות AI (אם קיימות)

#### ✅ תמחור
- שדה `pricePerTable` (50₪ לחודש לכל שולחן)
- חישוב דוגמאות (5/10/20 שולחנות)

---

### 💳 תשלומים (Stripe) - חלקי

#### ✅ מה יש:
- **API Route:** `/api/billing/create-checkout-session`
- יצירת Stripe Checkout Session
- חישוב מחיר: `tablesRequested * 50 ILS`
- כפתור "שדרג / חדש מנוי" בדשבורד
- מעבר ל-Stripe Checkout

#### ❌ מה חסר:
- **Webhooks** - עדכון `subscription.status` אוטומטית אחרי תשלום
- עדכון `nextBillingDate` אוטומטית
- חישוב מחיר דינמי לפי `pricePerTable` (כרגע קבוע 50₪)

---

### 🖨️ אינטגרציית מדפסת - מוכן!

#### ✅ מה יש:
- **שליחה אוטומטית למדפסת** אחרי יצירת הזמנה (`/api/orders`)
- תמיכה ב-HTTP/HTTPS
- תמיכה ב-3 פורמטים: JSON, Text, XML
- עדכון סטטוס הזמנה:
  - `sent_to_printer` - נשלח בהצלחה
  - `printer_error` - שגיאה בשליחה
- Headers מותאמים אישית
- טיפול בשגיאות (לא מכשיל יצירת הזמנה)

#### ⚠️ מה חסר:
- תמיכה ב-TCP/IP (יש אזהרה בקוד)
- תמיכה ב-Serial (יש אזהרה בקוד)
- Retry logic אם המדפסת לא זמינה

---

### 📊 API Routes מלאים

#### Business
- `GET /api/business/info` - פרטי עסק
- `PUT /api/business/update` - עדכון עסק (כולל `logoUrl`)
- `POST /api/business/register` - רישום עסק
- `PUT /api/business/printer-config` - הגדרות מדפסת

#### Menu
- `GET /api/menu` - רשימת מנות
- `POST /api/menu` - יצירת מנה
- `GET /api/menu/info` - פרטי עסק (לתפריט)
- `PUT /api/menu/[menuItemId]` - עדכון מנה
- `DELETE /api/menu/[menuItemId]` - מחיקת מנה

#### Tables
- `GET /api/tables` - רשימת שולחנות
- `POST /api/tables` - יצירת שולחן
- `DELETE /api/tables/[tableId]` - מחיקת שולחן

#### Orders
- `GET /api/orders/list` - רשימת הזמנות
- `GET /api/orders/stats` - סטטיסטיקות רווחים
- `POST /api/orders` - יצירת הזמנה + שליחה למדפסת

#### AI
- `POST /api/ai/chat` - צ'אט עם AI
- `GET /api/ai/upsell` - הצעת upsell חכמה

#### Auth
- `POST /api/auth/login` - התחברות
- `GET /api/auth/me` - פרטי משתמש נוכחי

#### Printer
- `POST /api/printer/test` - בדיקת מדפסת

#### Billing
- `POST /api/billing/create-checkout-session` - יצירת Stripe Checkout

#### Super Admin
- `GET /api/super-admin/stats` - סטטיסטיקות כלליות
- `GET /api/super-admin/businesses` - רשימת עסקים
- `PUT /api/super-admin/businesses/[businessId]` - עדכון עסק

---

### 🗄️ מבנה בסיס הנתונים

#### Table: `businesses`
- `businessId` (TEXT, UNIQUE)
- `name`, `type`, `template`
- `email` (UNIQUE), `passwordHash`
- `isEnabled` (BOOLEAN)
- `subscription` (JSONB) - `{status, tablesAllowed, nextBillingDate}`
- `printerConfig` (JSONB) - הגדרות מדפסת
- `aiInstructions` (TEXT) - הוראות ל-AI
- `logoUrl` (TEXT) - URL ללוגו עסק
- `createdAt` (TIMESTAMPTZ)

#### Table: `tables`
- `businessId` (TEXT, FK)
- `tableId` (TEXT)
- `label` (TEXT)
- UNIQUE(`businessId`, `tableId`)

#### Table: `menuItems`
- `businessId` (TEXT, FK)
- `category` (TEXT)
- `name` (TEXT)
- `price` (NUMERIC)
- `imageUrl` (TEXT, nullable)
- `ingredients` (JSONB) - array
- `allergens` (JSONB) - array
- `is_featured` (BOOLEAN) - מנה מומלצת
- `is_pregnancy_safe` (BOOLEAN) - מתאים להריון
- UNIQUE(`businessId`, `name`)

#### Table: `orders`
- `orderId` (TEXT, UNIQUE)
- `businessId` (TEXT, FK)
- `tableId` (TEXT)
- `items` (JSONB) - array of items
- `aiSummary` (TEXT, nullable)
- `status` (TEXT) - 'received', 'sent_to_printer', 'printed', 'printer_error'
- `totalAmount` (NUMERIC)
- `createdAt` (TIMESTAMPTZ)

---

## ❌ מה חסר במערכת

### 🔴 חסר לחלוטין (לא קיים בקוד)

#### 1. **Stripe Webhooks**
- ❌ אין API route `/api/stripe/webhook`
- ❌ אין עדכון `subscription.status` אוטומטית אחרי תשלום
- ❌ אין עדכון `nextBillingDate` אוטומטית
- ❌ אין חישוב מחיר דינמי לפי `pricePerTable`

**מה צריך לעשות:**
- יצירת API route `/api/stripe/webhook`
- הוספת signature verification
- עדכון `subscription.status` ל-`active` אחרי `checkout.session.completed`
- עדכון `nextBillingDate` לפי `subscription_schedule`
- חישוב מחיר דינמי ב-`create-checkout-session`

---

#### 2. **התראות (אימייל/וואטסאפ) על הזמנות חדשות**
- ❌ אין שליחת התראות כשנוצרת הזמנה חדשה
- ❌ אין אינטגרציה ל-SMTP/Email service
- ❌ אין אינטגרציה ל-WhatsApp API
- ✅ **מה שיש**: הזמנות נשמרות ב-DB, אבל אין התראה לבעל העסק

**מה צריך לעשות:**
- בחירת ספק (SendGrid, Resend, או SMTP פשוט)
- יצירת API route `/api/notifications/send` או פונקציה ב-`/api/orders`
- הוספת שדה `notificationEmail` או `notificationPhone` ב-`businesses` table
- שליחת התראה ב-`/api/orders` אחרי יצירת הזמנה מוצלחת

---

#### 3. **דוחות מתקדמים / Export ל-CSV**
- ❌ אין אפשרות לייצא הזמנות ל-CSV
- ❌ אין דוחות מתקדמים (גרפים, מגמות, וכו')
- ✅ **מה שיש**: תצוגה בסיסית של הזמנות ורווחים (היום/שבוע/חודש)

**מה צריך לעשות:**
- יצירת API route `/api/orders/export?businessId=...&format=csv`
- הוספת כפתור "ייצא ל-CSV" בדשבורד
- אפשר להוסיף גם דוחות PDF (אופציונלי)

---

### 🟡 חצי-מוכן (יש חלק אבל לא שלם)

#### 4. **תמיכה במדפסות TCP/Serial**
- ✅ **מה שיש**:
  - תמיכה מלאה ב-HTTP/HTTPS
  - שליחה אוטומטית למדפסת
  - עדכון סטטוס הזמנה
- ❌ **מה חסר**:
  - אין תמיכה ב-TCP/IP (יש אזהרה בקוד)
  - אין תמיכה ב-Serial (יש אזהרה בקוד)
  - אין retry logic אם המדפסת לא זמינה

**מה צריך לעשות:**
- הוספת תמיכה ב-TCP/IP (Node.js `net` module)
- הוספת תמיכה ב-Serial (ספרייה כמו `serialport`)
- הוספת retry logic עם exponential backoff
- הוספת timeout handling

---

#### 5. **דף UX יפה ל-Subscription Expired**
- ✅ **מה שיש**:
  - הודעה בולטת בתפריט הלקוח
  - בדיקת סטטוס ב-`/api/menu/info` (מחזיר 403 אם פג תוקף)
  - חסימת הוספה לעגלה אם המנוי פג תוקף
- ❌ **מה חסר**:
  - אין עמוד ייעודי `/subscription-expired` עם עיצוב יפה
  - אין כפתור ליצירת קשר עם העסק
  - אין הסבר מפורט על מה קרה

**מה צריך לעשות:**
- יצירת `app/subscription-expired/page.tsx`
- הפניה ל-`/subscription-expired` במקום להציג הודעה בתפריט
- עיצוב יפה עם אייקונים, הסבר, וכפתור ליצירת קשר

---

## 📊 סיכום לפי עדיפות

### עדיפות גבוהה (חשוב למוצר):
1. **Stripe Webhooks** - בלי זה אין עדכון מנוי אוטומטי אחרי תשלום
2. **התראות על הזמנות** - בעל העסק צריך לדעת שיש הזמנה חדשה
3. **תמיכה במדפסות TCP/Serial** - חלק מהעסקים משתמשים במדפסות TCP

### עדיפות בינונית (חשוב למונטיזציה):
4. **דף UX יפה ל-Subscription Expired** - חוויה טובה יותר ללקוח

### עדיפות נמוכה (nice to have):
5. **דוחות מתקדמים / Export CSV** - שימושי אבל לא קריטי

---

## 🎯 מה עובד בפועל - סיכום

1. ✅ רישום עסק חדש + התחברות
2. ✅ אימות עם JWT וקוקי
3. ✅ דשבורד עסק מלא:
   - ניהול תפריט (CRUD + מנות מומלצות + מתאים להריון)
   - ניהול שולחנות וקודי QR
   - הגדרות עסק (כולל הוראות AI + לוגו)
   - הגדרות מדפסת (UI + API)
   - צפייה בהזמנות ורווחים
4. ✅ תפריט לקוח מלא:
   - תפריט דינמי עם 9 תמות אנימטיביות
   - Carousel מנות מומלצות
   - קטגוריות (sticky במובייל, sidebar בדסקטופ)
   - הרחבת מנות במקום
   - עגלה + סיכום
   - הודעת מנוי פג תוקף
   - לוגו עסק
5. ✅ צ'אט AI מלא:
   - עובד end-to-end עם OpenAI
   - רואה תפריט + הוראות מותאמות
   - עוזר עם אלרגיות, הריון, התאמות
   - יכול להוסיף/להסיר מהעגלה
   - מציג מנות ויזואלית
   - AI Engagement Features (Upsell, "Is everything okay?", Incomplete order)
   - שמירת הודעות ב-localStorage
   - אינדיקטור הודעות חדשות
   - יוצר הזמנה ושומר ב-Supabase
6. ✅ סופר אדמין:
   - סטטיסטיקות כלליות
   - ניהול עסקים
   - עדכון סטטוס מנוי ושולחנות
7. ✅ UX מתקדם:
   - Toasts להתראות
   - אנימציות חלקות
   - Responsive design מלא
8. ✅ אינטגרציית מדפסת:
   - שליחה אוטומטית למדפסת אחרי הזמנה
   - תמיכה ב-HTTP/HTTPS
   - עדכון סטטוס הזמנה

---

**סיכום:** המערכת היא פלטפורמה מלאה ופונקציונלית להזמנות דיגיטליות עם AI, ניהול מנויים, והדפסה. רוב התכונות עובדות, ונותרו בעיקר אינטגרציות חיצוניות (Stripe Webhooks, התראות) ושיפורי UX.





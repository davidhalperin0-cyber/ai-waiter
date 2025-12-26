# סקירת מערכת – QR Ordering SaaS

## 1. תשתית וטכנולוגיה

- **Frontend + Backend**

  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Framer Motion (אנימציות)

- **בסיס נתונים – Supabase (Postgres)**

  - קבצי סכימה ומיגרציות:
    - `supabase_schema.sql` – יוצר את הטבלאות:
      - `businesses`
      - `tables`
      - `"menuItems"`
      - `orders`
    - `supabase_printer_config_migration.sql` – מוסיף `printerConfig` ל־`businesses`.
    - `add_is_featured_column.sql` – מוסיף `is_featured` ל־`menuItems` (מנות מומלצות).
    - `add_ai_instructions_column.sql` – מוסיף `aiInstructions` ל־`businesses` (הוראות ל‑AI).
    - `add_pregnancy_safe_column.sql` – מוסיף `is_pregnancy_safe` ל־`menuItems` (מתאים להריון).

- **אבטחה ואימות**

  - JWT עם `lib/auth.ts`:
    - `signAuthToken(payload)`
    - `verifyAuthToken(token)`
  - קוקי `auth` נשמר ב־`/api/auth/login`.
  - `middleware.ts`:
    - מגן על `/dashboard` וכל תתי הראוטים.
    - אם אין טוקן → מפנה ל־`/login?from=/dashboard`.

- **Supabase Clients**
  - `lib/supabaseAdmin.ts` – client עם Service Role (ל־API בצד השרת).
  - `lib/supabaseClient.ts` – client ציבורי (אם נדרש בצד הקליינט).

---

## 2. מודלים (Types)

בקובץ `lib/types.ts`:

- `BusinessType = 'bar' | 'pizza' | 'sushi' | 'generic'`
- `PrinterConfig` – הגדרות מדפסת/BON.
- `Business`
  - `businessId`, `name`, `type`, `template`
  - `email`, `passwordHash`
  - `isEnabled`
  - `subscription: { status: 'trial' | 'active' | 'expired' | 'past_due'; tablesAllowed; nextBillingDate? }`
  - `printerConfig?: PrinterConfig`
  - `aiInstructions?: string`
  - `createdAt`
- `Table`
  - `businessId`, `tableId`, `label`
- `MenuItem`
  - `businessId`, `category`, `name`, `price`
  - `imageUrl?`
  - `ingredients?: string[]`
  - `allergens?: string[]`
  - `customizationOptions?: string[]`
  - `isFeatured?: boolean` (מנה מומלצת/דיל)
  - `isPregnancySafe?: boolean` (מתאים להריון)
- `Order`, `OrderItem`
  - `Order` כולל `orderId`, `businessId`, `tableId`, `items`, `aiSummary?`, `status`, `totalAmount`, `createdAt`.

---

## 3. מסכים וזרימה – בעל העסק

### 3.1 רישום עסק – `/register`

- טופס:
  - שם עסק
  - סוג עסק (בר/פיצריה/סושי/מסעדה כללית)
  - תבנית עיצוב (Bar/Pizza/Sushi/Generic)
  - אימייל
  - סיסמה
- API:
  - `POST /api/business/register`
    - בודק אם האימייל כבר קיים.
    - יוצר `businessId` (UUID).
    - שומר ב־`businesses` עם:
      - `isEnabled = true`
      - `subscription = { status: 'trial', tablesAllowed: 10 }`

### 3.2 התחברות – `/login`

- טופס התחברות:
  - אימייל, סיסמה
- API:
  - `POST /api/auth/login`
    - מאתר עסק לפי אימייל ב־Supabase.
    - משווה סיסמה עם `bcryptjs`.
    - אם `!isEnabled` → 403 “Business is disabled”.
    - אם תקין → יוצר JWT (`role: 'business'`) ושומר כ־קוקי `auth`.

### 3.3 דשבורד – `/dashboard`

#### טאבים:

1. **ניהול תפריט**

   - טוען פריטים:
     - `GET /api/menu?businessId=...`
     - ממיין לפי `is_featured` ואז לפי `name`.
   - טופס יצירת/עריכת פריט:
     - קטגוריה
     - שם
     - מחיר
     - URL תמונה
     - מרכיבים (מופרדים בפסיקים)
     - אלרגנים (מופרדים בפסיקים)
     - `isFeatured` – מנה מומלצת (דגל + כפתור כוכב ברשימה)
     - `isPregnancySafe` – דגל לוגי (מתאים להריון) – קיים בלוגיקה וב־state, צ׳קבוקס נוסף הושלם.
   - API:
     - `POST /api/menu` – יצירת פריט ב־`menuItems`.
     - `PUT /api/menu/[menuItemName]` – עדכון פריט.
     - `DELETE /api/menu/[menuItemName]?businessId=...` – מחיקה.
   - רשימת פריטים:
     - מציגה פריט עם:
       - קטגוריה, שם, מחיר, תמונה.
       - מרכיבים, אלרגנים.
       - תג `⭐ מומלץ` אם `isFeatured`.

2. **שולחנות ו‑QR**

   - טופס הוספת שולחן:
     - `tableId` – מזהה טכני (ללא רווחים, regex).
     - `label` – השם שהלקוח רואה.
   - API:
     - `GET /api/tables?businessId=...`
     - `POST /api/tables`
     - `DELETE /api/tables/[tableId]?businessId=...`
   - QR:
     - מייצר URL: `/menu/[businessId]/[tableId]`.
     - משתמש ב־`qrcode` ליצירת Data URL של QR.
     - מציג QR + קישור ישיר לתפריט לקוח.

3. **הגדרות עסק**

   - טופס:
     - שם העסק
     - סוג (`type`)
     - תבנית (`template`) – משפיע על Theme של תפריט הלקוח.
     - `aiInstructions` – הוראות מותאמות לעוזר ה‑AI.
   - API:
     - `GET /api/business/info?businessId=...`
       - מחזיר `business`, כולל `subscription`, `printerConfig`, `aiInstructions`.
     - `PUT /api/business/update`
       - מעדכן האיכויות הנ״ל.
   - באנר אזהרה:
     - אם `subscription.status` הוא `expired` או `past_due` – מוצג באנר צהוב בדשבורד.

4. **הגדרות מדפסת / BON**

- טופס:
  - enable/disable מדפסת
  - type: `http` | `tcp` | `serial`
  - endpoint (URL/IP)
  - port
  - payload type: `json` | `text` | `xml`
- API:
  - `PUT /api/business/printer-config` – שומר הגדרות.
  - `POST /api/printer/test` – שולח בקשת בדיקה (Mock).

5. **הזמנות ורווחים**

- API:
  - `GET /api/orders/list?businessId=...` – רשימת הזמנות.
  - `GET /api/orders/stats?businessId=...` – סכומי הכנסות (היום/שבוע/חודש).
- בדשבורד:
  - טבלת Orders (שולחן, סכום, סטטוס, תאריך).
  - קוביות סיכומי הכנסות ל‑Today/Week/Month.

---

## 4. זרימת לקוח (Customer Flow)

### 4.1 תפריט לקוח – `/menu/[businessId]/[tableId]`

- טעינת נתונים:

  - `GET /api/menu/info?businessId=...`
    - מחזיר:
      - `businessId`, `name`, `template`, `subscriptionStatus` (לוגיקה פנימית).
  - `GET /api/menu?businessId=...`
    - מחזיר כל המנות של העסק.

- Theme:

  - `ThemeWrapper` בוחר בין:
    - `BarTheme`
    - `PizzaTheme`
    - `SushiTheme`
    - `GenericTheme`
  - כל theme כולל אנימציות רקע מתקדמות (בירה, פיצה, סושי, חלקיקים, גלים).

- Carousel "מנות מומלצות":

  - בנוי מעל `isFeatured`.
  - Auto-rotate כל 4 שניות.

- סיידבר קטגוריות:

  - בחירה בקטגוריה → סינון מנות.

- כרטיסי מנות:

  - תמונה, שם, קטגוריה, מחיר.
  - מרכיבים + אלרגנים.
  - לאחר העדכון:
    - אם `isPregnancySafe` true → תווית "🤰 מתאים להריון" בתוך שורת המידע.

- עגלה:

  - `CartContext` (גלובלי לכל האפליקציה).
  - “הוסף לעגלה” → מוסיף פריט.
  - תחתית קבועה:
    - סיכום כמות פריטים.
    - סכום כולל.
    - כפתור "המשך לצ'אט עם ה‑AI".

- לוגיקת מנוי:
  - אם `business.isEnabled = false` או `subscription.status in ('expired','past_due')`:
    - `GET /api/menu/info` מחזיר 403.
    - בעמוד התפריט:
      - תיבה בולטת: "המנוי פג תוקף / בפיגור, התפריט לצפייה בלבד".
      - `handleAddToCart` חוסם הוספה לעגלה (alert).

### 4.2 צ'אט AI – `/menu/[businessId]/[tableId]/chat`

- State:

  - `messages` (User/Assistant).
  - `input`.
  - `isFinalReady`, `lastSummary`.
  - גישה ל‑Cart דרך `CartContext`.

- API:

  - `POST /api/ai/chat` מקבל:
    - `businessId`, `tableId`
    - `cart`
    - `messages`
  - בצד השרת:
    - טוען `aiInstructions` של העסק.
    - טוען `menuItems` (כולל דגלים כמו `isPregnancySafe`).
    - בונה `systemPrompt`:
      - עובדה: לא להמציא מנות.
      - לעזור עם אלרגיות, מרכיבים, סוכר, גלוטן.
      - **לעזור גם בהריון – משתמש ב־`isPregnancySafe` ושדה ההוראות**.
      - לסכם הזמנה לפני אישור.
    - מוסיף:
      - `Menu JSON: [...]`
      - `Current cart JSON: [...]`
    - שולח ל‑OpenAI (gpt‑4o‑mini).
    - מחזיר תשובה טקסטואלית.

- Confirm Order:
  - `Confirm Order` → `POST /api/orders`:
    - מחשב `totalAmount`.
    - יוצר `orderId` (UUID).
    - שומר ב־`orders`.
  - אם הצלחה:
    - מנקה את העגלה.
    - מציג Alert עם מזהה הזמנה.

---

## 5. מסך סופר־אדמין – `/super-admin`

### 5.1 סקירה כללית

- API: `GET /api/super-admin/stats`
  - מחזיר:
    - `totalBusinesses`
    - `activeBusinesses`
    - `totalOrders`
    - `ordersToday`
    - `totalRevenue`
    - `totalTables`
- UI:
  - כרטיסיות סטטיסטיקה (עסקים, הזמנות, הכנסות, שולחנות).

### 5.2 ניהול עסקים

- API: `GET /api/super-admin/businesses`
  - מחזיר רשימת עסקים + subscription + ordersCount + tablesCount.
- UI:
  - טבלת עסקים:
    - שם עסק, אימייל, סוג.
    - מספר שולחנות (tablesCount).
    - מספר הזמנות (ordersCount).
    - סטטוס עסק (פעיל/מושבת).
    - סטטוס מנוי (trial/active/expired/past_due).
  - פעולות:
    - כפתור "השבת/הפעל" → `PUT /api/super-admin/businesses/[businessId]` עם `isEnabled`.
    - Dropdown סטטוס מנוי → מעדכן `subscription.status`.

### 5.3 תמחור

- מסך "תמחור":
  - שדה `pricePerTable` (ב־state בלבד כרגע, עם TODO לשמירה ב־DB).
  - חישוב דוגמאות (5/10/20 שולחנות).
- עדכון מספר שולחנות מותר לכל עסק:
  - שדה מספרי לכל עסק.
  - On blur → `updateSubscription`:
    - `PUT /api/super-admin/businesses/[businessId]` עם `subscription.tablesAllowed` המעודכן.

---

## 6. מה עובד בפועל

- רישום עסק חדש + התחברות.
- הזדהות עם JWT וקוקי `auth`.
- דשבורד עסק:
  - ניהול תפריט (CRUD + מנות מומלצות + דגל לוגי “מתאים להריון”).
  - ניהול שולחנות וקודי QR.
  - הגדרות עסק (כולל הוראות ל‑AI).
  - הגדרות מדפסת (מודל מוכן, API מוכן, אינטגרציה לביצוע בפועל בעתיד).
  - צפייה בהזמנות ורווחים.
- תפריט לקוח:
  - תפריט דינמי מה‑DB עם תמות אנימטיביות.
  - Carousel "מנות מומלצות".
  - קטגוריות + כרטיסי מנות יפים.
  - עגלה + סיכום בתחתית.
  - הודעת "מנוי פג תוקף" כשה subscription לא תקף.
  - תג "🤰 מתאים להריון" למנות שסומנו.
- צ'אט AI:
  - עובד end-to-end מול OpenAI.
  - רואה את התפריט + ההוראות המותאמות.
  - מסייע עם אלרגיות, הריון, התאמות וכו'.
  - מייצר הזמנה ושומר אותה ב־Supabase.
- סופר־אדמין:
  - רואה סטטיסטיקות כלליות.
  - רואה רשימת עסקים, סטטוס עסק, סטטוס מנוי.
  - יכול להפעיל/להשבית עסק ולעדכן מספר שולחנות וסטטוס מנוי.

---

## 7. מה עדיין חסר / לשלב הבא

1. **תשלומים אמיתיים (Stripe)**:

   - יצירת Checkout ללקוחות (בעלי עסקים).
   - Webhooks לעדכון `subscription.status` אוטומטית.
   - לוגיקת חישוב מחיר לפי `tablesAllowed` ו‑`pricePerTable`.

2. **מסך UX יפה ל-Subscription Expired**:

   - עמוד עצמאי ללקוח עם עיצוב יפה במקום הודעה בלבד.
   - אולי כפתור ליצירת קשר עם העסק.

3. **שיפורי UX כלליים**:

   - מעבר מ־`alert()` ל־toasts/מודאלים.
   - עוד מצבי loading/empty מפורטים.

4. **השלמת אינטגרציית מדפסת אמיתית**:

   - חיבור לשרות מדפסות (Cloud printing / POS).

5. **התראות**:

   - אימייל/WhatsApp לעסק על הזמנה חדשה.

6. **דוחות וייצוא**:
   - Export ל־CSV/Excel.
   - דוחות לפי שולחן/שעה/מוצר.






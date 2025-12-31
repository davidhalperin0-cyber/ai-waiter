# QR Ordering SaaS - מערכת הזמנות דיגיטלית

מערכת SaaS מלאה להזמנות דיגיטליות דרך QR codes עם AI assistant.

## 🚀 תכונות עיקריות

- **תפריט דיגיטלי** - תפריט יפה עם carousel מנות מומלצות
- **QR Codes** - קודי QR אוטומטיים לכל שולחן
- **AI Assistant** - עוזר AI חכם לענות על שאלות לקוחות
- **ניהול מלא** - דשבורד עסקי לניהול תפריט, שולחנות והזמנות
- **תמות אנימטיביות** - עיצובים ייחודיים (Bar, Pizza, Sushi, Generic)
- **הגדרות מדפסת** - חיבור למדפסת/BON אוטומטי
- **ניהול מנויים** - מערכת מנויים עם בדיקת תוקף אוטומטית

## 📋 דרישות

- Node.js 18+ 
- npm או yarn
- חשבון Supabase
- חשבון OpenAI (לצ'אט AI)

## 🔧 התקנה

### 1. שכפל את הפרויקט

```bash
git clone <repository-url>
cd food
```

### 2. התקן תלויות

```bash
npm install
```

### 3. הגדר משתני סביבה

צור קובץ `.env.local` בשורש הפרויקט:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-random-secret-key-here

# OpenAI (לצ'אט AI)
OPENAI_API_KEY=your-openai-api-key
```

### 4. הגדר את בסיס הנתונים

1. פתח את Supabase Dashboard
2. לך ל-SQL Editor
3. הרץ את הקובץ `supabase_schema.sql` - זה יוצר את כל הטבלאות
4. הרץ את `add_printer_config.sql` - מוסיף שדה הגדרות מדפסת
5. הרץ את `add_is_featured_column.sql` - מוסיף שדה מנות מומלצות
6. הרץ את `add_ai_instructions_column.sql` - מוסיף שדה הוראות AI

### 5. הרץ את השרת

```bash
npm run dev
```

האתר יעלה על `http://localhost:3000`

## 📁 מבנה הפרויקט

```
food/
├── app/
│   ├── api/              # API routes
│   │   ├── business/     # ניהול עסקים
│   │   ├── menu/         # ניהול תפריט
│   │   ├── tables/       # ניהול שולחנות
│   │   ├── orders/       # הזמנות
│   │   ├── ai/           # AI chat
│   │   └── auth/         # אימות
│   ├── dashboard/        # דשבורד עסק
│   ├── super-admin/      # סופר אדמין
│   ├── menu/             # תפריט לקוח
│   ├── register/         # רישום עסק
│   └── login/            # התחברות
├── components/
│   ├── themes/           # תמות אנימטיביות
│   └── CartContext.tsx   # Context לעגלה
├── lib/
│   ├── supabaseClient.ts # Supabase client
│   ├── supabaseAdmin.ts  # Supabase admin
│   ├── auth.ts           # JWT utilities
│   └── types.ts          # TypeScript types
└── middleware.ts         # Route protection
```

## 🎯 שימוש

### רישום עסק חדש

1. לך ל-`/register`
2. מלא את הפרטים:
   - שם עסק
   - סוג עסק (בר/פיצריה/סושי/כללי)
   - תבנית עיצוב
   - אימייל וסיסמה
3. לחץ "הירשם"

### התחברות

1. לך ל-`/login`
2. הכנס אימייל וסיסמה
3. תועבר אוטומטית לדשבורד

### ניהול תפריט

1. בדשבורד, לך לטאב "ניהול תפריט"
2. הוסף קטגוריות ומנות
3. סמן מנות כ"מומלצות" כדי שיופיעו ב-carousel
4. הוסף תמונות, מרכיבים ואלרגנים

### יצירת שולחנות ו-QR

1. לך לטאב "שולחנות וקודי QR"
2. הוסף שולחן חדש (מזהה + תווית)
3. לחץ "צפה ב-QR" כדי לראות/להוריד את הקוד

### הגדרת AI

1. לך לטאב "הגדרות עסק"
2. גלול לשדה "הוראות מותאמות אישית ל-AI"
3. כתוב הוראות ספציפיות (למשל: "בסושי - מנות X, Y חייבות להיות אפויות")

### הגדרת מדפסת

1. לך לטאב "הגדרות מדפסת"
2. הגדר את סוג המדפסת (HTTP/TCP/Serial)
3. הכנס את ה-endpoint או IP
4. לחץ "בדיקת הדפסה" כדי לבדוק

## 🔐 אבטחה

- כל ה-API routes מוגנים עם JWT authentication
- Dashboard routes מוגנים עם middleware
- סיסמאות מוצפנות עם bcrypt
- Row Level Security (RLS) ב-Supabase (אופציונלי)

## 📊 מנויים

המערכת תומכת במערכת מנויים:

- **trial** - תקופת ניסיון
- **active** - מנוי פעיל
- **expired** - מנוי פג תוקף
- **past_due** - מנוי בפיגור תשלום

אם מנוי פג תוקף:
- הלקוחות יראו הודעה בתפריט
- לא ניתן לבצע הזמנות
- באנר אזהרה מופיע בדשבורד

## 🎨 תמות

המערכת כוללת 4 תמות אנימטיביות:

- **Bar** - עיצוב בר עם בועות בירה וניאון
- **Pizza** - עיצוב פיצריה עם פיצות מסתובבות
- **Sushi** - עיצוב סושי עם דגים שוחים ומסוע
- **Generic** - עיצוב כללי עם חלקיקים צפים

## 🛠️ פיתוח

### הרצת פיתוח

```bash
npm run dev
```

### בנייה לייצור

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📝 TODO / מה חסר

- [ ] אינטגרציה ל-Stripe לתשלומים
- [ ] Webhooks לעדכון מנויים
- [ ] Email notifications
- [ ] Analytics מתקדמים
- [ ] Export הזמנות ל-CSV

## 🤝 תרומה

זהו פרויקט פרטי. לשאלות או בעיות, פתח issue.

## 📄 רישיון

MIT License

---

**נבנה עם ❤️ באמצעות Next.js, React, TypeScript, Supabase, ו-OpenAI**








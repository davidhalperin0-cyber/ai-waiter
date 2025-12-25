# מדריך העלאה לפרודקשן

## שלב 1: הרצת מיגרציות SQL ב-Supabase

לפני העלאה, צריך להריץ את כל המיגרציות SQL ב-Supabase:

1. היכנס ל-Supabase Dashboard → SQL Editor
2. הרץ את הקבצים הבאים בסדר:
   - `add_menu_style_column.sql`
   - `add_business_hours_column.sql`
   - `add_is_business_column.sql`
   - `add_is_featured_column.sql` (אם לא הורץ)
   - `add_pregnancy_safe_column.sql` (אם לא הורץ)
   - `add_logo_url_column.sql` (אם לא הורץ)
   - `add_ai_instructions_column.sql` (אם לא הורץ)
   - `add_pos_config_column.sql` (אם לא הורץ)
   - `add_printer_config.sql` (אם לא הורץ)

## שלב 2: העלאה ל-Vercel (מומלץ)

### 2.1 הכנת הפרויקט

1. ודא שהקוד ב-Git:

```bash
git init
git add .
git commit -m "Initial commit"
```

2. דחוף ל-GitHub/GitLab:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

### 2.2 הגדרת Vercel

1. היכנס ל-[Vercel](https://vercel.com) והתחבר עם GitHub
2. לחץ על "New Project"
3. בחר את ה-repository שלך
4. הגדר את הפרויקט:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (או השאר ריק)
   - **Build Command**: `npm run build` (אוטומטי)
   - **Output Directory**: `.next` (אוטומטי)

### 2.3 הגדרת משתני סביבה ב-Vercel

ב-Vercel Dashboard → Project Settings → Environment Variables, הוסף:

#### משתני Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### משתני JWT:

```
JWT_SECRET=your_jwt_secret_key
```

#### משתני Super Admin:

```
SUPER_ADMIN_EMAIL=david.halperin0@gmail.com
SUPER_ADMIN_PASSWORD=Dh12345678!
```

#### משתני OpenAI (אם משתמשים):

```
OPENAI_API_KEY=your_openai_api_key
```

#### משתני Stripe (אם משתמשים):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**חשוב**: ודא שכל המשתנים מוגדרים גם ל-**Production** וגם ל-**Preview** (אם רלוונטי).

### 2.4 Deploy

לחץ על "Deploy" - Vercel יבנה ויעלה את האתר אוטומטית.

## שלב 3: הגדרת Domain (אופציונלי)

1. ב-Vercel Dashboard → Project Settings → Domains
2. הוסף את הדומיין שלך
3. עקוב אחר ההוראות להגדרת DNS

## שלב 4: בדיקות אחרי העלאה

1. בדוק שהאתר נטען: `https://your-domain.vercel.app`
2. בדוק התחברות עסק: `/login`
3. בדוק התחברות super admin: `/super-admin/login`
4. בדוק תפריט לקוח: `/menu/[businessId]/[tableId]`
5. בדוק dashboard: `/dashboard`

## שלב 5: הגדרות נוספות

### 5.1 HTTPS

Vercel מספק HTTPS אוטומטית - אין צורך בהגדרה נוספת.

### 5.2 Environment Variables

ודא שכל המשתנים ב-`.env.local` מוגדרים גם ב-Vercel.

### 5.3 Database

ודא ש-Supabase מוגדר נכון וכל המיגרציות רצו.

## פתרון בעיות נפוצות

### שגיאת "JWT_SECRET is not set"

- ודא שה-`JWT_SECRET` מוגדר ב-Vercel Environment Variables

### שגיאת "SUPER_ADMIN_EMAIL is not set"

- ודא שה-`SUPER_ADMIN_EMAIL` ו-`SUPER_ADMIN_PASSWORD` מוגדרים ב-Vercel

### שגיאת "column does not exist"

- הרץ את המיגרציות SQL ב-Supabase

### שגיאת "Failed to load resource"

- בדוק שה-`NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` מוגדרים נכון

## הערות חשובות

1. **אל תעלה את `.env.local` ל-Git** - הוא כבר ב-`.gitignore`
2. **ודא שכל המיגרציות רצו** לפני העלאה
3. **בדוק את הלוגים ב-Vercel** אם יש בעיות
4. **שמור את כל ה-API keys בסוד** - אל תשתף אותם

## חלופות ל-Vercel

אם אתה מעדיף פלטפורמה אחרת:

- **Netlify**: דומה ל-Vercel, תמיכה טובה ב-Next.js
- **Railway**: טוב לפרויקטים עם database
- **AWS Amplify**: אם אתה כבר משתמש ב-AWS
- **DigitalOcean App Platform**: אופציה נוספת

כל הפלטפורמות האלה דורשות הגדרת משתני סביבה דומה.


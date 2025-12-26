# רשימת משתני סביבה לפרודקשן

העתק את כל המשתנים הבאים ל-Vercel (או פלטפורמת הוסטינג אחרת):

## משתני Supabase (חובה)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**איפה למצוא:**
- Supabase Dashboard → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (סודי!)

## משתני JWT (חובה)

```
JWT_SECRET=your_jwt_secret_key
```

**הערה:** זה צריך להיות מפתח חזק וייחודי. אתה יכול ליצור אחד חדש או להשתמש בזה הקיים.

## משתני Super Admin (חובה)

```
SUPER_ADMIN_EMAIL=david.halperin0@gmail.com
SUPER_ADMIN_PASSWORD=Dh12345678!
```

**הערה:** שים לב - בפרודקשן כדאי לשנות את הסיסמה למשהו חזק יותר!

## משתני OpenAI (אופציונלי - אם משתמשים ב-AI)

```
OPENAI_API_KEY=your_openai_api_key
```

## משתני Stripe (אופציונלי - אם משתמשים בתשלומים)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_PER_TABLE_ID=your_stripe_price_id
```

## משתני App URL (מומלץ)

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**הערה:** זה יעזור עם redirects ו-links. עדכן אחרי שהאתר עלה לאוויר.

## הוראות להגדרה ב-Vercel

1. היכנס ל-Vercel Dashboard
2. בחר את הפרויקט
3. לך ל-Settings → Environment Variables
4. הוסף כל משתנה בנפרד:
   - Name: שם המשתנה (למשל `JWT_SECRET`)
   - Value: הערך (למשל `your_jwt_secret_key`)
   - Environment: בחר **Production**, **Preview**, ו-**Development** (או רק Production אם רלוונטי)
5. לחץ על "Save"
6. **חשוב**: אחרי הוספת משתנים, צריך לעשות Redeploy לפרויקט כדי שהמשתנים יטענו.

## בדיקה

אחרי העלאה, בדוק:
1. שהאתר נטען
2. שההתחברות עובדת (`/login`)
3. שה-super admin login עובד (`/super-admin/login`)
4. שהתפריט נטען (`/menu/[businessId]/[tableId]`)

אם יש שגיאות, בדוק את הלוגים ב-Vercel Dashboard → Deployments → [הדפלוי האחרון] → Functions.




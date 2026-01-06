# הוראות העלאה ל-Vercel - שלב 2

## ✅ שלב 1 הושלם (מיגרציות SQL)

## 📦 שלב 2: העלאה ל-Vercel

### צעד 1: דחיפה ל-GitHub

1. **צור repository חדש ב-GitHub:**
   - היכנס ל-[GitHub](https://github.com)
   - לחץ על "+" → "New repository"
   - שם: `qr-ordering-saas` (או כל שם שתרצה)
   - בחר **Private** (מומלץ)
   - **אל תסמן** "Initialize with README"
   - לחץ "Create repository"

2. **דחוף את הקוד:**
   ```bash
   cd /Users/harelhalperin/Desktop/food
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
   
   **החלף:**
   - `YOUR_USERNAME` - שם המשתמש שלך ב-GitHub
   - `YOUR_REPO_NAME` - שם ה-repository שיצרת

   **אם GitHub מבקש אימות:**
   - השתמש ב-Personal Access Token במקום סיסמה
   - או השתמש ב-GitHub CLI: `gh auth login`

### צעד 2: העלאה ל-Vercel

1. **היכנס ל-Vercel:**
   - לך ל-[vercel.com](https://vercel.com)
   - לחץ "Sign Up" או "Log In"
   - התחבר עם GitHub (מומלץ)

2. **צור פרויקט חדש:**
   - לחץ על "Add New..." → "Project"
   - בחר את ה-repository שיצרת
   - לחץ "Import"

3. **הגדר את הפרויקט:**
   - **Framework Preset**: Next.js (אוטומטי)
   - **Root Directory**: `./` (השאר ריק)
   - **Build Command**: `npm run build` (אוטומטי)
   - **Output Directory**: `.next` (אוטומטי)
   - **Install Command**: `npm install` (אוטומטי)

4. **הגדר משתני סביבה:**
   
   לפני שאתה לוחץ "Deploy", לחץ על "Environment Variables" והוסף:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   SUPER_ADMIN_EMAIL=david.halperin0@gmail.com
   SUPER_ADMIN_PASSWORD=Dh12345678!
   ```
   
   **חשוב:**
   - העתק את הערכים מ-`.env.local` שלך
   - ודא שכל משתנה מוגדר גם ל-**Production**
   - לחץ "Save" אחרי כל משתנה

5. **Deploy:**
   - לחץ "Deploy"
   - חכה שהבנייה תסתיים (2-3 דקות)
   - תקבל URL: `https://your-project.vercel.app`

### צעד 3: בדיקות

אחרי שהאתר עלה, בדוק:

1. **דף הבית:**
   ```
   https://your-project.vercel.app
   ```

2. **התחברות עסק:**
   ```
   https://your-project.vercel.app/login
   ```

3. **Super Admin:**
   ```
   https://your-project.vercel.app/super-admin/login
   ```
   - מייל: `david.halperin0@gmail.com`
   - סיסמה: `Dh12345678!`

4. **תפריט לקוח:**
   ```
   https://your-project.vercel.app/menu/[businessId]/[tableId]
   ```

### צעד 4: הגדרת Domain (אופציונלי)

אם יש לך domain:

1. ב-Vercel Dashboard → Project → Settings → Domains
2. הוסף את הדומיין שלך
3. עקוב אחר ההוראות להגדרת DNS

## 🐛 פתרון בעיות

### "Build failed"
- בדוק את הלוגים ב-Vercel
- ודא שכל המשתנים מוגדרים נכון
- ודא ש-`package.json` תקין

### "Environment variable not found"
- ודא שהמשתנה מוגדר ב-Vercel
- ודא שהוא מוגדר ל-**Production**
- עשה Redeploy אחרי הוספת משתנים

### "Database error"
- ודא שכל המיגרציות רצו ב-Supabase
- בדוק שה-`SUPABASE_SERVICE_ROLE_KEY` נכון

## 📝 הערות

- Vercel מספק HTTPS אוטומטית
- כל commit ל-`main` יעלה אוטומטית (אם תרצה)
- אתה יכול לראות לוגים ב-Vercel Dashboard → Deployments

## ✅ סיימת?

אחרי שהאתר עלה בהצלחה:
1. בדוק שהכל עובד
2. שנה את `SUPER_ADMIN_PASSWORD` למשהו חזק יותר
3. עדכן את `NEXT_PUBLIC_APP_URL` ב-Vercel ל-URL החדש






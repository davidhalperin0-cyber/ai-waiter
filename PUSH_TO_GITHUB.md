# הוראות דחיפה ל-GitHub

## ✅ ה-remote כבר מוגדר!

ה-remote כבר מוגדר ל:
```
https://github.com/davidhalperin0-cyber/ai-waiter.git
```

## שלב 1: אימות ב-GitHub

יש לך 2 אפשרויות:

### אפשרות 1: Personal Access Token (מומלץ)

1. **צור Personal Access Token:**
   - לך ל-[GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - לחץ "Generate new token (classic)"
   - שם: `Vercel Deploy` (או כל שם)
   - בחר את ה-scopes:
     - ✅ `repo` (כל ה-repositories)
   - לחץ "Generate token"
   - **העתק את הטוקן** (תראה אותו רק פעם אחת!)

2. **דחוף את הקוד:**
   ```bash
   cd /Users/harelhalperin/Desktop/food
   git push -u origin main
   ```
   
   כשיתבקש:
   - **Username**: `davidhalperin0-cyber`
   - **Password**: הדבק את ה-Personal Access Token (לא את הסיסמה!)

### אפשרות 2: GitHub CLI (קל יותר)

1. **התקן GitHub CLI:**
   ```bash
   brew install gh
   ```

2. **התחבר:**
   ```bash
   gh auth login
   ```
   - בחר "GitHub.com"
   - בחר "HTTPS"
   - בחר "Login with a web browser"
   - עקוב אחר ההוראות

3. **דחוף את הקוד:**
   ```bash
   cd /Users/harelhalperin/Desktop/food
   git push -u origin main
   ```

## שלב 2: בדיקה

אחרי הדחיפה, לך ל:
```
https://github.com/davidhalperin0-cyber/ai-waiter
```

אמור לראות את כל הקבצים!

## שלב 3: העלאה ל-Vercel

אחרי שהקוד ב-GitHub:

1. לך ל-[vercel.com](https://vercel.com)
2. התחבר עם GitHub
3. לחץ "Add New..." → "Project"
4. בחר את `davidhalperin0-cyber/ai-waiter`
5. לחץ "Import"
6. **לפני Deploy**, הוסף את כל משתני הסביבה (ראה `ENV_VARIABLES.md`)
7. לחץ "Deploy"

## הערות

- אם יש שגיאה "remote already exists" - זה בסדר, כבר עדכנתי את זה
- אם יש שגיאת אימות - השתמש ב-Personal Access Token
- אחרי הדחיפה הראשונה, כל commit חדש יעלה אוטומטית ל-Vercel (אם תגדיר את זה)




# 🎫 איך ליצור Personal Access Token ב-GitHub

## שלב 1: היכנס ל-GitHub Settings

1. **לך ל:**

   ```
   https://github.com/settings/tokens
   ```

   או:

   - לחץ על התמונה שלך בפינה הימנית העליונה
   - לחץ על "Settings"
   - בתפריט השמאלי, תחת "Developer settings", לחץ על "Personal access tokens"
   - לחץ על "Tokens (classic)"

## שלב 2: צור Token חדש

1. **לחץ על הכפתור הכחול:**

   ```
   Generate new token
   ```

   ואז בחר:

   ```
   Generate new token (classic)
   ```

2. **מלא את הטופס:**

   - **Note**: `Vercel Deploy` (או כל שם שתרצה)
   - **Expiration**: בחר תאריך (למשל `90 days` או `No expiration`)
   - **Select scopes**: סמן ✅ את `repo` (זה יבחר אוטומטית את כל ה-sub-scopes)

3. **גלול למטה ולחץ:**
   ```
   Generate token
   ```

## שלב 3: העתק את ה-Token

**חשוב:** תראה את ה-Token רק פעם אחת! העתק אותו מיד.

הוא יראה משהו כמו:

```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## שלב 4: השתמש ב-Token

כשאתה מריץ:

```bash
git push -u origin main
```

וכשהוא מבקש:

- **Username**: `davidhalperin0-cyber`
- **Password**: הדבק את ה-Token (לא את הסיסמה!)

---

## 🆘 אם עדיין לא מוצא:

**דרך ישירה:**

1. פתח דפדפן
2. לך ל: `https://github.com/settings/tokens/new`
3. זה יקח אותך ישר לטופס יצירת Token

**או:**

1. לך ל: `https://github.com/settings/profile`
2. בתפריט השמאלי, תחת "Developer settings", לחץ על "Personal access tokens"
3. לחץ על "Tokens (classic)"
4. לחץ על "Generate new token (classic)"

---

## 💡 טיפ

אם אתה רוצה דרך קלה יותר, התקן GitHub CLI:

```bash
brew install gh
gh auth login
```

אז פשוט:

```bash
git push -u origin main
```

זה יעבוד בלי Token!





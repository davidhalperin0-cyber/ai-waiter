# 🔐 התחברות עם GitHub CLI

## שלב 1: התחבר

הרץ את הפקודה הבאה בטרמינל:

```bash
gh auth login
```

## שלב 2: בחר את האפשרויות

כשהוא שואל, בחר:

1. **What account do you want to log into?**
   → בחר: `GitHub.com`

2. **What is your preferred protocol for Git operations?**
   → בחר: `HTTPS`

3. **How would you like to authenticate GitHub CLI?**
   → בחר: `Login with a web browser` (הכי קל!)

4. **Press Enter to open github.com in your browser...**
   → לחץ Enter

5. **בדפדפן:**
   - תועבר ל-GitHub
   - לחץ "Authorize github"
   - תחזור לטרמינל

6. **בטרמינל:**
   - הוא ישאל: "What git protocol do you want to use?"
   → בחר: `HTTPS`

## שלב 3: דחוף את הקוד

אחרי שההתחברות הצליחה, הרץ:

```bash
cd /Users/harelhalperin/Desktop/food
git push -u origin main
```

**עכשיו זה יעבוד בלי לבקש אימות!** 🎉

---

## אם יש בעיה:

אם `gh auth login` לא עובד, נסה:

```bash
gh auth login --web
```

זה יפתח את הדפדפן ישירות.



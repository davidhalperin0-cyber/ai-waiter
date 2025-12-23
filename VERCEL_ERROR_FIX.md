# 🔧 תיקון שגיאת "invalid characters" ב-Vercel

## ❌ השגיאה:
"The name contains invalid characters. Only letters, digits, and underscores are allowed. Furthermore, the name should not start with a digit."

## 🔍 מה הבעיה?

ה-Key (שם המשתנה) מכיל תווים לא חוקיים.

## ✅ כללים ל-Key ב-Vercel:

1. ✅ רק אותיות גדולות (A-Z)
2. ✅ רק מספרים (0-9)
3. ✅ רק קו תחתון (_)
4. ❌ **אין** רווחים
5. ❌ **אין** מקפים (-)
6. ❌ **אין** נקודות (.)
7. ❌ **אין** תווים מיוחדים אחרים
8. ❌ **לא** יכול להתחיל במספר

---

## 📋 רשימת Keys תקינים (העתק בדיוק כך):

### ✅ Keys תקינים:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `JWT_SECRET`
5. `SUPER_ADMIN_EMAIL`
6. `SUPER_ADMIN_PASSWORD`
7. `OPENAI_API_KEY`
8. `STRIPE_SECRET_KEY`
9. `STRIPE_WEBHOOK_SECRET`
10. `STRIPE_PRICE_PER_TABLE_ID`
11. `NEXT_PUBLIC_APP_URL`

---

## ⚠️ שגיאות נפוצות:

### ❌ שגוי:
- `NEXT_PUBLIC-SUPABASE_URL` (מקף במקום קו תחתון)
- `NEXT_PUBLIC SUPABASE_URL` (רווח)
- `next_public_supabase_url` (אותיות קטנות)
- `1NEXT_PUBLIC_SUPABASE_URL` (מתחיל במספר)
- `NEXT.PUBLIC.SUPABASE.URL` (נקודות)

### ✅ נכון:
- `NEXT_PUBLIC_SUPABASE_URL` (רק אותיות גדולות, מספרים וקו תחתון)

---

## 🔧 איך לתקן:

1. **ודא שה-Key בדיוק כמו ברשימה למעלה** (העתק-הדבק)
2. **אל תשנה אותיות קטנות/גדולות** - הכל באותיות גדולות
3. **אל תוסיף רווחים או תווים מיוחדים**
4. **ודא שאין טעויות הקלדה**

---

## 💡 טיפ:

הדרך הכי בטוחה:
1. לחץ "Import .env" ב-Vercel
2. העתק את כל התוכן מ-`.env.local`
3. הדבק
4. זה יוסיף הכל אוטומטית עם ה-Keys הנכונים!

---

## 🆘 אם עדיין יש שגיאה:

שלח לי את ה-Key המדויק שאתה מנסה להוסיף, ואני אבדוק מה הבעיה.


# POS Adapter System - Implementation Summary

## ✅ מה נוצר

### 1. Canonical Order Model (`lib/types.ts`)
- **`CanonicalOrder`** - מודל פנימי אחד, לא משתנה
- כולל: orderId, businessId, table, source, items, totals, notes, createdAt
- זהו ה-SINGLE SOURCE OF TRUTH

### 2. POS Adapter Interface (`lib/pos/adapters.ts`)
- **`PosAdapter`** interface - כל אדפטר חייב לממש
- **`GenericHttpAdapter`** - אדפטר גנרי (ברירת מחדל)
- **`CaspitAdapter`** - דוגמה לאדפטר ספציפי
- **`RestoAdapter`** - דוגמה נוספת
- **`getPosAdapter(provider)`** - resolver שמחזיר את האדפטר הנכון

### 3. Order Mapper (`lib/pos/orderMapper.ts`)
- **`orderToCanonical()`** - ממיר Order (DB) → CanonicalOrder
- זהו המקום היחיד שבו מתבצעת המרה

### 4. Integration (`app/api/orders/route.ts`)
- לאחר יצירת הזמנה ב-DB:
  - ממיר ל-CanonicalOrder
  - בוחר אדפטר לפי provider
  - שולח דרך האדפטר
  - מעדכן סטטוס: `sent_to_pos` / `pos_error`
- שגיאת POS לא מכשילה יצירת הזמנה

## 🎯 איך זה עובד

1. **הזמנה נוצרת** → נשמרת ב-DB בפורמט Order
2. **המרה** → `orderToCanonical()` ממיר ל-CanonicalOrder
3. **בחירת אדפטר** → `getPosAdapter(provider)` מחזיר את האדפטר הנכון
4. **שליחה** → האדפטר מתרגם CanonicalOrder → פורמט POS ספציפי
5. **עדכון סטטוס** → `sent_to_pos` או `pos_error`

## 🔒 עקרונות

- ✅ מודל פנימי אחד - לא משתנה
- ✅ אדפטרים מתרגמים - לא משנים את הליבה
- ✅ הוספת POS חדש = אדפטר חדש בלבד
- ✅ הליבה לא משתנה

## 📝 הוספת POS חדש

1. יצירת class חדש שמממש `PosAdapter`
2. הוספת case ב-`getPosAdapter()`
3. עדכון `PosConfig.provider` ב-DB

**זה הכל!** הליבה נשארת ללא שינוי.





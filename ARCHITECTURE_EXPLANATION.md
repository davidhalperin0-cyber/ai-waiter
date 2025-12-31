# הסבר מבנה - תוכן מותאם (Custom Content)

## 📋 סקירה כללית

המערכת מאפשרת למנהלים להוסיף תוכן מותאם שיוצג ללקוחות בדף הנחיתה (landing page) לפני התפריט. התוכן כולל: מבצעים, יצירת קשר, מועדון לקוחות, ביקורות.

---

## 🏗️ מבנה המערכת

### 1. **דף המנהל (Dashboard)** - `app/dashboard/page.tsx`

#### מבנה הטאבים:
```
activeTab: 'menu' | 'tables' | 'settings' | 'printer' | 'orders' | 'pos' | 'content'
```

#### טאב "תוכן נוסף" (content):
- **מיקום:** שורה 1598-1609
- **מה יש שם:**
  - כותרת: "✨ תוכן נוסף"
  - תיאור: "הוסף תוכן מותאם לתפריט: מבצעים, אירועים, יצירת קשר, מועדון לקוחות ועוד."
  - **קומפוננטה:** `<CustomContentEditor />`

#### איך זה עובד:
```typescript
{activeTab === 'content' && (
  <section className="space-y-6">
    <div>
      <h2>✨ תוכן נוסף</h2>
      <p>הוסף תוכן מותאם לתפריט...</p>
    </div>
    
    {businessInfo && (
      <CustomContentEditor 
        businessId={businessId!} 
        initialContent={businessInfo.customContent} 
        onSave={loadBusinessInfo} 
      />
    )}
  </section>
)}
```

#### Flow של שמירה:
1. המשתמש מזין נתונים ב-`CustomContentEditor`
2. לוחץ על "שמור שינויים"
3. `handleSave` ב-`CustomContentEditor` קורא ל-`/api/business/update` עם `customContent`
4. אחרי שמירה מוצלחת, קורא ל-`onSave()` שזה `loadBusinessInfo()` מהדשבורד
5. `loadBusinessInfo()` טוען מחדש את הנתונים מה-API
6. `CustomContentEditor` מקבל את `initialContent` המעודכן דרך `useEffect`

---

### 2. **קומפוננטת העריכה (CustomContentEditor)** - `components/CustomContentEditor.tsx`

#### מבנה הקומפוננטה:

```typescript
interface CustomContentEditorProps {
  businessId: string;
  initialContent?: CustomContent | null;
  onSave: () => Promise<void>;
}
```

#### State פנימי:
```typescript
const [content, setContent] = useState<CustomContent>({
  promotions: [],           // רשימת מבצעים
  events: { ... },          // אירועים
  contact: { ... },         // יצירת קשר
  loyaltyClub: { ... },     // מועדון לקוחות
  reviews: { ... },         // ביקורות
});
```

#### הסקשנים בקומפוננטה:

1. **מבצעים (Promotions)**
   - אפשרות להוסיף/למחוק מבצעים
   - כל מבצע: כותרת (עברית/אנגלית), תיאור, תמונה, תאריך תפוגה, enabled
   - שדות: `title`, `titleEn`, `description`, `descriptionEn`, `imageUrl`, `validUntil`, `enabled`

2. **יצירת קשר (Contact)**
   - Checkbox להפעלה/כיבוי
   - שדות: `title`, `titleEn`, `description`, `descriptionEn`
   - פרטי קשר: `phone`, `email`, `whatsapp`, `instagram`, `facebook`
   - כל שדה נפרד וניתן לעריכה

3. **מועדון לקוחות (Loyalty Club)**
   - Checkbox להפעלה/כיבוי
   - שדות: `title`, `titleEn`, `description`, `descriptionEn`
   - רשימת הטבות: `benefits[]` - כל הטבה עם `text` ו-`textEn`
   - אפשרות להוסיף/למחוק הטבות

4. **ביקורות (Reviews)**
   - Checkbox להפעלה/כיבוי
   - שדות: `title`, `titleEn`, `description`, `descriptionEn`

#### פונקציות עיקריות:

- `handleSave()` - שולח את ה-`content` ל-`/api/business/update`
- `addPromotion()` - מוסיף מבצע חדש
- `removePromotion(id)` - מוחק מבצע
- `updatePromotion(id, field, value)` - מעדכן שדה במבצע
- `addBenefit()` - מוסיף הטבה למועדון לקוחות
- `removeBenefit(index)` - מוחק הטבה
- `updateBenefit(index, field, value)` - מעדכן הטבה

---

### 3. **API Route - שמירה** - `app/api/business/update/route.ts`

#### איך זה עובד:

```typescript
// 1. מקבל את customContent מה-body
const { businessId, ..., customContent } = body;

// 2. מעדכן את customContent בנפרד (כמו subscription)
if (customContent !== undefined) {
  const { error, data } = await supabaseAdmin
    .from('businesses')
    .update({ customContent: customContent || null })
    .eq('businessId', businessId)
    .select('customContent');
}
```

#### חשוב:
- `customContent` מעודכן **בנפרד** משאר השדות
- זה מבטיח שהעדכון לא ייכשל אם יש בעיה עם שדות אחרים
- אם העמודה לא קיימת, מנסה גם `customcontent` (lowercase)

---

### 4. **API Route - קריאה** - `app/api/menu/info/route.ts`

#### איך זה עובד:

```typescript
// 1. מנסה לקרוא עם customContent (camelCase)
let { data: business } = await supabaseAdmin
  .from('businesses')
  .select('..., customContent')
  .eq('businessId', businessId)
  .maybeSingle();

// 2. אם נכשל, מנסה עם customcontent (lowercase)
// 3. אם עדיין null, עושה query ישיר

// 4. מחזיר ב-response:
const response = {
  ...,
  customContent: customContent || null,
};
```

---

### 5. **דף הנחיתה (Landing Page)** - `app/menu/[businessId]/[tableId]/home/page.tsx`

#### מבנה הדף:

```
HomePageContent
├── Header (לוגו/שם, Language Toggle)
├── Main Content
│   ├── Promotions Section (אם יש מבצעים enabled)
│   ├── Contact Section (אם contact.enabled === true)
│   │   └── ContactIcon Components (כל אחד נפרד)
│   ├── Loyalty Club Section (אם loyaltyClub.enabled === true)
│   ├── Reviews Section (אם reviews.enabled === true)
│   └── Menu Button (קישור לתפריט)
```

#### קומפוננטת ContactIcon:

```typescript
function ContactIcon({
  icon: string,        // אימוג'י
  label: string,       // "טלפון", "Email", וכו'
  value: string,       // הערך (מספר טלפון, אימייל, וכו')
  href: string,        // קישור (tel:, mailto:, https://)
  color: string,       // צבע רקע (bg-blue-500/20, וכו')
  external?: boolean   // האם קישור חיצוני
})
```

#### התנהגות:
- **Hover:** האייקון גדל, מסתובב קלות, מופיע tooltip
- **Click:** פותח את הקישור (טלפון, אימייל, WhatsApp, וכו')
- **אנימציות:** Framer Motion עם spring animations

#### איך התוכן מוצג:

1. **מבצעים:**
   ```typescript
   {businessInfo.customContent?.promotions && 
    businessInfo.customContent.promotions.filter(p => p.enabled).length > 0 && (
      // מציג את המבצעים הפעילים
    )}
   ```

2. **יצירת קשר:**
   ```typescript
   {businessInfo.customContent?.contact?.enabled && (
     // מציג את האייקונים (רק אם יש ערך)
     {phone && <ContactIcon ... />}
     {email && <ContactIcon ... />}
     {whatsapp && <ContactIcon ... />}
     {instagram && <ContactIcon ... />}
     {facebook && <ContactIcon ... />}
   )}
   ```

3. **מועדון לקוחות:**
   ```typescript
   {businessInfo.customContent?.loyaltyClub?.enabled && (
     // מציג כותרת, תיאור, רשימת הטבות
   )}
   ```

4. **ביקורות:**
   ```typescript
   {businessInfo.customContent?.reviews?.enabled && (
     // מציג כותרת ותיאור
   )}
   ```

---

## 🔄 Flow מלא - מניהול להצגה

### שלב 1: מנהל מזין תוכן
1. מנהל נכנס לדשבורד → טאב "תוכן נוסף"
2. מזין נתונים ב-`CustomContentEditor` (מבצעים, יצירת קשר, וכו')
3. לוחץ "שמור שינויים"

### שלב 2: שמירה בדטה בייס
1. `CustomContentEditor.handleSave()` → `PUT /api/business/update`
2. API מעדכן את `customContent` ב-`businesses` table
3. הנתונים נשמרים כ-JSONB

### שלב 3: לקוח סורק QR
1. QR code → `/menu/[businessId]/[tableId]/home`
2. `HomePageContent` טוען נתונים → `GET /api/menu/info`
3. API מחזיר `customContent` מה-DB

### שלב 4: הצגה ללקוח
1. הדף מציג את התוכן לפי `enabled` flags
2. כל סקשן מוצג רק אם `enabled === true`
3. אייקוני יצירת קשר מוצגים רק אם יש ערך

---

## 📊 מבנה הנתונים (Database)

### טבלה: `businesses`
```sql
customContent JSONB DEFAULT '{
  "promotions": [],
  "events": { "enabled": false, ... },
  "contact": { "enabled": false, ... },
  "loyaltyClub": { "enabled": false, ... },
  "reviews": { "enabled": false, ... }
}'::jsonb
```

### מבנה CustomContent (TypeScript):
```typescript
interface CustomContent {
  promotions?: Array<{
    id: string;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    imageUrl?: string;
    validUntil?: string;
    enabled: boolean;
  }>;
  
  contact?: {
    enabled: boolean;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };
  
  loyaltyClub?: {
    enabled: boolean;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    benefits?: Array<{
      text: string;
      textEn?: string;
    }>;
  };
  
  reviews?: {
    enabled: boolean;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
  };
}
```

---

## 🎨 עיצוב דף הנחיתה

### Contact Icons:
- **גודל:** 24x24 (w-24 h-24)
- **צורה:** rounded-2xl (מעוגל)
- **אפקטים:**
  - Backdrop blur
  - Shadow עם hover
  - Scale animation (1.1x על hover)
  - Rotate animation (תנועה קלה)
  - Tooltip עם חץ קטן

### צבעים:
- **טלפון:** כחול (`bg-blue-500/20`)
- **אימייל:** סגול (`bg-purple-500/20`)
- **WhatsApp:** ירוק (`bg-green-500/20`)
- **Instagram:** ורוד (`bg-pink-500/20`)
- **Facebook:** כחול כהה (`bg-blue-600/20`)

---

## 🔗 קישורים

### QR Code & NFC:
- **URL:** `/menu/[businessId]/[tableId]/home`
- זה הדף הנחיתה עם התוכן המותאם

### תפריט:
- **URL:** `/menu/[businessId]/[tableId]`
- זה התפריט המלא (ללא התוכן המותאם)

---

## ✅ סיכום

1. **דף המנהל:** טאב "תוכן נוסף" עם `CustomContentEditor`
2. **CustomContentEditor:** קומפוננטה לעריכה של כל התוכן
3. **API Update:** שומר את `customContent` ב-DB
4. **API Info:** מחזיר את `customContent` ללקוח
5. **דף הנחיתה:** מציג את התוכן עם אייקונים יפים ונפרדים

הכל עובד עם **enabled flags** - כל סקשן מוצג רק אם הוא מופעל!




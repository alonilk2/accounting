# Sales Document Creation Components

## Overview
נוצרו שני קומפוננטות חדשות ליצירת מסמכי מכירות:

1. **SalesDocumentDialogs** - קומפוננטת הדיאלוג המרכזית ליצירת מסמכים
2. **SalesDocumentCreator** - עמוד עם ממשק משתמש ליצירת מסמכים שונים

## Files Created

### 1. SalesDocumentDialogs Component
**Path:** `front/src/components/SalesDocumentDialogs.tsx`

קומפוננטת דיאלוג מתקדמת ליצירת מסמכי מכירות (הצעות מחיר, הזמנות, תעודות משלוח).

#### Props:
- `open: boolean` - מצב פתיחה/סגירה של הדיאלוג
- `onClose: () => void` - פונקציה לסגירת הדיאלוג
- `documentType?: 'Quote' | 'Confirmed' | 'Shipped'` - סוג המסמך (ברירת מחדל: 'Quote')
- `onSuccess?: () => void` - פונקציה שמופעלת לאחר יצירה מוצלחת

#### Features:
- בחירת לקוח מרשימה קיימת
- הגדרת תאריכים (הזמנה, יעד, משלוח)
- הוספת פריטים לקווי הזמנה
- חישוב אוטומטי של סכום כל קו
- תמיכה בעברית ואנגלית
- טיפול בשגיאות

### 2. SalesDocumentCreator Page
**Path:** `front/src/pages/SalesDocumentCreator.tsx`

עמוד עם ממשק משתמש נוח ליצירת מסמכים שונים.

#### Features:
- שלושה כרטיסים לסוגי מסמכים שונים:
  - הצעת מחיר (Quote)
  - הזמנה (Confirmed Order)
  - תעודת משלוח (Shipped)
- Floating Action Button ליצירה מהירה
- עיצוב responsive
- תמיכה בעברית ואנגלית

## Usage Examples

### Using SalesDocumentDialogs Component

```tsx
import SalesDocumentDialogs from '../components/SalesDocumentDialogs';

const MyComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Create Quote
      </Button>
      
      <SalesDocumentDialogs
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        documentType="Quote"
        onSuccess={() => {
          console.log('Document created!');
          setDialogOpen(false);
        }}
      />
    </>
  );
};
```

### Using SalesDocumentCreator Page

```tsx
// Add to your routing configuration
import SalesDocumentCreator from '../pages/SalesDocumentCreator';

// In your router:
<Route path="/sales/create" element={<SalesDocumentCreator />} />
```

### Integration with FAB (Floating Action Button)

אתה יכול להשתמש בקומפוננטת הדיאלוגים עם FAB בעמוד המכירות הקיים:

```tsx
// בעמוד Sales.tsx הקיים
import SalesDocumentDialogs from '../components/SalesDocumentDialogs';

// הוסף למצב הקומפוננטה:
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [createDocumentType, setCreateDocumentType] = useState<'Quote' | 'Confirmed' | 'Shipped'>('Quote');

// הוסף FAB:
<Fab 
  color="primary" 
  sx={{ position: 'fixed', bottom: 24, right: 24 }}
  onClick={() => {
    setCreateDocumentType('Quote');
    setCreateDialogOpen(true);
  }}
>
  <AddIcon />
</Fab>

// הוסף את הדיאלוג:
<SalesDocumentDialogs
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  documentType={createDocumentType}
  onSuccess={() => {
    setCreateDialogOpen(false);
    loadSalesOrders(); // רענן את רשימת ההזמנות
  }}
/>
```

## Technical Details

### Dependencies
הקומפוננטות משתמשות ב:
- Material-UI components
- Zustand store for language management
- Sales API for creating orders
- Customers API for customer list
- Items API for product list

### Type Safety
הקומפוננטות משתמשות בטיפוסים מוגדרים:
- `SalesOrderStatus`
- `Customer`
- `Item`
- `CreateSalesOrderForm`

### Error Handling
- טיפול בשגיאות רשת
- הצגת הודעות שגיאה למשתמש
- validation של שדות חובה

## Next Steps

1. **הוסף לניווט:** הוסף קישור לעמוד SalesDocumentCreator בתפריט הראשי
2. **שילוב עם FAB:** הוסף FAB לעמוד המכירות הקיים
3. **הרחבות נוספות:**
   - הדפסת המסמכים
   - שליחה במייל
   - שמירה כ-PDF
   - תבניות מסמכים

## File Structure
```
front/src/
├── components/
│   └── SalesDocumentDialogs.tsx    # קומפוננטת הדיאלוג
├── pages/
│   └── SalesDocumentCreator.tsx    # עמוד יצירת מסמכים
└── types/
    └── entities.ts                 # טיפוסים קיימים
```

# הודעות אינטראקטיביות בעוזר AI

## סקירה כללית

התכונה החדשה מאפשרת להציג דיאלוגים אינטראקטיביים בתוך הצ'ט עם עוזר ה-AI במקום בועות טקסט רגילות. זה מאפשר למשתמש לבצע פעולות כמו:

- אישור פעולות
- מילוי טפסים
- בחירה מבין אפשרויות
- ביצוע פעולות מהירות

## סוגי הודעות אינטראקטיביות

### 1. הודעת אישור (Confirmation)
מציגה דיאלוג עם שאלה ואפשרויות אישור/ביטול.

```typescript
const confirmationMessage = createInvoiceConfirmationMessage('שמוליק כהן', 1500);
```

### 2. הודעת טופס (Form)
מציגה טופס עם שדות קלט שונים.

```typescript
const formMessage = createCustomerFormMessage();
```

### 3. הודעת בחירה (Selection)
מציגה רשימת אפשרויות לבחירה.

```typescript
const selectionMessage = createReportTypeSelectionMessage();
```

### 4. הודעת פעולה (Action)
מציגה כפתורים לפעולות מהירות.

```typescript
const actionMessage = createQuickActionMessage();
```

## איך זה עובד

1. **יצירת הודעה אינטראקטיבית**: השרת או הלקוח יוצר הודעה עם `type: 'interactive'`
2. **הצגה**: הקומפוננט `InteractiveMessage` מציג את הדיאלוג המתאים
3. **טיפול בפעולות**: כאשר המשתמש מבצע פעולה, הפונקציה `handleInteractiveAction` מעדכנת את המסד נתונים ושולחת תגובה לשרת
4. **תגובה**: השרת מקבל את התגובה ויכול להמשיך את השיחה

## הוספת סוגי הודעות חדשים

לפרטי הוספת סוגי הודעות אינטראקטיביות חדשים:

1. **עדכן את הטיפוסים** ב-`types/ai.ts`:
```typescript
componentType: 'confirmation' | 'form' | 'selection' | 'action' | 'your-new-type';
```

2. **הוסף קומפוננט** ב-`InteractiveMessage.tsx`:
```typescript
case 'your-new-type':
  return renderYourNewType();
```

3. **צור פונקציית עזר** ב-`utils/interactiveMessages.ts`:
```typescript
export const createYourNewTypeMessage = (/* parameters */) => ({ /* message structure */ });
```

## דוגמאות שימוש

ניתן לראות דוגמאות פעילות על ידי לחיצה על הכפתור "🧪 דוגמאות אינטראקטיביות" בעמוד עוזר ה-AI.

### דוגמה 1: אישור יצירת חשבונית
המערכת תציג דיאלוג לאישור יצירת חשבונית עם פרטי הלקוח והסכום.

### דוגמה 2: מילוי פרטי לקוח חדש
המערכת תציג טופס עם שדות לשם, מייל, טלפון וכתובת.

### דוגמה 3: בחירת סוג דוח
המערכת תציג רשימת דוחות זמינים עם תיאור לכל דוח.

## שילוב עם השרת

כדי שהשרת יוכל ליצור הודעות אינטראקטיביות, הוא צריך להחזיר JSON בפורמט הבא:

```json
{
  "message": "",
  "interactiveData": {
    "componentType": "confirmation",
    "title": "אישור פעולה",
    "description": "האם אתה בטוח?",
    "actions": [
      {
        "id": "cancel",
        "label": "ביטול",
        "variant": "outlined",
        "action": "cancel"
      },
      {
        "id": "confirm", 
        "label": "אישור",
        "variant": "contained",
        "color": "primary",
        "action": "confirm"
      }
    ]
  }
}
```

התגובה מהמשתמש תגיע כהודעת המשך עם metadata של הפעולה שבוצעה.

# הוראות ליצירת פתרונות אינטרקטיביים - Interactive Features Development Guidelines

## עקרונות כלליים

### כאשר לפתח פיצ'רים חדשים ופעולות שיכולות להתבצע דרך AI Assistant

1. **תמיד יש לבנות הודעות אינטרקטיביות במקום הודעות טקסט רגילות**
2. **כל פעולה שדורשת קלט מהמשתמש חייבת להיות אינטרקטיבית**
3. **השתמש בטפסים מובנים במקום שליחת הוראות טקסט**

## ארכיטקטורה טכנית

### צד השרת (Backend)

#### 1. DTOs להודעות אינטרקטיביות

```csharp
public class ChatResponse
{
    // ... שדות קיימים
    public string Type { get; set; } = "text"; // "text" או "interactive"
    public InteractiveMessageData? InteractiveData { get; set; }
}

public class InteractiveMessageData
{
    public string ComponentType { get; set; } = string.Empty; // "form", "confirmation", "selection", "action"
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<FormField>? Fields { get; set; }
    public List<InteractiveAction>? Actions { get; set; }
    public List<SelectionOption>? Options { get; set; }
}
```

#### 2. זיהוי בקשות אינטרקטיביות ב-AIAssistantService

```csharp
private async Task<InteractiveMessageData?> CheckForInteractiveRequestAsync(string message, int companyId)
{
    var lowerMessage = message.ToLowerInvariant();
    
    // דוגמאות לזיהוי:
    if (IsCustomerCreationRequest(lowerMessage))
        return CreateCustomerForm();
    
    if (IsInvoiceCreationRequest(lowerMessage))
        return await CreateInvoiceFormAsync(companyId);
        
    if (IsProductCreationRequest(lowerMessage))
        return CreateProductForm();
        
    // הוסף זיהויים נוספים כאן...
    
    return null;
}
```

#### 3. יצירת טפסים מובנים

```csharp
private InteractiveMessageData CreateCustomerForm()
{
    return new InteractiveMessageData
    {
        ComponentType = "form",
        Title = "יצירת לקוח חדש",
        Description = "אנא מלא את הפרטים הבאים:",
        Fields = new List<FormField>
        {
            new FormField { Id = "name", Label = "שם הלקוח", Type = "text", Required = true },
            new FormField { Id = "taxId", Label = "מספר זהות", Type = "text", Required = true },
            // הוסף שדות נוספים...
        }
    };
}
```

### צד הלקוח (Frontend)

#### 1. עדכון ההודעות לתמיכה באינטרקטיביות

```typescript
export interface ChatMessage {
    // ... שדות קיימים
    type?: 'text' | 'interactive';
    interactiveData?: InteractiveMessageData;
}
```

#### 2. רכיב MessageBubble מעודכן

```tsx
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onInteractiveAction }) => {
    // Handle interactive messages
    if (message.type === 'interactive' && message.interactiveData) {
        return (
            <InteractiveMessage
                data={message.interactiveData}
                onAction={onInteractiveAction}
            />
        );
    }
    
    // Regular text message...
};
```

#### 3. טיפול בפעולות אינטרקטיביות

```tsx
const handleInteractiveAction = async (actionId: string, result?: unknown) => {
    if (actionId === 'submit' && result) {
        // המרת נתוני הטופס להודעת טקסט מובנית
        const formData = result as Record<string, unknown>;
        const message = formatFormDataToMessage(formData);
        await handleSendMessage(message);
    }
};
```

## סוגי הודעות אינטרקטיביות

### 1. טופס יצירה (Form)

```json
{
    "componentType": "form",
    "title": "יצירת [ישות]",
    "description": "תיאור מה המשתמש צריך למלא",
    "fields": [
        {
            "id": "fieldName",
            "label": "תווית השדה",
            "type": "text|number|email|select|date|textarea",
            "required": true|false,
            "validation": {
                "min": 2,
                "max": 100,
                "pattern": "regex",
                "message": "הודעת שגיאה"
            }
        }
    ]
}
```

### 2. אישור פעולה (Confirmation)

```json
{
    "componentType": "confirmation",
    "title": "אישור פעולה",
    "description": "האם אתה בטוח שברצונך לבצע פעולה זו?",
    "actions": [
        {
            "id": "confirm",
            "label": "אשר",
            "variant": "contained",
            "color": "primary"
        },
        {
            "id": "cancel",
            "label": "ביטול",
            "variant": "outlined"
        }
    ]
}
```

### 3. בחירה מרשימה (Selection)

```json
{
    "componentType": "selection",
    "title": "בחר אפשרות",
    "description": "בחר אפשרות מהרשימה",
    "options": [
        {
            "id": "option1",
            "label": "אפשרות 1",
            "description": "תיאור האפשרות",
            "value": "value1"
        }
    ]
}
```

## מילות מפתח לזיהוי פעולות

### יצירה

- **לקוח**: "צור לקוח", "הוסף לקוח", "לקוח חדש", "customer", "create customer"
- **חשבונית**: "צור חשבונית", "הוסף חשבונית", "חשבונית חדשה", "invoice", "create invoice"
- **מוצר**: "צור מוצר", "הוסף מוצר", "מוצר חדש", "product", "create product"
- **הזמנה**: "צור הזמנה", "הזמנה חדשה", "order", "create order"

### עדכון

- "עדכן", "שנה", "modify", "update", "edit"

### מחיקה

- "מחק", "הסר", "delete", "remove" + צריך אישור!

## תבניות קוד נדרשות

### 1. הוספת זיהוי חדש ל-AIAssistantService

```csharp
// הוסף לפונקציה CheckForInteractiveRequestAsync
if (IsXXXCreationRequest(lowerMessage))
    return CreateXXXForm();

// יצירת פונקציית זיהוי
private bool IsXXXCreationRequest(string message)
{
    var xxxKeywords = new[] { "מילות מפתח בעברית", "keywords in english" };
    var createKeywords = new[] { "צור", "הוסף", "יצור", "חדש", "create", "add", "new" };
    
    return xxxKeywords.Any(keyword => message.Contains(keyword)) &&
           createKeywords.Any(keyword => message.Contains(keyword));
}

// יצירת טופס
private InteractiveMessageData CreateXXXForm()
{
    return new InteractiveMessageData
    {
        ComponentType = "form",
        Title = "יצירת XXX חדש",
        Description = "אנא מלא את הפרטים הבאים:",
        Fields = new List<FormField>
        {
            // הגדרת שדות הטופס
        }
    };
}
```

### 2. עדכון Frontend להתמודדות עם הטופס החדש

```tsx
// ב-handleInteractiveAction
if (formData.specificField && formData.anotherField) {
    // זיהוי טופס XXX
    message = `צור XXX חדש עם הפרטים הבאים:\n`;
    message += `שדה 1: ${formData.field1}\n`;
    message += `שדה 2: ${formData.field2}\n`;
    // הוסף שדות נוספים...
}
```

## חוקים חשובים

### 1. תמיד לוודא validation

- כל שדה חובה צריך להיות מסומן כ-`required: true`
- הוסף validation patterns לשדות כמו אימייל, טלפון, מספר זהות
- הוסף הודעות שגיאה ברורות בעברית

### 2. חוויית משתמש

- כותרות ותיאורים ברורים בעברית
- שדות מסודרים לפי חשיבות
- ברירות מחדל הגיוניות (כמו תנאי תשלום 30 ימים)

### 3. אבטחה

- תמיד לוודא שה-companyId מגיע מהאימות
- לא לסמוך על נתונים מהלקוח בלבד
- לוודא הרשאות לפני ביצוע פעולות

### 4. נגישות

- תמיכה ב-RTL לעברית
- תמיכה במצב כהה/בהיר
- עקביות בעיצוב לפי formStyles.ts

## דוגמאות למימוש

### דוגמה 1: יצירת מוצר חדש

```csharp
private bool IsProductCreationRequest(string message)
{
    var productKeywords = new[] { "מוצר", "product", "פריט", "item" };
    var createKeywords = new[] { "צור", "הוסף", "יצור", "חדש", "create", "add", "new" };
    
    return productKeywords.Any(keyword => message.Contains(keyword)) &&
           createKeywords.Any(keyword => message.Contains(keyword));
}

private InteractiveMessageData CreateProductForm()
{
    return new InteractiveMessageData
    {
        ComponentType = "form",
        Title = "יצירת מוצר חדש",
        Description = "אנא מלא את פרטי המוצר החדש:",
        Fields = new List<FormField>
        {
            new FormField
            {
                Id = "name",
                Label = "שם המוצר",
                Type = "text",
                Required = true,
                Validation = new FieldValidation
                {
                    Min = 2,
                    Max = 200,
                    Message = "שם המוצר חייב להכיל בין 2 ל-200 תווים"
                }
            },
            new FormField
            {
                Id = "price",
                Label = "מחיר",
                Type = "number",
                Required = true,
                Validation = new FieldValidation
                {
                    Min = 0,
                    Message = "המחיר חייב להיות חיובי"
                }
            },
            new FormField
            {
                Id = "category",
                Label = "קטגוריה",
                Type = "select",
                Required = false,
                Options = new List<FieldOption>
                {
                    new FieldOption { Value = "", Label = "בחר קטגוריה..." },
                    new FieldOption { Value = "electronics", Label = "אלקטרוניקה" },
                    new FieldOption { Value = "clothing", Label = "ביגוד" },
                    // הוסף קטגוריות נוספות...
                }
            }
        }
    };
}
```

### דוגמה 2: אישור מחיקה

```csharp
private InteractiveMessageData CreateDeleteConfirmation(string entityType, string entityName)
{
    return new InteractiveMessageData
    {
        ComponentType = "confirmation",
        Title = $"מחיקת {entityType}",
        Description = $"האם אתה בטוח שברצונך למחוק את {entityType}: {entityName}?\nפעולה זו אינה ניתנת לביטול.",
        Actions = new List<InteractiveAction>
        {
            new InteractiveAction
            {
                Id = "confirm",
                Label = "מחק",
                Variant = "contained",
                Color = "error",
                Action = "delete"
            },
            new InteractiveAction
            {
                Id = "cancel",
                Label = "ביטול",
                Variant = "outlined",
                Action = "cancel"
            }
        }
    };
}
```

## סיכום

1. **כל פעולה חדשה שדורשת קלט = הודעה אינטרקטיבית**
2. **השתמש בתבניות הקוד שלמעלה**
3. **תמיד הוסף validation מתאים**
4. **ודא חוויית משתמש טובה בעברית ובאנגלית**
5. **עקוב אחר עקרונות האבטחה וה-multi-tenancy**

זכור: המטרה היא להפוך כל אינטראקציה עם המשתמש למובנית, ברורה ובטוחה.

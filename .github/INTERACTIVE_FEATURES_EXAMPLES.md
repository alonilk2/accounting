# דוגמאות מהירות לתכונות אינטרקטיביות

## הוספת פעולה אינטרקטיבית חדשה - Quick Guide

### 1. הוספת זיהוי ב-AIAssistantService.cs

```csharp
// הוסף ב-CheckForInteractiveRequestAsync
if (IsSupplierCreationRequest(lowerMessage))
    return CreateSupplierForm();

// הוסף פונקציית זיהוי
private bool IsSupplierCreationRequest(string message)
{
    var supplierKeywords = new[] { "ספק", "supplier", "קבלן" };
    var createKeywords = new[] { "צור", "הוסף", "יצור", "חדש", "create", "add", "new" };
    
    return supplierKeywords.Any(keyword => message.Contains(keyword)) &&
           createKeywords.Any(keyword => message.Contains(keyword));
}

// יצירת הטופס
private InteractiveMessageData CreateSupplierForm()
{
    return new InteractiveMessageData
    {
        ComponentType = "form",
        Title = "יצירת ספק חדש",
        Description = "אנא מלא את פרטי הספק:",
        Fields = new List<FormField>
        {
            new FormField
            {
                Id = "name",
                Label = "שם הספק",
                Type = "text",
                Required = true,
                Validation = new FieldValidation
                {
                    Min = 2,
                    Max = 200,
                    Message = "שם הספק חייב להכיל בין 2 ל-200 תווים"
                }
            },
            new FormField
            {
                Id = "taxId",
                Label = "מספר זהות/חברה",
                Type = "text",
                Required = true,
                Validation = new FieldValidation
                {
                    Pattern = @"^\d{9}(\d{2})?$",
                    Message = "מספר זהות חייב להכיל 9 או 11 ספרות"
                }
            }
        }
    };
}
```

### 2. הוספת טיפול ב-Frontend (AIAssistant.tsx)

```tsx
// הוסף ב-handleInteractiveAction
if (formData.name && formData.taxId && !formData.customerId) {
    // זיהוי טופס ספק
    message = `צור ספק חדש עם הפרטים הבאים:\n`;
    message += `שם: ${formData.name}\n`;
    message += `מספר זהות: ${formData.taxId}\n`;
    if (formData.email) message += `אימייל: ${formData.email}\n`;
    if (formData.phone) message += `טלפון: ${formData.phone}\n`;
}
```

## תבניות נפוצות

### טופס עם Select מדינמי

```csharp
private async Task<InteractiveMessageData> CreateOrderFormAsync(int companyId)
{
    // טעינת לקוחות
    var customers = await _context.Customers
        .Where(c => c.CompanyId == companyId && c.IsActive)
        .Select(c => new FieldOption { Value = c.Id, Label = c.Name })
        .ToListAsync();
    
    return new InteractiveMessageData
    {
        ComponentType = "form",
        Title = "יצירת הזמנה חדשה",
        Fields = new List<FormField>
        {
            new FormField
            {
                Id = "customerId",
                Label = "לקוח",
                Type = "select",
                Required = true,
                Options = customers.Prepend(new FieldOption { Value = "", Label = "בחר לקוח..." }).ToList()
            }
        }
    };
}
```

### אישור מחיקה

```csharp
private InteractiveMessageData CreateDeleteConfirmation(string entityType, string entityName)
{
    return new InteractiveMessageData
    {
        ComponentType = "confirmation",
        Title = $"מחיקת {entityType}",
        Description = $"האם למחוק את {entityType}: {entityName}?\nפעולה זו אינה ניתנת לביטול.",
        Actions = new List<InteractiveAction>
        {
            new InteractiveAction
            {
                Id = "confirm",
                Label = "מחק",
                Variant = "contained",
                Color = "error"
            },
            new InteractiveAction
            {
                Id = "cancel",
                Label = "ביטול",
                Variant = "outlined"
            }
        }
    };
}
```

### בחירה מרשימה

```csharp
private InteractiveMessageData CreateReportSelection()
{
    return new InteractiveMessageData
    {
        ComponentType = "selection",
        Title = "בחר סוג דוח",
        Description = "איזה דוח תרצה להפיק?",
        Options = new List<SelectionOption>
        {
            new SelectionOption
            {
                Id = "sales",
                Label = "דוח מכירות",
                Description = "דוח מכירות חודשי",
                Value = "sales-report"
            },
            new SelectionOption
            {
                Id = "customers",
                Label = "דוח לקוחות",
                Description = "רשימת לקוחות פעילים",
                Value = "customers-report"
            }
        }
    };
}
```

## Checklist לפעולה אינטרקטיבית חדשה

- [ ] הוספת זיהוי ב-`CheckForInteractiveRequestAsync`
- [ ] יצירת פונקציית זיהוי `IsXXXRequest`
- [ ] יצירת פונקציית טופס `CreateXXXForm`
- [ ] הוספת טיפול ב-Frontend ב-`handleInteractiveAction`
- [ ] בדיקת validation לכל השדות
- [ ] הוספת הודעות שגיאה בעברית
- [ ] בדיקת תמיכה ב-RTL
- [ ] בדיקת מצב כהה/בהיר
- [ ] בדיקת multi-tenancy (companyId)

## מילות מפתח נפוצות

### ישויות
- לקוח: customer, לקוח, לקוחה
- ספק: supplier, ספק, קבלן
- מוצר: product, מוצר, פריט, item
- חשבונית: invoice, חשבונית, חשבון
- הזמנה: order, הזמנה, הזמנת רכש
- קבלה: receipt, קבלה
- דוח: report, דוח

### פעולות
- יצירה: create, צור, הוסף, יצור, חדש, add, new
- עדכון: update, עדכן, שנה, modify, edit
- מחיקה: delete, מחק, הסר, remove
- הצגה: show, הצג, תציג, display, list

## Tips

1. **תמיד הוסף validation** - לא סומכים על הלקוח
2. **הודעות שגיאה ברורות** - בעברית ומובנות
3. **ברירות מחדל הגיוניות** - כמו תאריכים, תנאי תשלום
4. **Select עם "בחר..."** - תמיד אופציה ריקה ראשונה
5. **Required fields** - סמן בבירור מה חובה ומה לא

# PDF Document Viewing and Printing Feature

## Overview
יכולת צפייה והדפסה של מסמכים במערכת החשבונות החכמה.

## Features Implemented

### Backend Services
- **IPrintService**: Interface לשירותי הדפסה וPDF
- **PrintService**: יישום השירות שמייצר HTML ויכול לייצא ל-PDF
- **PrintController**: API endpoints לצפייה והורדת מסמכים

### Frontend Integration
- **printService**: Service client לקריאה ל-API
- **CustomerDocumentsDialog**: רכיב מעודכן עם פונקציונליות מלאה

## API Endpoints

### View Document in Browser
```
GET /api/print/view/{documentType}/{documentId}?companyId={companyId}
```
- מחזיר HTML לצפייה בדפדפן
- תומך ב-RTL ובעברית
- מותאם להדפסה

### Download PDF
```
GET /api/print/invoice/{salesOrderId}?companyId={companyId}
GET /api/print/receipt/{receiptId}?companyId={companyId}
```
- מחזיר קובץ PDF להורדה
- כרגע מחזיר HTML (לייצור PDF נדרש ספריית PDF)

### Customer Documents Report
```
GET /api/print/customer-documents/{customerId}?companyId={companyId}&fromDate={date}&toDate={date}&documentType={type}
```
- דוח מפורט של כל מסמכי הלקוח
- תומך בסינון לפי תאריך וסוג מסמך

## Frontend Usage

### View Document
```typescript
await printService.viewDocument('SalesOrder', 123, companyId);
```
- פותח חלון חדש עם המסמך
- מוכן להדפסה

### Download Document
```typescript
await printService.downloadDocument('Receipt', 456, companyId);
```
- מוריד קובץ PDF
- שמירה אוטומטית

### Customer Report
```typescript
await printService.downloadCustomerReport(
  customerId, 
  customerName, 
  companyId, 
  fromDate, 
  toDate, 
  documentType
);
```

## Document Types Supported
- **SalesOrder**: מכירות/חשבוניות
- **Receipt**: קבלות תשלום
- **POSSale**: מכירות קופה (בפיתוח)

## Future Enhancements
1. **PDF Library Integration**: שילוב ספריית PDF אמיתית (PuppeteerSharp, iTextSharp)
2. **Custom Templates**: תבניות מותאמות אישית
3. **Digital Signatures**: חתימות דיגיטליות
4. **Email Integration**: שליחת מסמכים במייל
5. **Batch Operations**: פעולות קבוצתיות

## Hebrew/RTL Support
- כל המסמכים מותאמים לעברית וRTL
- פונטים מותאמים לעברית
- פורמט תאריכים ישראלי (DD/MM/YYYY)
- מטבע בשקלים (₪)
- תקנות רשויות המס הישראליות

## Development Notes
- המערכת מוכנה להרחבה עם ספריות PDF
- HTML templates מעוצבים להדפסה
- תמיכה מלאה ב-multi-tenancy
- Audit logging מובנה
- Error handling מקיף

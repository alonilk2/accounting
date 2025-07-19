/**
 * Shared constants for the application
 * Centralizes common values to reduce duplication and improve maintainability
 */

// Common payment terms (in days)
export const PAYMENT_TERMS = {
  IMMEDIATE: 0,
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
  NET_60: 60,
  NET_90: 90
} as const;

// Israeli VAT rate
export const VAT_RATE = 0.17; // 17%

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10
} as const;

// Israeli business validation
export const ISRAELI_VALIDATION = {
  TAX_ID_LENGTH: 9,
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 10,
  MOBILE_PREFIX: '05'
} as const;

// Common form validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ISRAELI_PHONE: /^0\d{8,9}$/,
  ISRAELI_MOBILE: /^05\d{8}$/,
  URL: /^https?:\/\/.+/,
  POSTAL_CODE: /^\d{5,7}$/
} as const;

// Currency settings
export const CURRENCY = {
  DEFAULT: 'ILS',
  SYMBOL: '₪',
  LOCALE: 'he-IL'
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm'
} as const;

// Application themes
export const THEME = {
  DIRECTION: {
    HEBREW: 'rtl',
    ENGLISH: 'ltr'
  },
  LANGUAGES: {
    HEBREW: 'he',
    ENGLISH: 'en'
  }
} as const;

// Sales order statuses with labels
export const SALES_ORDER_STATUS = {
  DRAFT: 'Draft',
  QUOTE: 'Quote',
  CONFIRMED: 'Confirmed',
  PARTIALLY_SHIPPED: 'PartiallyShipped',
  SHIPPED: 'Shipped',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const;

// Sales order status labels
export const SALES_ORDER_STATUS_LABELS = {
  he: {
    [SALES_ORDER_STATUS.DRAFT]: 'טיוטה',
    [SALES_ORDER_STATUS.QUOTE]: 'הצעת מחיר',
    [SALES_ORDER_STATUS.CONFIRMED]: 'מאושר',
    [SALES_ORDER_STATUS.PARTIALLY_SHIPPED]: 'נשלח חלקית',
    [SALES_ORDER_STATUS.SHIPPED]: 'נשלח',
    [SALES_ORDER_STATUS.COMPLETED]: 'הושלם',
    [SALES_ORDER_STATUS.CANCELLED]: 'בוטל'
  },
  en: {
    [SALES_ORDER_STATUS.DRAFT]: 'Draft',
    [SALES_ORDER_STATUS.QUOTE]: 'Quote',
    [SALES_ORDER_STATUS.CONFIRMED]: 'Confirmed',
    [SALES_ORDER_STATUS.PARTIALLY_SHIPPED]: 'Partially Shipped',
    [SALES_ORDER_STATUS.SHIPPED]: 'Shipped',
    [SALES_ORDER_STATUS.COMPLETED]: 'Completed',
    [SALES_ORDER_STATUS.CANCELLED]: 'Cancelled'
  }
} as const;

// Common colors for status indicators
export const STATUS_COLORS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING: 'warning',
  ERROR: 'error',
  INFO: 'info'
} as const;

// API endpoints base paths
export const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  SUPPLIERS: '/api/suppliers',
  ITEMS: '/api/items',
  SALES_ORDERS: '/api/sales-orders',
  INVOICES: '/api/invoices',
  QUOTES: '/api/quotes'
} as const;

// Form field max lengths
export const FIELD_LENGTHS = {
  NAME: 200,
  ADDRESS: 500,
  PHONE: 20,
  EMAIL: 150,
  WEBSITE: 200,
  TAX_ID: 15,
  NOTES: 1000,
  SKU: 50,
  DESCRIPTION: 500
} as const;

// Israeli business types
export const ISRAELI_BUSINESS_TYPES = {
  he: [
    { value: 'individual', label: 'עצמאי' },
    { value: 'company', label: 'חברה' },
    { value: 'partnership', label: 'שותפות' },
    { value: 'nonprofit', label: 'עמותה' }
  ],
  en: [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'nonprofit', label: 'Non-profit' }
  ]
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  he: {
    REQUIRED: 'שדה חובה',
    INVALID_EMAIL: 'כתובת אימייל לא תקינה',
    INVALID_PHONE: 'מספר טלפון לא תקין',
    INVALID_TAX_ID: 'מספר עוסק לא תקין',
    INVALID_URL: 'כתובת אתר לא תקינה',
    NETWORK_ERROR: 'שגיאת תקשורת',
    SAVE_ERROR: 'שגיאה בשמירה',
    DELETE_ERROR: 'שגיאה במחיקה',
    LOAD_ERROR: 'שגיאה בטעינת נתונים'
  },
  en: {
    REQUIRED: 'Required field',
    INVALID_EMAIL: 'Invalid email address',
    INVALID_PHONE: 'Invalid phone number',
    INVALID_TAX_ID: 'Invalid tax ID',
    INVALID_URL: 'Invalid website URL',
    NETWORK_ERROR: 'Network error',
    SAVE_ERROR: 'Save error',
    DELETE_ERROR: 'Delete error',
    LOAD_ERROR: 'Data loading error'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  he: {
    SAVED: 'נשמר בהצלחה',
    DELETED: 'נמחק בהצלחה',
    CREATED: 'נוצר בהצלחה',
    UPDATED: 'עודכן בהצלחה'
  },
  en: {
    SAVED: 'Saved successfully',
    DELETED: 'Deleted successfully',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully'
  }
} as const;
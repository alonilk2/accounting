import type { ChatMessage, InteractiveMessageData } from '../types/ai';

// Helper functions for creating interactive messages

export const createConfirmationMessage = (
  title: string,
  description?: string,
  confirmLabel: string = 'אישור',
  cancelLabel: string = 'ביטול'
): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  content: '', // Content will be replaced by interactive component
  sender: 'assistant',
  type: 'interactive',
  interactiveData: {
    componentType: 'confirmation',
    title,
    description,
    actions: [
      {
        id: 'cancel',
        label: cancelLabel,
        variant: 'outlined',
        action: 'cancel'
      },
      {
        id: 'confirm',
        label: confirmLabel,
        variant: 'contained',
        color: 'primary',
        action: 'confirm'
      }
    ]
  }
});

export const createFormMessage = (
  title: string,
  fields: InteractiveMessageData['fields'],
  description?: string,
  submitLabel: string = 'שלח',
  cancelLabel: string = 'ביטול'
): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  content: '', // Content will be replaced by interactive component
  sender: 'assistant',
  type: 'interactive',
  interactiveData: {
    componentType: 'form',
    title,
    description,
    fields,
    actions: [
      {
        id: 'cancel',
        label: cancelLabel,
        variant: 'outlined',
        action: 'cancel'
      },
      {
        id: 'submit',
        label: submitLabel,
        variant: 'contained',
        color: 'primary',
        action: 'submit'
      }
    ]
  }
});

export const createSelectionMessage = (
  title: string,
  options: InteractiveMessageData['options'],
  description?: string,
  selectLabel: string = 'בחר',
  cancelLabel: string = 'ביטול'
): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  content: '', // Content will be replaced by interactive component
  sender: 'assistant',
  type: 'interactive',
  interactiveData: {
    componentType: 'selection',
    title,
    description,
    options,
    actions: [
      {
        id: 'cancel',
        label: cancelLabel,
        variant: 'outlined',
        action: 'cancel'
      },
      {
        id: 'select',
        label: selectLabel,
        variant: 'contained',
        color: 'primary',
        action: 'select'
      }
    ]
  }
});

export const createActionMessage = (
  title: string,
  actions: InteractiveMessageData['actions'],
  description?: string
): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  content: '', // Content will be replaced by interactive component
  sender: 'assistant',
  type: 'interactive',
  interactiveData: {
    componentType: 'action',
    title,
    description,
    actions
  }
});

// Example usage functions for common scenarios

export const createCustomerFormMessage = () => createFormMessage(
  'יצירת לקוח חדש',
  [
    {
      id: 'name',
      label: 'שם הלקוח',
      type: 'text',
      required: true,
      validation: { min: 2, message: 'שם הלקוח חייב להכיל לפחות 2 תווים' }
    },
    {
      id: 'email',
      label: 'כתובת מייל',
      type: 'email',
      required: true
    },
    {
      id: 'phone',
      label: 'טלפון',
      type: 'text',
      required: false
    },
    {
      id: 'address',
      label: 'כתובת',
      type: 'textarea',
      required: false
    }
  ],
  'אנא מלא את פרטי הלקוח החדש:'
);

export const createInvoiceConfirmationMessage = (customerName: string, amount: number) => 
  createConfirmationMessage(
    'אישור יצירת חשבונית',
    `האם אתה בטוח שברצונך ליצור חשבונית עבור ${customerName} בסכום של ₪${amount.toLocaleString()}?`,
    'צור חשבונית',
    'ביטול'
  );

export const createReportTypeSelectionMessage = () => createSelectionMessage(
  'בחר סוג דוח',
  [
    {
      id: 'sales',
      label: 'דוח מכירות',
      description: 'סיכום מכירות לתקופה נבחרת',
      value: 'sales'
    },
    {
      id: 'customers',
      label: 'דוח לקוחות',
      description: 'רשימת לקוחות וחובותיהם',
      value: 'customers'
    },
    {
      id: 'inventory',
      label: 'דוח מלאי',
      description: 'מצב המלאי הנוכחי',
      value: 'inventory'
    },
    {
      id: 'financial',
      label: 'דוח כספי',
      description: 'סיכום כספי כולל',
      value: 'financial'
    }
  ],
  'איזה סוג דוח תרצה לקבל?'
);

export const createQuickActionMessage = () => createActionMessage(
  'פעולות מהירות',
  [
    {
      id: 'create_invoice',
      label: 'צור חשבונית',
      variant: 'contained',
      color: 'primary',
      action: 'create_invoice'
    },
    {
      id: 'view_customers',
      label: 'צפה בלקוחות',
      variant: 'outlined',
      action: 'view_customers'
    },
    {
      id: 'generate_report',
      label: 'צור דוח',
      variant: 'outlined',
      action: 'generate_report'
    }
  ],
  'בחר פעולה שתרצה לבצע:'
);

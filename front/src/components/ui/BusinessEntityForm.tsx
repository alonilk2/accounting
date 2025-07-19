import React from 'react';
import {
  FormTextField,
  FormSelectField,
  FormBooleanField,
  FormFieldGroup,
  FormRow
} from './FormFields';

// Base interface for business entities (customers/suppliers)
export interface BusinessEntityFormData {
  name: string;
  nameHebrew?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  contact?: string;
  website?: string;
  taxId?: string;
  vatNumber?: string;
  paymentTermsDays: number;
  isActive: boolean;
  notes?: string;
}

interface BusinessEntityFormProps {
  data: BusinessEntityFormData;
  onChange: (field: keyof BusinessEntityFormData, value: any) => void;
  errors?: Partial<Record<keyof BusinessEntityFormData, string>>;
  entityType: 'customer' | 'supplier';
  language?: 'he' | 'en';
}

/**
 * Reusable form component for business entities (customers/suppliers)
 * Reduces code duplication by providing a shared form layout
 */
export const BusinessEntityForm: React.FC<BusinessEntityFormProps> = ({
  data,
  onChange,
  errors = {},
  entityType,
  language = 'he'
}) => {
  const isHebrew = language === 'he';
  
  // Common payment terms options
  const paymentTermsOptions = [
    { value: 0, label: isHebrew ? 'תשלום מיידי' : 'Immediate' },
    { value: 15, label: isHebrew ? '15 יום' : '15 days' },
    { value: 30, label: isHebrew ? '30 יום' : '30 days' },
    { value: 45, label: isHebrew ? '45 יום' : '45 days' },
    { value: 60, label: isHebrew ? '60 יום' : '60 days' },
    { value: 90, label: isHebrew ? '90 יום' : '90 days' }
  ];

  const countryOptions = [
    { value: 'Israel', label: isHebrew ? 'ישראל' : 'Israel' },
    { value: 'United States', label: isHebrew ? 'ארצות הברית' : 'United States' },
    { value: 'United Kingdom', label: isHebrew ? 'בריטניה' : 'United Kingdom' },
    { value: 'Germany', label: isHebrew ? 'גרמניה' : 'Germany' },
    { value: 'France', label: isHebrew ? 'צרפת' : 'France' }
  ];

  return (
    <FormFieldGroup>
      {/* Basic Information */}
      <FormRow>
        <FormTextField
          label={isHebrew ? 'שם' : 'Name'}
          value={data.name}
          onChange={(value) => onChange('name', value)}
          error={errors.name}
          required
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'שם בעברית' : 'Hebrew Name'}
          value={data.nameHebrew || ''}
          onChange={(value) => onChange('nameHebrew', value)}
          error={errors.nameHebrew}
          language={language}
        />
      </FormRow>

      {/* Contact Information */}
      <FormRow>
        <FormTextField
          label={isHebrew ? 'טלפון' : 'Phone'}
          value={data.phone || ''}
          onChange={(value) => onChange('phone', value)}
          error={errors.phone}
          type="tel"
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'נייד' : 'Mobile'}
          value={data.mobile || ''}
          onChange={(value) => onChange('mobile', value)}
          error={errors.mobile}
          type="tel"
          language={language}
        />
      </FormRow>

      <FormRow>
        <FormTextField
          label={isHebrew ? 'אימייל' : 'Email'}
          value={data.email || ''}
          onChange={(value) => onChange('email', value)}
          error={errors.email}
          type="email"
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'איש קשר' : 'Contact Person'}
          value={data.contact || ''}
          onChange={(value) => onChange('contact', value)}
          error={errors.contact}
          language={language}
        />
      </FormRow>

      {/* Address Information */}
      <FormTextField
        label={isHebrew ? 'כתובת' : 'Address'}
        value={data.address || ''}
        onChange={(value) => onChange('address', value)}
        error={errors.address}
        language={language}
      />

      <FormRow>
        <FormTextField
          label={isHebrew ? 'עיר' : 'City'}
          value={data.city || ''}
          onChange={(value) => onChange('city', value)}
          error={errors.city}
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'מיקוד' : 'Postal Code'}
          value={data.postalCode || ''}
          onChange={(value) => onChange('postalCode', value)}
          error={errors.postalCode}
          language={language}
        />
      </FormRow>

      <FormRow>
        <FormSelectField
          label={isHebrew ? 'מדינה' : 'Country'}
          value={data.country || 'Israel'}
          onChange={(value) => onChange('country', value)}
          options={countryOptions}
          error={errors.country}
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'אתר אינטרנט' : 'Website'}
          value={data.website || ''}
          onChange={(value) => onChange('website', value)}
          error={errors.website}
          type="url"
          language={language}
        />
      </FormRow>

      {/* Tax Information */}
      <FormRow>
        <FormTextField
          label={isHebrew ? 'מספר עוסק / ח.פ.' : 'Tax ID'}
          value={data.taxId || ''}
          onChange={(value) => onChange('taxId', value)}
          error={errors.taxId}
          language={language}
        />
        
        <FormTextField
          label={isHebrew ? 'מספר מעמ' : 'VAT Number'}
          value={data.vatNumber || ''}
          onChange={(value) => onChange('vatNumber', value)}
          error={errors.vatNumber}
          language={language}
        />
      </FormRow>

      {/* Business Terms */}
      <FormRow>
        <FormSelectField
          label={isHebrew ? 'תנאי תשלום' : 'Payment Terms'}
          value={data.paymentTermsDays}
          onChange={(value) => onChange('paymentTermsDays', Number(value))}
          options={paymentTermsOptions}
          error={errors.paymentTermsDays}
          language={language}
        />
        
        <FormBooleanField
          label={isHebrew ? 'פעיל' : 'Active'}
          value={data.isActive}
          onChange={(value) => onChange('isActive', value)}
          variant="switch"
          language={language}
        />
      </FormRow>

      {/* Notes */}
      <FormTextField
        label={isHebrew ? 'הערות' : 'Notes'}
        value={data.notes || ''}
        onChange={(value) => onChange('notes', value)}
        error={errors.notes}
        multiline
        rows={3}
        language={language}
      />
    </FormFieldGroup>
  );
};

export default BusinessEntityForm;
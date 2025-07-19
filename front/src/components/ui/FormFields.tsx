import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Checkbox,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import { textFieldStyles } from '../styles/formStyles';

// Base field props
interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  language?: 'he' | 'en';
}

// Text field props
interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

// Select field props
interface SelectFieldProps extends BaseFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
}

// Boolean field props
interface BooleanFieldProps extends Omit<BaseFieldProps, 'required'> {
  value: boolean;
  onChange: (value: boolean) => void;
  variant?: 'checkbox' | 'switch';
}

// Autocomplete field props
interface AutocompleteFieldProps<T> extends BaseFieldProps {
  value: T | null;
  onChange: (value: T | null) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionKey?: (option: T) => string | number;
  loading?: boolean;
  freeSolo?: boolean;
}

/**
 * Reusable text field with consistent styling and validation
 */
export const FormTextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
  multiline = false,
  rows = 4,
  maxLength,
  language = 'he'
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      error={!!error}
      helperText={error}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      placeholder={placeholder}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      inputProps={{ maxLength }}
      sx={textFieldStyles}
    />
  );
};

/**
 * Reusable select field with consistent styling
 */
export const FormSelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  language = 'he'
}) => {
  return (
    <FormControl fullWidth={fullWidth} error={!!error} disabled={disabled} sx={textFieldStyles}>
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

/**
 * Reusable boolean field (checkbox or switch)
 */
export const FormBooleanField: React.FC<BooleanFieldProps> = ({
  label,
  value,
  onChange,
  variant = 'checkbox',
  error,
  disabled = false,
  language = 'he'
}) => {
  if (variant === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={label}
      />
    );
  }

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      }
      label={label}
    />
  );
};

/**
 * Reusable autocomplete field with consistent styling
 */
export function FormAutocompleteField<T>({
  label,
  value,
  onChange,
  options,
  getOptionLabel,
  getOptionKey,
  error,
  required = false,
  disabled = false,
  fullWidth = true,
  loading = false,
  freeSolo = false,
  language = 'he'
}: AutocompleteFieldProps<T>): React.ReactElement {
  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      options={options}
      getOptionLabel={getOptionLabel}
      getOptionKey={getOptionKey}
      loading={loading}
      freeSolo={freeSolo}
      disabled={disabled}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error}
          required={required}
          sx={textFieldStyles}
        />
      )}
    />
  );
}

/**
 * Form field group wrapper for consistent spacing
 */
export const FormFieldGroup: React.FC<{ children: React.ReactNode; spacing?: number }> = ({
  children,
  spacing = 3
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {children}
    </Box>
  );
};

/**
 * Form row for side-by-side fields
 */
export const FormRow: React.FC<{ 
  children: React.ReactNode; 
  spacing?: number;
  responsive?: boolean;
}> = ({
  children,
  spacing = 2,
  responsive = true
}) => {
  return (
    <Box sx={{
      display: 'flex',
      gap: spacing,
      flexDirection: responsive ? { xs: 'column', sm: 'row' } : 'row',
      alignItems: 'stretch'
    }}>
      {children}
    </Box>
  );
};
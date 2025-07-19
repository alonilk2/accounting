import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { InteractiveMessageData, FormField } from '../../types/ai';
import { useUIStore } from '../../stores';
import { textFieldStyles, buttonStyles } from '../../styles/formStyles';

interface InteractiveMessageProps {
  data: InteractiveMessageData;
  onAction: (actionId: string, result?: unknown) => void;
}

const InteractiveMessage: React.FC<InteractiveMessageProps> = ({ data, onAction }) => {
  const { language } = useUIStore();
  const isHebrew = language === 'he';
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && (!value || value === '')) {
      return isHebrew ? 'שדה חובה' : 'This field is required';
    }

    if (field.validation) {
      const validation = field.validation;
      const stringValue = String(value || '');
      
      if (validation.min && stringValue.length < validation.min) {
        return validation.message || (isHebrew ? `מינימום ${validation.min} תווים` : `Minimum ${validation.min} characters`);
      }
      
      if (validation.max && stringValue.length > validation.max) {
        return validation.message || (isHebrew ? `מקסימום ${validation.max} תווים` : `Maximum ${validation.max} characters`);
      }
      
      if (validation.pattern && !new RegExp(validation.pattern).test(stringValue)) {
        return validation.message || (isHebrew ? 'פורמט לא חוקי' : 'Invalid format');
      }
    }

    return null;
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFormSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    if (data.fields) {
      data.fields.forEach(field => {
        const error = validateField(field, formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    onAction('submit', formData);
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.id] || field.defaultValue || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth error={!!error} key={field.id}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              sx={textFieldStyles}
            >
              {field.options?.map((option) => (
                <MenuItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            key={field.id}
            fullWidth
            multiline
            rows={3}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            sx={textFieldStyles}
          />
        );

      case 'date':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />
        );

      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!error}
            helperText={error}
            required={field.required}
            sx={textFieldStyles}
          />
        );
    }
  };

  const renderConfirmation = () => (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <WarningIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {data.title}
          </Typography>
        </Box>
        
        {data.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {data.description}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'flex-end' }}>
        {data.actions?.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            color={action.color}
            onClick={() => onAction(action.id, action.data)}
            sx={action.variant === 'contained' ? buttonStyles.primary : buttonStyles.secondary}
            startIcon={action.id === 'confirm' ? <CheckIcon /> : action.id === 'cancel' ? <CloseIcon /> : undefined}
          >
            {action.label}
          </Button>
        ))}
      </CardActions>
    </Card>
  );

  const renderForm = () => (
    <Card sx={{ maxWidth: 600 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InfoIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {data.title}
            </Typography>
            {data.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {data.description}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {data.fields?.map(renderFormField)}
        </Box>
      </CardContent>
      
      <CardActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => onAction('cancel')}
          sx={buttonStyles.secondary}
          startIcon={<CloseIcon />}
        >
          {isHebrew ? 'ביטול' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleFormSubmit}
          disabled={isSubmitting}
          sx={buttonStyles.primary}
          startIcon={<SendIcon />}
        >
          {isHebrew ? 'שלח' : 'Submit'}
        </Button>
      </CardActions>
    </Card>
  );

  const renderSelection = () => (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InfoIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {data.title}
            </Typography>
            {data.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {data.description}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <FormControl component="fieldset">
          <RadioGroup
            value={formData.selection || ''}
            onChange={(e) => handleFieldChange('selection', e.target.value)}
          >
            {data.options?.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {option.label}
                    </Typography>
                    {option.description && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ mb: 1, alignItems: 'flex-start' }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </CardContent>
      
      <CardActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => onAction('cancel')}
          sx={buttonStyles.secondary}
          startIcon={<CloseIcon />}
        >
          {isHebrew ? 'ביטול' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={() => onAction('select', formData.selection)}
          disabled={!formData.selection}
          sx={buttonStyles.primary}
          startIcon={<CheckIcon />}
        >
          {isHebrew ? 'בחר' : 'Select'}
        </Button>
      </CardActions>
    </Card>
  );

  const renderAction = () => (
    <Card sx={{ maxWidth: 500 }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <InfoIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {data.title}
          </Typography>
        </Box>
        
        {data.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {data.description}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ px: 3, pb: 3, gap: 2, justifyContent: 'center' }}>
        {data.actions?.map((action) => (
          <Button
            key={action.id}
            variant={action.variant}
            color={action.color}
            onClick={() => onAction(action.id, action.data)}
            sx={action.variant === 'contained' ? buttonStyles.primary : buttonStyles.secondary}
          >
            {action.label}
          </Button>
        ))}
      </CardActions>
    </Card>
  );

  const renderContent = () => {
    switch (data.componentType) {
      case 'confirmation':
        return renderConfirmation();
      case 'form':
        return renderForm();
      case 'selection':
        return renderSelection();
      case 'action':
        return renderAction();
      default:
        return (
          <Alert severity="error">
            {isHebrew ? 'סוג הודעה לא נתמך' : 'Unsupported message type'}
          </Alert>
        );
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 2 }}>
      {renderContent()}
    </Box>
  );
};

export default InteractiveMessage;

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface PrintableDocumentProps {
  title: string;
  children: React.ReactNode;
  headerInfo?: {
    companyName?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
  documentNumber?: string;
  documentDate?: Date;
  className?: string;
}

const PrintableDocument: React.FC<PrintableDocumentProps> = ({
  title,
  children,
  headerInfo,
  documentNumber,
  documentDate,
  className,
}) => {
  return (
    <Box
      className={className}
      sx={{
        padding: 2,
        backgroundColor: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: 1.4,
        '@media print': {
          padding: 0,
          boxShadow: 'none',
          backgroundColor: 'white',
          '& *': {
            visibility: 'visible !important',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: 3 }}>
        {headerInfo && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <Box>
              {headerInfo.companyName && (
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {headerInfo.companyName}
                </Typography>
              )}
              {headerInfo.companyAddress && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  {headerInfo.companyAddress}
                </Typography>
              )}
              {headerInfo.companyTaxId && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  ח.פ: {headerInfo.companyTaxId}
                </Typography>
              )}
              {headerInfo.companyPhone && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  טלפון: {headerInfo.companyPhone}
                </Typography>
              )}
              {headerInfo.companyEmail && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  דוא"ל: {headerInfo.companyEmail}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
                {title}
              </Typography>
              {documentNumber && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  מס' מסמך: {documentNumber}
                </Typography>
              )}
              {documentDate && (
                <Typography variant="body2" sx={{ fontSize: '11px' }}>
                  תאריך: {documentDate.toLocaleDateString('he-IL')}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <Divider sx={{ borderColor: 'black', borderWidth: 1 }} />
      </Box>

      {/* Content */}
      <Box sx={{ marginBottom: 3 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box sx={{ marginTop: 4, textAlign: 'center' }}>
        <Divider sx={{ borderColor: 'black', borderWidth: 1, marginBottom: 1 }} />
        <Typography variant="caption" sx={{ fontSize: '10px', color: '#666' }}>
          נוצר באמצעות מערכת הנהלת חשבונות
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintableDocument;

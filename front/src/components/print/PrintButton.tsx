import React, { useRef } from 'react';
import { Button, IconButton } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

interface PrintButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
  children?: React.ReactNode;
  printableContent: React.ComponentType<{ className?: string }>;
  documentTitle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

const PrintButton: React.FC<PrintButtonProps> = ({
  variant = 'outlined',
  size = 'medium',
  iconOnly = false,
  children,
  printableContent: PrintableContent,
  documentTitle = 'מסמך',
  onBeforePrint,
  onAfterPrint,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    onBeforePrint: async () => {
      if (onBeforePrint) {
        onBeforePrint();
      }
    },
    onAfterPrint,
  });

  const buttonContent = children || (iconOnly ? <PrintIcon /> : 'הדפס');

  return (
    <>
      {iconOnly ? (
        <IconButton
          onClick={handlePrint}
          size={size}
          title="הדפס"
          sx={{ color: 'primary.main' }}
        >
          {buttonContent}
        </IconButton>
      ) : (
        <Button
          variant={variant}
          size={size}
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          {buttonContent}
        </Button>
      )}

      {/* Hidden printable content */}
      <div 
        style={{ 
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden'
        }}
      >
        <div ref={printRef}>
          <PrintableContent className="print-content" />
        </div>
      </div>
    </>
  );
};

export default PrintButton;

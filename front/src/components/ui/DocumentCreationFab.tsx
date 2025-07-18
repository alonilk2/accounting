import React, { useState } from 'react';
import {
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  alpha,
  useTheme,
  Divider,
  Typography,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Description as InvoiceIcon,
  ShoppingCart as PurchaseIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
  RequestQuote as QuoteIcon,
  MonetizationOn as ReceiptPaymentIcon,
} from '@mui/icons-material';
import { useUIStore, useAIAssistantStore } from '../../stores';
import InvoiceCreateDialog from '../invoices/InvoiceCreateDialog';
import { PurchaseInvoiceDialog } from '../purchases/PurchaseInvoiceDialog';
import { useNavigate } from 'react-router-dom';

const DocumentCreationFab: React.FC = () => {
  const theme = useTheme();
  const { language } = useUIStore();
  const { isOpen: isAIOpen } = useAIAssistantStore();
  const navigate = useNavigate();
  const isRTL = language === 'he';
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPurchaseInvoiceDialog, setShowPurchaseInvoiceDialog] = useState(false);
  
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const actions = [
    {
      icon: <InvoiceIcon />,
      name: language === 'he' ? 'חשבונית חדשה' : 'New Invoice',
      onClick: () => {
        setShowInvoiceDialog(true);
        handleClose();
      },
    },
    {
      icon: <QuoteIcon />,
      name: language === 'he' ? 'הצעת מחיר' : 'Quote',
      onClick: () => {
        navigate('/sales'); // Navigate to sales page where quotes can be created
        handleClose();
      },
    },
    {
      icon: <OrderIcon />,
      name: language === 'he' ? 'הזמנה' : 'Sales Order',
      onClick: () => {
        navigate('/sales'); // Navigate to sales page where orders can be created
        handleClose();
      },
    },
    {
      icon: <ShippingIcon />,
      name: language === 'he' ? 'תעודת משלוח' : 'Delivery Note',
      onClick: () => {
        navigate('/sales'); // Navigate to sales page where delivery notes can be created
        handleClose();
      },
    },
    {
      icon: <ReceiptIcon />,
      name: language === 'he' ? 'חשבונית מס-קבלה' : 'Tax Invoice Receipt',
      onClick: () => {
        navigate('/tax-invoice-receipts/create');
        handleClose();
      },
    },
    {
      icon: <ReceiptPaymentIcon />,
      name: language === 'he' ? 'קבלה' : 'Receipt',
      onClick: () => {
        navigate('/sales'); // Navigate to sales page where receipts can be managed
        handleClose();
      },
    },
    {
      icon: <PurchaseIcon />,
      name: language === 'he' ? 'חשבונית רכש' : 'Purchase Invoice',
      onClick: () => {
        setShowPurchaseInvoiceDialog(true);
        handleClose();
      },
    },
    {
      icon: <PaymentIcon />,
      name: language === 'he' ? 'הזמנת רכש' : 'Purchase Order',
      onClick: () => {
        navigate('/purchases'); // Navigate to purchases page where purchase orders can be created
        handleClose();
      },
    },
  ];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 32, // אותה גובה כמו AI Assistant FAB
          ...(isRTL 
            ? { left: isAIOpen ? 496 : 108 } // אם AI פתוח - מחוץ לDrawer (420 + 76px), אחרת לצד AI FAB (108px)
            : { right: isAIOpen ? 496 : 108 }
          ),
          zIndex: 1200,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // אנימציה חלקה
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Fab
            onClick={handleClick}
            title={language === 'he' ? 'צור מסמך חדש' : 'Create new document'}
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(25, 118, 210, 0.4)',
              border: '3px solid',
              borderColor: theme.palette.background.paper,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: '0 12px 40px rgba(25, 118, 210, 0.5)',
              },
              '&:active': {
                transform: 'translateY(-2px) scale(1.02)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                borderRadius: 'inherit',
                zIndex: -1,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 0.3,
              },
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
          
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.primary.main,
              textAlign: 'center',
              fontSize: '0.75rem',
              lineHeight: 1,
            }}
          >
            {language === 'he' ? 'צור מסמך' : 'Create'}
          </Typography>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Fade}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              mb: 1, // margin bottom במקום margin top
              borderRadius: 3,
              minWidth: 220,
              background: alpha(theme.palette.background.paper, 0.98),
              backdropFilter: 'blur(20px)',
              border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.2)}`,
              '&:after': { // after במקום before כדי שיהיה למטה
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                zIndex: 0,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            },
          }}
        >
          <Box sx={{ py: 1 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                px: 2, 
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              {language === 'he' ? 'מסמכים חדשים' : 'NEW DOCUMENTS'}
            </Typography>
            <Divider sx={{ my: 1 }} />
            {actions.map((action) => (
              <MenuItem
                key={action.name}
                onClick={action.onClick}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  minHeight: 48,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.12),
                    transform: 'translateX(4px)',
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  color: theme.palette.primary.main,
                }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={action.name}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </MenuItem>
            ))}
          </Box>
        </Menu>
      </Box>

      {/* Dialogs */}
      <InvoiceCreateDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        onSuccess={() => setShowInvoiceDialog(false)}
      />

      <PurchaseInvoiceDialog
        open={showPurchaseInvoiceDialog}
        onClose={() => setShowPurchaseInvoiceDialog(false)}
        suppliers={[]} // TODO: Fetch suppliers from API
      />
    </>
  );
};

export default DocumentCreationFab;

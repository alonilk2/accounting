import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { useUIStore } from '../stores';
import SalesDocumentDialogs from '../components/SalesDocumentDialogs';

const SalesDocumentCreator = () => {
  const { language } = useUIStore();
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [documentType, setDocumentType] = useState<'Quote' | 'Confirmed' | 'Shipped'>('Quote');

  const handleCreateDocument = (type: 'Quote' | 'Confirmed' | 'Shipped') => {
    setDocumentType(type);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleSuccess = () => {
    // Handle successful document creation
    console.log('Document created successfully');
    // You can add navigation logic here or show a success message
  };

  const text = {
    title: language === 'he' ? 'יצירת מסמכי מכירות' : 'Create Sales Documents',
    subtitle: language === 'he' ? 'בחר את סוג המסמך שברצונך ליצור' : 'Choose the type of document you want to create',
    createQuote: language === 'he' ? 'צור הצעת מחיר' : 'Create Quote',
    createOrder: language === 'he' ? 'צור הזמנה' : 'Create Order',
    createDelivery: language === 'he' ? 'צור תעודת משלוח' : 'Create Delivery Note',
    quoteDescription: language === 'he' ? 'הצעת מחיר ללקוח' : 'Price quote for customer',
    orderDescription: language === 'he' ? 'הזמנת מכירות מאושרת' : 'Confirmed sales order',
    deliveryDescription: language === 'he' ? 'תעודת משלוח' : 'Delivery note'
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          {text.title}
        </Typography>
        <Typography variant="h6" color="textSecondary">
          {text.subtitle}
        </Typography>
      </Box>

      {/* Document Type Cards */}
      <Stack spacing={3} sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Quote Card */}
        <Card sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} 
              onClick={() => handleCreateDocument('Quote')}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              p: 2, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ReceiptIcon fontSize="large" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {text.createQuote}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {text.quoteDescription}
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />}>
              {language === 'he' ? 'יצירה' : 'Create'}
            </Button>
          </Stack>
        </Card>

        {/* Order Card */}
        <Card sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => handleCreateDocument('Confirmed')}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ 
              bgcolor: 'success.main', 
              color: 'white', 
              p: 2, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AssignmentIcon fontSize="large" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {text.createOrder}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {text.orderDescription}
              </Typography>
            </Box>
            <Button variant="contained" color="success" startIcon={<AddIcon />}>
              {language === 'he' ? 'יצירה' : 'Create'}
            </Button>
          </Stack>
        </Card>

        {/* Delivery Note Card */}
        <Card sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => handleCreateDocument('Shipped')}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ 
              bgcolor: 'info.main', 
              color: 'white', 
              p: 2, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShippingIcon fontSize="large" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {text.createDelivery}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {text.deliveryDescription}
              </Typography>
            </Box>
            <Button variant="contained" color="info" startIcon={<AddIcon />}>
              {language === 'he' ? 'יצירה' : 'Create'}
            </Button>
          </Stack>
        </Card>
      </Stack>

      {/* Floating Action Button - Alternative quick access */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => handleCreateDocument('Quote')}
      >
        <AddIcon />
      </Fab>

      {/* Sales Document Dialog */}
      <SalesDocumentDialogs
        open={openDialog}
        onClose={handleDialogClose}
        documentType={documentType}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default SalesDocumentCreator;

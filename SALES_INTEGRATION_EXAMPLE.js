// Example of how to integrate SalesDocumentDialogs with existing Sales page

// Add to imports in Sales.tsx:
import SalesDocumentDialogs from '../components/SalesDocumentDialogs';
import { Fab } from '@mui/material';

// Add to component state:
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [createDocumentType, setCreateDocumentType] = useState<'Quote' | 'Confirmed' | 'Shipped'>('Quote');

// Add FAB before the closing Box tag:
{/* Floating Action Button for quick document creation */}
<Fab 
  color="primary" 
  sx={{ 
    position: 'fixed', 
    bottom: 24, 
    right: 24,
    zIndex: 1000
  }}
  onClick={() => {
    setCreateDocumentType('Quote');
    setCreateDialogOpen(true);
  }}
>
  <AddIcon />
</Fab>

{/* Create Document Dialog */}
<SalesDocumentDialogs
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  documentType={createDocumentType}
  onSuccess={() => {
    setCreateDialogOpen(false);
    loadSalesOrders(); // Refresh the orders list
  }}
/>

// Alternative: Add buttons to the header for different document types
<Box display="flex" gap={1}>
  <Tooltip title={text.refresh}>
    <IconButton onClick={loadSalesOrders} disabled={loading}>
      <RefreshIcon />
    </IconButton>
  </Tooltip>
  
  {/* Quote Button */}
  <Button
    variant="outlined"
    startIcon={<ReceiptIcon />}
    onClick={() => {
      setCreateDocumentType('Quote');
      setCreateDialogOpen(true);
    }}
  >
    {language === 'he' ? 'הצעת מחיר' : 'Quote'}
  </Button>
  
  {/* Order Button */}
  <Button
    variant="outlined"
    startIcon={<AssignmentIcon />}
    onClick={() => {
      setCreateDocumentType('Confirmed');
      setCreateDialogOpen(true);
    }}
  >
    {language === 'he' ? 'הזמנה' : 'Order'}
  </Button>
  
  {/* Delivery Button */}
  <Button
    variant="outlined"
    startIcon={<ShippingIcon />}
    onClick={() => {
      setCreateDocumentType('Shipped');
      setCreateDialogOpen(true);
    }}
  >
    {language === 'he' ? 'תעודת משלוח' : 'Delivery'}
  </Button>
  
  {/* Original Add Order Button */}
  <Button
    variant="contained"
    startIcon={<AddIcon />}
    onClick={openAddDialog}
  >
    {text.addOrder}
  </Button>
</Box>

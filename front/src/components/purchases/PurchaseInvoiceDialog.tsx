import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import type { PurchaseInvoice, Supplier } from '../../types/entities';

interface PurchaseInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice?: PurchaseInvoice | null;
  suppliers: Supplier[];
}

export const PurchaseInvoiceDialog = ({ open, onClose, invoice, suppliers }: PurchaseInvoiceDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {invoice ? 'עריכת חשבונית רכש' : 'חשבונית רכש חדשה'}
      </DialogTitle>
      <DialogContent>
        <Typography>
          Dialog placeholder - implement purchase invoice form here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Suppliers available: {suppliers.length}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button variant="contained" onClick={onClose}>שמור</Button>
      </DialogActions>
    </Dialog>
  );
};

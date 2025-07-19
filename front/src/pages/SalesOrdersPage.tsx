// Orders Page - דף הזמנות
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SalesOrdersListSimple from '../components/sales/SalesOrdersListSimple';
import type { SalesOrderStatus } from '../types/entities';

export default function SalesOrdersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shouldOpenDialog, setShouldOpenDialog] = useState(false);
  const [initialStatus, setInitialStatus] = useState<SalesOrderStatus | null>(null);

  useEffect(() => {
    const action = searchParams.get('action');
    const type = searchParams.get('type') as SalesOrderStatus | null;
    
    if (action === 'create') {
      setShouldOpenDialog(true);
      setInitialStatus(type);
      // Clean up URL parameters
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <Box>
      <SalesOrdersListSimple 
        companyId={1} 
        shouldOpenCreateDialog={shouldOpenDialog}
        initialOrderStatus={initialStatus}
        onDialogClose={() => setShouldOpenDialog(false)}
      />
    </Box>
  );
}

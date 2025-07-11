import React from 'react';
import {
  Chip,
  styled,
} from '@mui/material';
import type { SalesOrderStatus } from '../../types/entities';

interface StatusChipProps {
  status: SalesOrderStatus;
}

const StyledChip = styled(Chip)(() => ({
  fontWeight: 'bold',
}));

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getStatusColor = (status: SalesOrderStatus) => {
    switch (status) {
      case 'Quote':
        return 'default';
      case 'Confirmed':
        return 'info';
      case 'Shipped':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: SalesOrderStatus) => {
    switch (status) {
      case 'Quote':
        return 'הצעת מחיר';
      case 'Confirmed':
        return 'הזמנה';
      case 'Shipped':
        return 'תעודת משלוח';
      case 'Completed':
        return 'הושלם';
      case 'Cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  return (
    <StyledChip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size="small"
    />
  );
};

export default StatusChip;

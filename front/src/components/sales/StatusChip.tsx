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
      case 'Draft':
        return 'default';
      case 'Confirmed':
        return 'info';
      case 'Shipped':
        return 'warning';
      case 'Invoiced':
        return 'primary';
      case 'Paid':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: SalesOrderStatus) => {
    switch (status) {
      case 'Draft':
        return 'טיוטה';
      case 'Confirmed':
        return 'מאושר';
      case 'Shipped':
        return 'נשלח';
      case 'Invoiced':
        return 'חשבונית';
      case 'Paid':
        return 'שולם';
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

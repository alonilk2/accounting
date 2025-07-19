// Enhanced table and data grid styles with larger proportions
import type { SxProps, Theme } from '@mui/material/styles';

export const enhancedDataGridStyles: SxProps<Theme> = {
  height: 700, 
  width: '100%',
  fontSize: '1.25rem',
  '& .MuiDataGrid-root': {
    borderRadius: 4,
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
  },
  '& .MuiDataGrid-cell': {
    borderColor: (theme) => theme.palette.divider,
    color: 'text.primary',
    padding: '20px 16px',
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.03)' 
      : 'rgba(255,255,255,0.07)',
    borderColor: (theme) => theme.palette.divider,
    minHeight: '70px !important',
    '& .MuiDataGrid-columnHeaderTitle': {
      color: 'text.primary',
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    }
  },
  '& .MuiDataGrid-footerContainer': {
    borderColor: (theme) => theme.palette.divider,
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.03)' 
      : 'rgba(255,255,255,0.07)',
    minHeight: '70px',
    padding: '0 24px',
    '& .MuiTablePagination-root': {
      fontSize: '1.125rem',
    },
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
      fontSize: '1.125rem',
    }
  },
  '& .MuiDataGrid-row': {
    minHeight: '60px',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(25, 118, 210, 0.06)'
        : 'rgba(59, 130, 246, 0.1)',
    },
    '&.Mui-selected': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(25, 118, 210, 0.08)'
        : 'rgba(59, 130, 246, 0.12)',
    }
  },
  '& .MuiDataGrid-pagination': {
    '& .MuiTablePagination-toolbar': {
      minHeight: '70px',
      padding: '0 24px',
    }
  }
};

export const enhancedTableStyles: SxProps<Theme> = {
  '& .MuiTable-root': {
    fontSize: '1.125rem',
  },
  '& .MuiTableHead-root': {
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.07)',
    '& .MuiTableCell-head': {
      fontWeight: 700,
      fontSize: '1.25rem',
      color: 'text.primary',
      padding: '24px 20px',
      lineHeight: 1.4,
    }
  },
  '& .MuiTableBody-root': {
    '& .MuiTableRow-root': {
      minHeight: '64px',
      '&:hover': {
        backgroundColor: (theme) => theme.palette.mode === 'light'
          ? 'rgba(25, 118, 210, 0.06)' : 'rgba(59, 130, 246, 0.1)',
      }
    }
  },
  '& .MuiTableCell-root': {
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    fontSize: '1.125rem',
    padding: '20px 20px',
    lineHeight: 1.5,
  }
};

export const enhancedFormStyles: SxProps<Theme> = {
  '& .MuiFormControl-root': {
    marginBottom: '24px',
    '& .MuiInputLabel-root': {
      fontSize: '1.25rem',
      fontWeight: 500,
      transform: 'translate(14px, 20px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.85)',
      }
    },
    '& .MuiOutlinedInput-root': {
      fontSize: '1.125rem',
      minHeight: '64px',
      '& .MuiOutlinedInput-input': {
        padding: '20px 14px',
      }
    }
  }
};

export const enhancedCardStyles: SxProps<Theme> = {
  padding: '32px',
  borderRadius: 4,
  margin: '24px 0',
  backgroundColor: 'background.paper',
  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : theme.palette.divider}`,
  boxShadow: (theme) => theme.palette.mode === 'light' 
    ? '0 4px 12px rgba(0,0,0,0.05)' : '0 6px 20px rgba(0,0,0,0.25)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiCardContent-root': {
    padding: '0 !important',
    '&:last-child': {
      paddingBottom: '0 !important',
    }
  },
  '& .MuiCardActions-root': {
    padding: '24px 0 0 0',
    gap: '16px',
  },
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: (theme) => theme.palette.mode === 'light' 
      ? '0 6px 20px rgba(0,0,0,0.1)' : '0 8px 28px rgba(0,0,0,0.35)',
  }
};

export const enhancedDialogStyles: SxProps<Theme> = {
  '& .MuiDialog-paper': {
    borderRadius: 5,
    padding: '32px',
    minWidth: '600px',
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
    boxShadow: (theme) => theme.palette.mode === 'light'
      ? '0 12px 40px rgba(0,0,0,0.15)'
      : '0 12px 40px rgba(0,0,0,0.5)',
  },
  '& .MuiDialogTitle-root': {
    padding: '0 0 24px 0',
    fontSize: '1.75rem',
    fontWeight: 600,
  },
  '& .MuiDialogContent-root': {
    padding: '24px 0',
    fontSize: '1.125rem',
  },
  '& .MuiDialogActions-root': {
    padding: '24px 0 0 0',
    gap: '16px',
    justifyContent: 'flex-end',
  }
};

export const enhancedButtonStyles = {
  primary: {
    borderRadius: 5,
    px: 6,
    py: 2.5,
    fontSize: '1.25rem',
    fontWeight: 600,
    minHeight: '56px',
    textTransform: 'none' as const,
    boxShadow: (theme: Theme) => theme.palette.mode === 'light'
      ? '0 4px 14px rgba(25, 118, 210, 0.35)'
      : '0 4px 14px rgba(59, 130, 246, 0.45)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: (theme: Theme) => theme.palette.mode === 'light'
        ? '0 6px 24px rgba(25, 118, 210, 0.45)'
        : '0 6px 24px rgba(59, 130, 246, 0.55)',
    }
  },
  secondary: {
    borderRadius: 5,
    px: 5,
    py: 2.5,
    fontSize: '1.25rem',
    fontWeight: 500,
    minHeight: '56px',
    textTransform: 'none' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-1px)',
      backgroundColor: (theme: Theme) => theme.palette.mode === 'light' 
        ? 'rgba(0,0,0,0.06)' 
        : 'rgba(255,255,255,0.1)',
    }
  },
  small: {
    borderRadius: 4,
    px: 4,
    py: 2,
    fontSize: '1.125rem',
    fontWeight: 500,
    minHeight: '48px',
    textTransform: 'none' as const,
  },
  large: {
    borderRadius: 6,
    px: 8,
    py: 3,
    fontSize: '1.375rem',
    fontWeight: 600,
    minHeight: '64px',
    textTransform: 'none' as const,
  }
};

export const enhancedListStyles: SxProps<Theme> = {
  '& .MuiListItem-root': {
    padding: '20px 24px',
    borderRadius: 2,
    margin: '4px 0',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(0,0,0,0.04)'
        : 'rgba(255,255,255,0.08)',
    }
  },
  '& .MuiListItemText-primary': {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  '& .MuiListItemText-secondary': {
    fontSize: '1.125rem',
    lineHeight: 1.5,
  },
  '& .MuiListItemIcon-root': {
    minWidth: '64px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.75rem',
    }
  }
};

export const enhancedToolbarStyles: SxProps<Theme> = {
  minHeight: '88px !important',
  padding: '0 32px !important',
  gap: '24px',
  '& .MuiTypography-h6': {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  '& .MuiButton-root': {
    minHeight: '48px',
    fontSize: '1.125rem',
  }
};

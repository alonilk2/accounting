// Unified form styles for dark/light mode compatibility
import type { SxProps, Theme } from '@mui/material/styles';

export const textFieldStyles: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    fontSize: '1rem',
    minHeight: '48px',
    backgroundColor: 'background.paper',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light' 
        ? 'rgba(0,0,0,0.02)' 
        : 'rgba(255,255,255,0.05)',
      transform: 'translateY(-1px)',
      boxShadow: (theme) => theme.palette.mode === 'light'
        ? '0 2px 8px rgba(0,0,0,0.1)'
        : '0 2px 8px rgba(0,0,0,0.3)',
    },
    '&.Mui-focused': {
      backgroundColor: 'background.paper',
      transform: 'translateY(-1px)',
      boxShadow: (theme) => `0 2px 12px ${theme.palette.primary.main}40`,
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '1rem',
    fontWeight: 500,
  }
};

export const dialogStyles: SxProps<Theme> = {
  '& .MuiDialog-paper': {
    borderRadius: 3,
    p: 2.5,
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
    boxShadow: (theme) => theme.palette.mode === 'light'
      ? '0 8px 32px rgba(0,0,0,0.12)'
      : '0 8px 32px rgba(0,0,0,0.4)',
  }
};

export const paperStyles: SxProps<Theme> = {
  p: 4,
  borderRadius: 3,
  boxShadow: (theme) => theme.palette.mode === 'light' 
    ? '0 2px 12px rgba(0,0,0,0.04)' 
    : '0 4px 20px rgba(0,0,0,0.3)',
  backgroundColor: 'background.paper',
  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : theme.palette.divider}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const dataGridStyles: SxProps<Theme> = {
  height: 600, 
  width: '100%',
  '& .MuiDataGrid-root': {
    borderRadius: 2,
    fontSize: '1rem',
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`,
  },
  '& .MuiDataGrid-cell': {
    borderColor: (theme) => theme.palette.divider,
    color: 'text.primary',
    padding: '12px',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.02)' 
      : 'rgba(255,255,255,0.05)',
    borderColor: (theme) => theme.palette.divider,
    minHeight: '52px !important',
    '& .MuiDataGrid-columnHeaderTitle': {
      color: 'text.primary',
      fontWeight: 600,
      fontSize: '1.125rem',
    }
  },
  '& .MuiDataGrid-footerContainer': {
    borderColor: (theme) => theme.palette.divider,
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.02)' 
      : 'rgba(255,255,255,0.05)',
    minHeight: '52px',
  },
  '& .MuiDataGrid-row': {
    minHeight: '44px',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(25, 118, 210, 0.04)'
        : 'rgba(59, 130, 246, 0.08)',
    }
  }
};

export const buttonStyles = {
  primary: {
    borderRadius: 3,
    px: 4,
    py: 1.75,
    fontSize: '1rem',
    fontWeight: 600,
    minHeight: '44px',
    boxShadow: (theme: Theme) => theme.palette.mode === 'light'
      ? '0 4px 12px rgba(25, 118, 210, 0.3)'
      : '0 4px 12px rgba(59, 130, 246, 0.4)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: (theme: Theme) => theme.palette.mode === 'light'
        ? '0 6px 20px rgba(25, 118, 210, 0.4)'
        : '0 6px 20px rgba(59, 130, 246, 0.5)',
    }
  },
  secondary: {
    borderRadius: 3,
    px: 3.5,
    py: 1.75,
    fontSize: '1rem',
    fontWeight: 500,
    minHeight: '44px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-1px)',
      backgroundColor: (theme: Theme) => theme.palette.mode === 'light' 
        ? 'rgba(0,0,0,0.04)' 
        : 'rgba(255,255,255,0.08)',
    }
  }
};

// Table styles
export const tableStyles: SxProps<Theme> = {
  '& .MuiTableHead-root': {
    backgroundColor: (theme) => theme.palette.mode === 'light' 
      ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
    '& .MuiTableCell-head': {
      fontWeight: 600,
      fontSize: '1.125rem',
      color: 'text.primary',
      padding: '20px 16px',
    }
  },
  '& .MuiTableRow-root': {
    minHeight: '56px',
    '&:hover': {
      backgroundColor: (theme) => theme.palette.mode === 'light'
        ? 'rgba(25, 118, 210, 0.04)' : 'rgba(59, 130, 246, 0.08)',
    }
  },
  '& .MuiTableCell-root': {
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    fontSize: '1rem',
    padding: '16px',
  }
};

// Card styles
export const cardStyles: SxProps<Theme> = {
  borderRadius: 3,
  padding: 3,
  backgroundColor: 'background.paper',
  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : theme.palette.divider}`,
  boxShadow: (theme) => theme.palette.mode === 'light' 
    ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.2)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: (theme) => theme.palette.mode === 'light' 
      ? '0 4px 16px rgba(0,0,0,0.08)' : '0 6px 24px rgba(0,0,0,0.3)',
  }
};

import React from 'react';
import {
  Button,
  Box,
  alpha,
} from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ModernButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'ai' | 'danger';
  glow?: boolean;
  iconPosition?: 'start' | 'end';
  icon?: React.ReactElement;
}

const StyledModernButton = styled(Button, {
  shouldForwardProp: (prop) => !['glow', 'modernVariant'].includes(prop as string),
})<{ glow?: boolean; modernVariant?: string }>(({ theme, glow, modernVariant }) => {
  const baseStyles = {
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'none' as const,
    padding: '10px 20px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    backdropFilter: 'blur(20px)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s ease',
    },
    '&:hover::before': {
      left: '100%',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  };

  const glowStyles = glow ? {
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    '&:hover': {
      boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.6)}`,
    },
  } : {};

  switch (modernVariant) {
    case 'primary':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: theme.palette.primary.contrastText,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...glowStyles,
      };

    case 'secondary':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
        color: theme.palette.secondary.contrastText,
        boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 30px ${alpha(theme.palette.secondary.main, 0.4)}`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      };

    case 'outline':
      return {
        ...baseStyles,
        background: 'transparent',
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
        '&:hover': {
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
          borderColor: theme.palette.primary.dark,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      };

    case 'ghost':
      return {
        ...baseStyles,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.05)' 
          : 'rgba(0,0,0,0.03)',
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.06)',
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 30px ${alpha(theme.palette.grey[500], 0.2)}`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      };

    case 'ai':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: '#fff',
        position: 'relative',
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
          animation: 'shimmer 3s infinite',
        },
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: `0 8px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
        },
        '&:active': {
          transform: 'translateY(0) scale(1)',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        ...glowStyles,
      };

    case 'danger':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
        color: theme.palette.error.contrastText,
        boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`,
        '&:hover': {
          background: `linear-gradient(135deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 30px ${alpha(theme.palette.error.main, 0.4)}`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      };

    default:
      return baseStyles;
  }
});

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  variant = 'primary',
  glow = false,
  iconPosition = 'start',
  icon,
  ...props
}) => {
  return (
    <StyledModernButton
      modernVariant={variant}
      glow={glow}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {icon && iconPosition === 'start' && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        {children}
        {icon && iconPosition === 'end' && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
      </Box>
    </StyledModernButton>
  );
};

export default ModernButton;

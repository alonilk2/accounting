import React from 'react';
import {
  Fab,
  Box,
  alpha,
  Tooltip,
} from '@mui/material';
import type { FabProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ModernFabProps extends Omit<FabProps, 'variant'> {
  variant?: 'primary' | 'ai' | 'secondary';
  glow?: boolean;
  pulse?: boolean;
  icon: React.ReactElement;
  tooltip?: string;
}

const StyledModernFab = styled(Fab, {
  shouldForwardProp: (prop) => !['glow', 'pulse', 'modernVariant'].includes(prop as string),
})<{ glow?: boolean; pulse?: boolean; modernVariant?: string }>(({ theme, glow, pulse, modernVariant }) => {
  const baseStyles = {
    borderRadius: '16px',
    width: 64,
    height: 64,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    backdropFilter: 'blur(20px)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
      transform: 'translateX(-100%)',
      transition: 'transform 0.6s ease',
    },
    '&:hover::before': {
      transform: 'translateX(100%)',
    },
    '&:hover': {
      transform: 'translateY(-4px) scale(1.05)',
    },
    '&:active': {
      transform: 'translateY(-2px) scale(1.02)',
    },
  };

  const glowStyles = glow ? {
    boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
    '&:hover': {
      boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.7)}`,
    },
  } : {};

  const pulseStyles = pulse ? {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { 
        boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.7)}`,
      },
      '70%': { 
        boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}`,
      },
      '100%': { 
        boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
      },
    },
  } : {};

  switch (modernVariant) {
    case 'primary':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: theme.palette.primary.contrastText,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
        },
        ...glowStyles,
        ...pulseStyles,
      };

    case 'ai':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: '#fff',
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)`,
          animation: 'shimmer 3s infinite',
          pointerEvents: 'none',
        },
        '&:hover': {
          ...baseStyles['&:hover'],
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
          boxShadow: `0 12px 50px ${alpha(theme.palette.primary.main, 0.6)}`,
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%) translateY(-100%)' },
          '100%': { transform: 'translateX(100%) translateY(100%)' },
        },
        ...glowStyles,
        ...pulseStyles,
      };

    case 'secondary':
      return {
        ...baseStyles,
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
        color: theme.palette.secondary.contrastText,
        boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
          boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.main, 0.5)}`,
        },
        ...glowStyles,
        ...pulseStyles,
      };

    default:
      return {
        ...baseStyles,
        ...glowStyles,
        ...pulseStyles,
      };
  }
});

export const ModernFab: React.FC<ModernFabProps> = ({
  variant = 'primary',
  glow = false,
  pulse = false,
  icon,
  tooltip,
  ...props
}) => {
  const fabElement = (
    <StyledModernFab
      modernVariant={variant}
      glow={glow}
      pulse={pulse}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          '& svg': {
            fontSize: '1.5rem',
          },
        }}
      >
        {icon}
      </Box>
    </StyledModernFab>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="left">
        {fabElement}
      </Tooltip>
    );
  }

  return fabElement;
};

export default ModernFab;

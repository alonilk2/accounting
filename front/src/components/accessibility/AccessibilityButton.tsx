import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Accessibility,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';
import { accessibilityService } from '../../services/accessibilityService';
import AccessibilityPanel from './AccessibilityPanel';

interface AccessibilityButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
}

const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({ 
  position = 'bottom-right',
  size = 'medium'
}) => {
  const { language } = useUIStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1300, // Above most MUI components but below modals
    };

    const offset = isMobile ? 16 : 24;

    switch (position) {
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: offset,
          right: offset,
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: offset,
          left: offset,
        };
      case 'top-right':
        return {
          ...baseStyles,
          top: offset,
          right: offset,
        };
      case 'top-left':
        return {
          ...baseStyles,
          top: offset,
          left: offset,
        };
      default:
        return {
          ...baseStyles,
          bottom: offset,
          right: offset,
        };
    }
  };

  const handleClick = () => {
    setIsPanelOpen(true);
    
    // Announce that accessibility panel is opening
    const message = language === 'he' 
      ? 'פותח את לוח הנגישות'
      : 'Opening accessibility panel';
    accessibilityService.announce(message, 'polite');
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    
    // Announce that accessibility panel is closing
    const message = language === 'he' 
      ? 'סגירת לוח הנגישות'
      : 'Closing accessibility panel';
    accessibilityService.announce(message, 'polite');
  };

  const tooltipText = language === 'he' ? 'פתח הגדרות נגישות' : 'Open accessibility settings';

  return (
    <>
      <Tooltip 
        title={tooltipText}
        placement={position.includes('right') ? 'left' : 'right'}
        arrow
      >
        <Fab
          size={size}
          color="primary"
          sx={{
            ...getPositionStyles(),
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&:focus': {
              outline: `3px solid ${theme.palette.primary.light}`,
              outlineOffset: '2px',
            },
            // High contrast mode support
            '.accessibility-high-contrast &': {
              backgroundColor: '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
              '&:focus': {
                outline: '3px solid #ffff00',
                outlineOffset: '2px',
              },
            },
            // Enhanced focus for accessibility
            '.accessibility-enhanced-focus &:focus': {
              outline: `4px solid ${theme.palette.secondary.main}`,
              outlineOffset: '3px',
            },
            // Pulse animation for better visibility
            animation: 'pulse 3s infinite',
            '&.accessibility-focus-enhanced': {
              animation: 'pulse 1s infinite',
              outline: `4px solid ${theme.palette.secondary.main}`,
              outlineOffset: '4px',
            },
            // Larger touch target on mobile
            [theme.breakpoints.down('sm')]: {
              width: 64,
              height: 64,
            },
          }}
          onClick={handleClick}
          aria-label={tooltipText}
          role="button"
          tabIndex={0}
        >
          <Accessibility />
        </Fab>
      </Tooltip>

      <AccessibilityPanel
        open={isPanelOpen}
        onClose={handleClose}
      />
    </>
  );
};

export default AccessibilityButton;

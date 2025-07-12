import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';
import {
  Box,
  Drawer,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAIAssistantStore, useUIStore } from '../../stores';
import { QuickQuestions } from './QuickQuestions';
import { AISettings } from './AISettings';
import type { ChatMessage } from '../../types/ai';

const DRAWER_WIDTH = 400;

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.sender === 'user';
  
  return (
    <Box
      className="message-bubble"
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 3,
        px: 1,
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: isUser 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '2px solid',
          borderColor: theme.palette.background.paper,
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <AIIcon fontSize="small" />}
      </Avatar>
      
      <Paper
        elevation={0}
        sx={{
          maxWidth: '75%',
          p: 2.5,
          background: isUser 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : theme.palette.background.paper,
          color: isUser ? '#ffffff' : theme.palette.text.primary,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isUser ? 'transparent' : theme.palette.divider,
          boxShadow: isUser 
            ? '0 4px 20px rgba(102, 126, 234, 0.25)'
            : '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isUser 
              ? '0 6px 25px rgba(102, 126, 234, 0.35)'
              : '0 4px 20px rgba(0,0,0,0.12)',
          },
          ...(isUser && {
            borderBottomRightRadius: 8,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: -8,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid',
              borderBottomColor: '#667eea',
            },
          }),
          ...(!isUser && {
            borderBottomLeftRadius: 8,
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: -8,
              width: 0,
              height: 0,
              borderRight: '8px solid transparent',
              borderTop: '8px solid transparent',
              borderBottom: '8px solid',
              borderBottomColor: theme.palette.background.paper,
            },
          }),
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            fontSize: '0.95rem',
            color: isUser ? '#ffffff' : 'inherit',
          }}
        >
          {message.content}
        </Typography>
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1.5,
            opacity: 0.8,
            fontSize: '0.75rem',
            textAlign: isUser ? 'left' : 'right',
            color: isUser ? '#ffffff' : theme.palette.text.secondary,
          }}
        >
          {(message.timestamp instanceof Date 
            ? message.timestamp 
            : new Date(message.timestamp)
          ).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </Paper>
    </Box>
  );
};

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, isLoading }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        p: 3,
        background: `linear-gradient(to top, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
        borderTop: '1px solid',
        borderColor: theme.palette.divider,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="שאל אותי שאלה על הנתונים הפיננסיים..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          variant="outlined"
          size="medium"
          dir="rtl"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
              border: '2px solid',
              borderColor: theme.palette.divider,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: theme.palette.primary.light,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
              '&.Mui-focused': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: '14px 16px',
              fontSize: '0.95rem',
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          sx={{
            borderRadius: 3,
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
              transform: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress 
              size={20} 
              sx={{ color: 'inherit' }}
            />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

interface TypingIndicatorProps {
  show: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show }) => {
  const theme = useTheme();
  
  if (!show) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3, px: 1 }}>
      <Avatar 
        sx={{ 
          width: 36, 
          height: 36, 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '2px solid',
          borderColor: theme.palette.background.paper,
        }}
      >
        <AIIcon fontSize="small" />
      </Avatar>
      <Paper 
        elevation={0} 
        sx={{ 
          px: 3, 
          py: 2.5, 
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          border: '1px solid',
          borderColor: theme.palette.divider,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: -8,
            width: 0,
            height: 0,
            borderRight: '8px solid transparent',
            borderTop: '8px solid transparent',
            borderBottom: '8px solid',
            borderBottomColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
            מקליד
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, ml: 1 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                className="typing-dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: theme.palette.primary.main,
                  animation: 'typing-pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export const AIAssistant: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isOpen,
    messages,
    isLoading,
    error,
    isTyping,
    closeAssistant,
    sendMessage,
    clearMessages,
    createNewSession,
    clearError,
  } = useAIAssistantStore();

  const { language } = useUIStore();
  const isHebrew = language === 'he';

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (messageText: string) => {
    clearError();
    
    // Get current page context
    const context = {
      currentPage: window.location.pathname,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
    };

    await sendMessage(messageText, context);
  };

  const handleNewChat = () => {
    createNewSession();
    clearMessages();
  };

  if (!isOpen) return null;

  return (
    <Drawer
      anchor={isHebrew ? "left" : "right"}
      open={isOpen}
      onClose={closeAssistant}
      variant={isMobile ? 'temporary' : 'persistent'}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : DRAWER_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', // Safari support
          borderLeft: isHebrew ? 'none' : `1px solid ${theme.palette.divider}`,
          borderRight: isHebrew ? `1px solid ${theme.palette.divider}` : 'none',
          boxShadow: '0 0 40px rgba(0,0,0,0.1)',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)', // Safari support
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 20px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AIIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              עוזר חכם
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
              מסייע פיננסי אינטליגנטי
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleNewChat}
            sx={{ 
              color: 'inherit',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
            title="צ'אט חדש"
          >
            <AddIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setShowSettings(true)}
            sx={{ 
              color: 'inherit',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
            title="הגדרות"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={closeAssistant}
            sx={{ 
              color: 'inherit',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ 
            m: 3, 
            mb: 0,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'error.light',
            color: 'error.contrastText',
            '& .MuiAlert-icon': {
              color: 'error.main',
            },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Messages Area */}
      <Box
        className="messages-container"
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
            borderRadius: 3,
            '&:hover': {
              background: theme.palette.action.hover,
            },
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center',
              color: 'text.secondary',
              px: 2,
            }}
          >
            <Box
              sx={{
                p: 4,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
                border: '1px solid',
                borderColor: theme.palette.divider,
                mb: 3,
              }}
            >
              <AIIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              שלום! אני העוזר החכם שלך
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 320, mb: 4, lineHeight: 1.6 }}>
              אני יכול לעזור לך עם שאלות על הנתונים הפיננסיים, דוחות, חשבוניות ועוד.
              פשוט שאל אותי שאלה!
            </Typography>
            
            {/* Quick Questions */}
            <QuickQuestions onQuestionClick={handleSendMessage} />
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            <TypingIndicator show={isTyping} />
            
            {/* Suggested actions can be added here if needed */}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      <Divider />
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        isLoading={isLoading}
      />
      
      {/* AI Settings Dialog */}
      <AISettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Drawer>
  );
};

// Floating Action Button for opening the assistant
export const AIAssistantFab: React.FC = () => {
  const { openAssistant, isOpen } = useAIAssistantStore();
  const { language } = useUIStore();
  const isHebrew = language === 'he';
  const theme = useTheme();

  // Hide FAB when assistant is open
  if (isOpen) return null;

  return (
    <Fab
      className="ai-fab"
      onClick={openAssistant}
      sx={{
        position: 'fixed',
        bottom: 32,
        ...(isHebrew ? { left: 32 } : { right: 32 }),
        zIndex: 1200,
        width: 64,
        height: 64,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
        border: '3px solid',
        borderColor: theme.palette.background.paper,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          transform: 'translateY(-4px) scale(1.05)',
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.5)',
        },
        '&:active': {
          transform: 'translateY(-2px) scale(1.02)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: 'inherit',
          zIndex: -1,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::before': {
          opacity: 0.3,
        },
      }}
      title="פתח עוזר חכם"
    >
      <ChatIcon sx={{ fontSize: 28 }} />
    </Fab>
  );
};

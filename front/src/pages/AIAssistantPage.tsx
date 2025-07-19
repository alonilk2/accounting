import React, { useState, useRef, useEffect } from 'react';
import './AIAssistantPage.css';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Clear as ClearIcon,
  AutoAwesome as SparkleIcon,
  TrendingUp as AnalyticsIcon,
  Assessment as ReportIcon,
  People as CustomersIcon,
  ShoppingCart as OrdersIcon,
  Receipt as InvoiceIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from '@mui/icons-material';
import { useAIAssistantStore, useUIStore } from '../stores';
import type { ChatMessage } from '../types/ai';
import { textFieldStyles, buttonStyles } from '../styles/formStyles';
import MarkdownRenderer from '../components/MarkdownRenderer';
import InteractiveMessage from '../components/chat/InteractiveMessage';
import { createCustomerFormMessage, createInvoiceConfirmationMessage, createReportTypeSelectionMessage } from '../utils/interactiveMessages';

interface MessageBubbleProps {
  message: ChatMessage;
  onInteractiveAction?: (actionId: string, result?: unknown) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onInteractiveAction }) => {
  const { language } = useUIStore();
  const isUser = message.sender === 'user';
  const isHebrew = language === 'he';
  const isInteractive = message.type === 'interactive' && message.interactiveData;
  
  // For interactive messages, show full width layout
  if (isInteractive) {
    return (
      <Box
        sx={{
          width: '100%',
          mb: 3,
          px: 2,
        }}
      >
        <InteractiveMessage 
          data={message.interactiveData!}
          onAction={(actionId: string, result?: unknown) => {
            if (onInteractiveAction) {
              onInteractiveAction(actionId, result);
            }
          }}
        />
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3,
        px: 2,
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: isUser 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: '2px solid',
          borderColor: 'background.paper',
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
            : 'background.paper',
          color: isUser ? '#ffffff' : 'text.primary',
          borderRadius: 3,
          border: '1px solid',
          borderColor: isUser ? 'transparent' : 'divider',
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
        }}
      >
        {/* Message Content */}
        {isUser ? (
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              fontSize: '1rem',
              color: '#ffffff',
            }}
          >
            {message.content}
          </Typography>
        ) : (
          <MarkdownRenderer 
            content={message.content}
            sx={{
              '& p, & h1, & h2, & h3, & h4, & h5, & h6, & li, & td, & th, & blockquote, & strong, & em': {
                color: 'text.primary !important',
              },
              '& code': {
                backgroundColor: 'rgba(0,0,0,0.1) !important',
              },
              '& pre': {
                backgroundColor: 'rgba(0,0,0,0.15) !important',
              },
              fontSize: '1rem',
            }}
          />
        )}
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1.5,
            opacity: 0.8,
            fontSize: '0.75rem',
            textAlign: isUser ? 'left' : 'right',
            color: isUser ? '#ffffff' : 'text.secondary',
          }}
        >
          {(message.timestamp instanceof Date 
            ? message.timestamp 
            : new Date(message.timestamp)
          ).toLocaleTimeString(isHebrew ? 'he-IL' : 'en-US', {
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
  const { language } = useUIStore();
  const isHebrew = language === 'he';

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
        background: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder={isHebrew ? 'שאל אותי כל שאלה על העסק שלך...' : 'Ask me anything about your business...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          sx={{
            ...textFieldStyles,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1.1rem',
              backgroundColor: 'background.paper',
              minHeight: 56,
            }
          }}
        />
        <IconButton
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          sx={{
            width: 56,
            height: 56,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            '&:disabled': {
              bgcolor: 'action.disabled',
              color: 'action.disabled',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

const AIAssistantPage: React.FC = () => {
  const { language } = useUIStore();
  const isHebrew = language === 'he';
  
  const {
    messages,
    isLoading,
    error,
    sessions,
    currentSession,
    sendMessage,
    clearMessages,
    createNewSession,
    loadSession,
    deleteSession,
    loadSessions,
    setError,
    handleInteractiveAction,
    addMessage,
  } = useAIAssistantStore();

  const [sessionMenuAnchor, setSessionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [quickQuestionsExpanded, setQuickQuestionsExpanded] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message, {
        currentPage: 'ai-assistant',
        metadata: { fullPageChat: true }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError(isHebrew ? 'שגיאה בשליחת ההודעה' : 'Error sending message');
    }
  };

  // Test function for interactive messages
  const testInteractiveMessages = () => {
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add confirmation example
    const confirmationMessage: ChatMessage = {
      ...createInvoiceConfirmationMessage('שמוליק כהן', 1500),
      id: generateId(),
      timestamp: new Date()
    };
    addMessage(confirmationMessage);

    // Add form example after 2 seconds
    setTimeout(() => {
      const formMessage: ChatMessage = {
        ...createCustomerFormMessage(),
        id: generateId(),
        timestamp: new Date()
      };
      addMessage(formMessage);
    }, 2000);

    // Add selection example after 4 seconds
    setTimeout(() => {
      const selectionMessage: ChatMessage = {
        ...createReportTypeSelectionMessage(),
        id: generateId(),
        timestamp: new Date()
      };
      addMessage(selectionMessage);
    }, 4000);
  };

  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setSessionMenuAnchor(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
    setSelectedSessionId(null);
  };

  const handleDeleteSession = async () => {
    if (selectedSessionId) {
      try {
        await deleteSession(selectedSessionId);
        handleSessionMenuClose();
      } catch (error) {
        console.error('Error deleting session:', error);
        setError(isHebrew ? 'שגיאה במחיקת השיחה' : 'Error deleting session');
      }
    }
  };

  const handleNewSession = () => {
    createNewSession();
    clearMessages();
  };

  const handleSessionClick = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      setError(isHebrew ? 'שגיאה בטעינת השיחה' : 'Error loading session');
    }
  };

  const quickQuestions = [
    {
      question: isHebrew ? 'מה מצב הכספים שלי השבוע?' : 'What\'s my financial status this week?',
      icon: <AnalyticsIcon />,
    },
    {
      question: isHebrew ? 'איזה לקוחות חייבים לי הכי הרבה?' : 'Which customers owe me the most?',
      icon: <CustomersIcon />,
    },
    {
      question: isHebrew ? 'צור דוח מכירות לחודש הזה' : 'Create a sales report for this month',
      icon: <ReportIcon />,
    },
    {
      question: isHebrew ? 'הראה לי הזמנות שצריכות משלוח' : 'Show me orders that need shipping',
      icon: <OrdersIcon />,
    },
    {
      question: isHebrew ? 'איזה פריטים במלאי נמוך?' : 'Which items are low in stock?',
      icon: <InvoiceIcon />,
    },
  ];

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      backgroundColor: 'background.default',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Paper
          sx={{
            width: 320,
            height: '100%',
            borderRadius: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}>
              <AIIcon sx={{ fontSize: 32 }} />
              {isHebrew ? 'עוזר AI' : 'AI Assistant'}
            </Typography>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewSession}
              sx={buttonStyles.primary}
            >
              {isHebrew ? 'שיחה חדשה' : 'New Chat'}
            </Button>
          </Box>

          {/* Sessions List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: 'text.secondary',
            }}>
              {isHebrew ? 'שיחות קודמות' : 'Previous Chats'}
            </Typography>
            
            <List dense>
              {sessions.map((session) => (
                <ListItem key={session.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={currentSession === session.id}
                    onClick={() => handleSessionClick(session.id)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={session.title}
                      secondary={new Date(session.updatedAt).toLocaleDateString(
                        isHebrew ? 'he-IL' : 'en-US'
                      )}
                      primaryTypographyProps={{
                        sx: { fontSize: '0.9rem', fontWeight: 500 }
                      }}
                      secondaryTypographyProps={{
                        sx: { fontSize: '0.75rem' }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionMenuOpen(e, session.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Sidebar Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              sx={buttonStyles.secondary}
            >
              {isHebrew ? 'הגדרות' : 'Settings'}
            </Button>
          </Box>
        </Paper>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Chat Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 48,
                  height: 48,
                }}
              >
                <AIIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {isHebrew ? 'עוזר AI חכם' : 'Smart AI Assistant'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {isHebrew ? 'מוכן לעזור לך בכל מה שקשור לעסק' : 'Ready to help with your business'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={isHebrew ? 'רענן' : 'Refresh'}>
                <IconButton onClick={() => loadSessions()}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isHebrew ? 'נקה שיחה' : 'Clear Chat'}>
                <IconButton onClick={clearMessages}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Loading Indicator */}
          {isLoading && (
            <LinearProgress 
              sx={{ 
                mt: 2, 
                borderRadius: 1,
                height: 3,
              }} 
            />
          )}
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ m: 2, mb: 0 }}
          >
            {error}
          </Alert>
        )}

        {/* Chat Messages */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'background.default',
            position: 'relative',
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}>
              {/* Welcome Message */}
              <Box sx={{ textAlign: 'center', mb: 6, maxWidth: 600 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 3rem',
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <SparkleIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                <Typography variant="h4" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  mb: 2,
                }}>
                  {isHebrew ? 'ברוך הבא לעוזר ה-AI החכם!' : 'Welcome to Smart AI Assistant!'}
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary',
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                }}>
                  {isHebrew 
                    ? 'אני כאן לעזור לך לנהל את העסק שלך בצורה חכמה יותר. שאל אותי על מכירות, לקוחות, מלאי, דוחות ועוד...'
                    : 'I\'m here to help you manage your business smarter. Ask me about sales, customers, inventory, reports, and more...'
                  }
                </Typography>
              </Box>

              {/* Quick Questions */}
              <Card sx={{ width: '100%', maxWidth: 800 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2,
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {isHebrew ? 'שאלות מומלצות' : 'Quick Questions'}
                    </Typography>
                    <IconButton
                      onClick={() => setQuickQuestionsExpanded(!quickQuestionsExpanded)}
                      size="small"
                    >
                      {quickQuestionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={quickQuestionsExpanded}>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2,
                      mb: 3
                    }}>
                      {quickQuestions.map((item, index) => (
                        <Button
                          key={index}
                          fullWidth
                          variant="outlined"
                          startIcon={item.icon}
                          onClick={() => handleSendMessage(item.question)}
                          sx={{
                            ...buttonStyles.secondary,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            p: 2,
                            height: 'auto',
                            whiteSpace: 'normal',
                          }}
                        >
                          {item.question}
                        </Button>
                      ))}
                    </Box>
                    
                    {/* Demo Button for Interactive Messages */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={testInteractiveMessages}
                        sx={{
                          ...buttonStyles.primary,
                          backgroundColor: 'secondary.main',
                          '&:hover': {
                            backgroundColor: 'secondary.dark',
                          }
                        }}
                      >
                        🧪 {isHebrew ? 'דוגמאות אינטראקטיביות' : 'Interactive Examples'}
                      </Button>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  onInteractiveAction={(actionId: string, result?: unknown) => {
                    handleInteractiveAction(message.id, actionId, result);
                  }}
                />
              ))}
              
              {/* Loading message */}
              {isLoading && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  p: 3,
                }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {isHebrew ? 'העוזר חושב...' : 'AI is thinking...'}
                  </Typography>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </Box>

      {/* Session Context Menu */}
      <Menu
        anchorEl={sessionMenuAnchor}
        open={Boolean(sessionMenuAnchor)}
        onClose={handleSessionMenuClose}
      >
        <MenuItem onClick={handleDeleteSession}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isHebrew ? 'מחק שיחה' : 'Delete Chat'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AIAssistantPage;

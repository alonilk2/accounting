import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAIAssistantStore } from '../../stores';

interface AISettingsProps {
  open: boolean;
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ open, onClose }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [enableSuggestions, setEnableSuggestions] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  
  const {
    sessions,
    currentSession,
    loadSessions,
    deleteSession,
    loadSession,
    clearMessages,
  } = useAIAssistantStore();

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הצ\'אט הזה?')) {
      await deleteSession(sessionId);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId);
    onClose();
  };

  const handleClearHistory = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
      clearMessages();
      // Additional logic to clear all sessions can be added here
    }
  };

  React.useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open, loadSessions]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        הגדרות עוזר חכם
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          {/* Settings Section */}
          <Typography variant="h6" gutterBottom>
            הגדרות כלליות
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={enableSuggestions}
                onChange={(e) => setEnableSuggestions(e.target.checked)}
              />
            }
            label="הצג הצעות פעולה"
            sx={{ display: 'flex', justifyContent: 'space-between', ml: 0 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
              />
            }
            label="שליחה אוטומטית בלחיצת Enter"
            sx={{ display: 'flex', justifyContent: 'space-between', ml: 0 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          {/* History Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              היסטוריית צ'אטים
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'הסתר' : 'הצג'}
            </Button>
          </Box>
          
          {showHistory && (
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {sessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  אין צ'אטים שמורים
                </Typography>
              ) : (
                <List dense>
                  {sessions.map((session) => (
                    <ListItem
                      key={session.id}
                      onClick={() => handleLoadSession(session.id)}
                      sx={{
                        border: session.id === currentSession ? '1px solid' : 'none',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" noWrap>
                              {session.title || `צ'אט ${session.id.slice(-8)}`}
                            </Typography>
                            {session.id === currentSession && (
                              <Chip label="פעיל" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {session.messageCount} הודעות • {new Date(session.updatedAt).toLocaleDateString('he-IL')}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleClearHistory}
              fullWidth
            >
              מחק את כל ההיסטוריה
            </Button>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

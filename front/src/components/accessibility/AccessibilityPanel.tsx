import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Switch,
  Select,
  MenuItem,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Accessibility,
  Visibility,
  VolumeUp,
  Keyboard,
  Close,
  PlayArrow,
  Stop,
  Restore,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';
import { accessibilityService, type AccessibilitySettings } from '../../services/accessibilityService';

interface AccessibilityPanelProps {
  open: boolean;
  onClose: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ open, onClose }) => {
  const { language } = useUIStore();
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityService.getSettings());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText] = useState('');

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(accessibilityService.getSettings());
    };

    accessibilityService.addEventListener('change', handleSettingsChange);

    return () => {
      accessibilityService.removeEventListener('change', handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (open) {
      // Focus the dialog when it opens
      setTimeout(() => {
        const dialogTitle = document.querySelector('[role="dialog"] h2');
        (dialogTitle as HTMLElement)?.focus();
      }, 100);
    }
  }, [open]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    accessibilityService.updateSetting(key, value);
    
    // Announce setting change
    const settingName = getSettingName(key);
    const statusText = typeof value === 'boolean' 
      ? (value ? (language === 'he' ? 'מופעל' : 'enabled') : (language === 'he' ? 'מבוטל' : 'disabled'))
      : value;
    
    accessibilityService.announce(
      `${settingName} ${statusText}`,
      'assertive'
    );
  };

  const getSettingName = (key: keyof AccessibilitySettings): string => {
    const names: Record<keyof AccessibilitySettings, { he: string; en: string }> = {
      highContrast: { he: 'ניגודיות גבוהה', en: 'High Contrast' },
      largeText: { he: 'טקסט גדול', en: 'Large Text' },
      reduceMotion: { he: 'הפחתת תנועה', en: 'Reduce Motion' },
      screenReader: { he: 'קורא מסך', en: 'Screen Reader' },
      keyboardNavigation: { he: 'ניווט מקלדת', en: 'Keyboard Navigation' },
      voiceGuidance: { he: 'הדרכה קולית', en: 'Voice Guidance' },
      textToSpeech: { he: 'הקראת טקסט', en: 'Text to Speech' },
      focusIndicators: { he: 'מחווני פוקוס', en: 'Focus Indicators' },
      colorBlindSupport: { he: 'תמיכה בעיוורון צבעים', en: 'Color Blind Support' },
      fontSize: { he: 'גודל גופן', en: 'Font Size' },
      announcements: { he: 'הכרזות', en: 'Announcements' },
    };

    return language === 'he' ? names[key].he : names[key].en;
  };

  const handleTestSpeech = () => {
    if (isSpeaking) {
      accessibilityService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const text = testText || (language === 'he' 
        ? 'זהו טקסט לבדיקת הקראה. המערכת תקריא לכם טקסט זה בקול.'
        : 'This is a test text for speech. The system will read this text aloud to you.');
      
      accessibilityService.speak(text);
      setIsSpeaking(true);
      
      // Reset speaking state after speech ends
      setTimeout(() => {
        setIsSpeaking(false);
      }, text.length * 100); // Rough estimate
    }
  };

  const handleResetSettings = () => {
    const confirmed = window.confirm(
      language === 'he' 
        ? 'האם אתם בטוחים שברצונכם לאפס את כל הגדרות הנגישות?'
        : 'Are you sure you want to reset all accessibility settings?'
    );
    
    if (confirmed) {
      // Reset to default settings
      Object.keys(settings).forEach(key => {
        const defaultValue = key === 'keyboardNavigation' || key === 'focusIndicators' || key === 'announcements' 
          ? true 
          : key === 'fontSize' 
            ? 'medium' 
            : false;
        accessibilityService.updateSetting(key as keyof AccessibilitySettings, defaultValue as AccessibilitySettings[keyof AccessibilitySettings]);
      });
      
      accessibilityService.announce(
        language === 'he' ? 'הגדרות הנגישות אופסו' : 'Accessibility settings reset',
        'assertive'
      );
    }
  };

  const isHebrew = language === 'he';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="accessibility-panel-title"
      className="accessibility-dialog-enhanced"
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <DialogTitle id="accessibility-panel-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Accessibility color="primary" />
            <Typography variant="h6">
              {isHebrew ? 'הגדרות נגישות' : 'Accessibility Settings'}
            </Typography>
          </Box>
          <Tooltip title={isHebrew ? 'סגור' : 'Close'}>
            <IconButton
              onClick={onClose}
              aria-label={isHebrew ? 'סגור הגדרות נגישות' : 'Close accessibility settings'}
              size="small"
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          {isHebrew 
            ? 'הגדרות אלו יעזרו להתאים את המערכת לצרכי נגישות שלכם. השינויים יישמרו אוטומטית.'
            : 'These settings will help adapt the system to your accessibility needs. Changes are saved automatically.'
          }
        </Alert>

        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {/* Visual Settings */}
          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="primary" />
                {isHebrew ? 'הגדרות חזותיות' : 'Visual Settings'}
              </Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.highContrast}
                      onChange={(e) => updateSetting('highContrast', e.target.checked)}
                      aria-describedby="high-contrast-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'ניגודיות גבוהה' : 'High Contrast'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="high-contrast-desc">
                        {isHebrew 
                          ? 'צבעים בהירים על רקע כהה לקריאה טובה יותר'
                          : 'Light colors on dark background for better readability'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.largeText}
                      onChange={(e) => updateSetting('largeText', e.target.checked)}
                      aria-describedby="large-text-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'טקסט גדול' : 'Large Text'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="large-text-desc">
                        {isHebrew 
                          ? 'הגדלת גופן וריווח בין שורות'
                          : 'Increase font size and line spacing'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.focusIndicators}
                      onChange={(e) => updateSetting('focusIndicators', e.target.checked)}
                      aria-describedby="focus-indicators-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'מחווני פוקוס משופרים' : 'Enhanced Focus Indicators'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="focus-indicators-desc">
                        {isHebrew 
                          ? 'סימון בולט יותר של האלמנט הפעיל'
                          : 'More visible highlighting of the active element'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.colorBlindSupport}
                      onChange={(e) => updateSetting('colorBlindSupport', e.target.checked)}
                      aria-describedby="color-blind-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'תמיכה בעיוורון צבעים' : 'Color Blind Support'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="color-blind-desc">
                        {isHebrew 
                          ? 'שימוש בסמלים וצורות נוסף לצבעים'
                          : 'Use symbols and shapes in addition to colors'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControl sx={{ mt: 2, minWidth: 200 }}>
                  <FormLabel component="legend">
                    {isHebrew ? 'גודל גופן' : 'Font Size'}
                  </FormLabel>
                  <Select
                    value={settings.fontSize}
                    onChange={(e) => {
                      const newFontSize = e.target.value as AccessibilitySettings['fontSize'];
                      updateSetting('fontSize', newFontSize);
                      
                      // Auto-enable large text when selecting large or extra-large font sizes
                      if ((newFontSize === 'large' || newFontSize === 'extra-large') && !settings.largeText) {
                        updateSetting('largeText', true);
                      }
                    }}
                    aria-label={isHebrew ? 'בחירת גודל גופן' : 'Select font size'}
                  >
                    <MenuItem value="small">{isHebrew ? 'קטן' : 'Small'}</MenuItem>
                    <MenuItem value="medium">{isHebrew ? 'בינוני' : 'Medium'}</MenuItem>
                    <MenuItem value="large">{isHebrew ? 'גדול' : 'Large'}</MenuItem>
                    <MenuItem value="extra-large">{isHebrew ? 'גדול מאוד' : 'Extra Large'}</MenuItem>
                  </Select>
                </FormControl>
              </FormGroup>
            </Paper>
          </Grid>

          {/* Motion and Interaction Settings */}
          <Grid size={{ xs: 4, sm: 4, md: 6 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Keyboard color="primary" />
                {isHebrew ? 'הגדרות תנועה וגישה' : 'Motion and Interaction'}
              </Typography>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.reduceMotion}
                      onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
                      aria-describedby="reduce-motion-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'הפחתת תנועה' : 'Reduce Motion'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="reduce-motion-desc">
                        {isHebrew 
                          ? 'הפחתת אנימציות ומעברים'
                          : 'Reduce animations and transitions'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.keyboardNavigation}
                      onChange={(e) => updateSetting('keyboardNavigation', e.target.checked)}
                      aria-describedby="keyboard-nav-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'ניווט משופר במקלדת' : 'Enhanced Keyboard Navigation'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="keyboard-nav-desc">
                        {isHebrew 
                          ? 'תמיכה מלאה בניווט עם מקלדת'
                          : 'Full keyboard navigation support'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.screenReader}
                      onChange={(e) => updateSetting('screenReader', e.target.checked)}
                      aria-describedby="screen-reader-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'תמיכה בקורא מסך' : 'Screen Reader Support'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="screen-reader-desc">
                        {isHebrew 
                          ? 'אופטימיזציה לקוראי מסך'
                          : 'Optimization for screen readers'
                        }
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.announcements}
                      onChange={(e) => updateSetting('announcements', e.target.checked)}
                      aria-describedby="announcements-desc"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {isHebrew ? 'הכרזות המערכת' : 'System Announcements'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" id="announcements-desc">
                        {isHebrew 
                          ? 'הכרזות אוטומטיות על פעולות המערכת'
                          : 'Automatic announcements of system actions'
                        }
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </Paper>
          </Grid>

          {/* Audio Settings */}
          <Grid size={{ xs: 4, sm: 8, md: 12 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeUp color="primary" />
                {isHebrew ? 'הגדרות שמע' : 'Audio Settings'}
              </Typography>
              
              <Grid container spacing={{ xs: 1, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }} alignItems="center">
                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.textToSpeech}
                          onChange={(e) => updateSetting('textToSpeech', e.target.checked)}
                          aria-describedby="tts-desc"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            {isHebrew ? 'הקראת טקסט' : 'Text to Speech'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" id="tts-desc">
                            {isHebrew 
                              ? 'הקראה אוטומטית של טקסט'
                              : 'Automatic text reading'
                            }
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.voiceGuidance}
                          onChange={(e) => updateSetting('voiceGuidance', e.target.checked)}
                          aria-describedby="voice-guidance-desc"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">
                            {isHebrew ? 'הדרכה קולית' : 'Voice Guidance'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" id="voice-guidance-desc">
                            {isHebrew 
                              ? 'הדרכה קולית בזמן ניווט'
                              : 'Voice guidance during navigation'
                            }
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Grid>

                <Grid size={{ xs: 4, sm: 4, md: 6 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {isHebrew ? 'בדיקת הקראה' : 'Speech Test'}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleTestSpeech}
                        disabled={!settings.textToSpeech}
                        startIcon={isSpeaking ? <Stop /> : <PlayArrow />}
                        aria-label={
                          isSpeaking 
                            ? (isHebrew ? 'עצור הקראה' : 'Stop speech')
                            : (isHebrew ? 'התחל הקראה' : 'Start speech')
                        }
                      >
                        {isSpeaking 
                          ? (isHebrew ? 'עצור' : 'Stop')
                          : (isHebrew ? 'נסה' : 'Test')
                        }
                      </Button>
                      {!settings.textToSpeech && (
                        <Typography variant="caption" color="textSecondary">
                          {isHebrew 
                            ? 'יש להפעיל הקראת טקסט תחילה'
                            : 'Enable text to speech first'
                          }
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleResetSettings}
          startIcon={<Restore />}
          color="warning"
          aria-label={isHebrew ? 'אפס הגדרות נגישות' : 'Reset accessibility settings'}
        >
          {isHebrew ? 'אפס הגדרות' : 'Reset Settings'}
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          aria-label={isHebrew ? 'סגור הגדרות נגישות' : 'Close accessibility settings'}
        >
          {isHebrew ? 'סגור' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessibilityPanel;

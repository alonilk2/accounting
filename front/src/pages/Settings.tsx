import { Box, Typography, Card, CardContent, Switch, FormControlLabel, Divider } from '@mui/material';
import { useUIStore } from '../stores';

const Settings = () => {
  const { language, theme, setTheme, setLanguage } = useUIStore();

  const handleThemeChange = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLanguageChange = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        {language === 'he' ? 'הגדרות' : 'Settings'}
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {language === 'he' ? 'העדפות כלליות' : 'General Preferences'}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={handleThemeChange}
              />
            }
            label={language === 'he' ? 'מצב כהה' : 'Dark Mode'}
          />

          <Divider sx={{ my: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={language === 'he'}
                onChange={handleLanguageChange}
              />
            }
            label={language === 'he' ? 'עברית' : 'Hebrew Language'}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="textSecondary">
            {language === 'he' 
              ? 'הגדרות נוספות יתווספו בגרסאות עתידיות'
              : 'Additional settings will be added in future versions'
            }
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;

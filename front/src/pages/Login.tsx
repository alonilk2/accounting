import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Language,
} from '@mui/icons-material';
import { useAuthStore, useUIStore } from '../stores';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const { language, setLanguage } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Mock authentication - In real app, this would call your API
      if (email && password) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user and company data
        const mockUser = {
          id: 1,
          name: 'Demo User',
          email: email,
          roleId: '1',
          companyId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockCompany = {
          id: 1,
          name: 'Demo Company Ltd.',
          israelTaxId: '123456789',
          address: 'Tel Aviv, Israel',
          currency: 'ILS',
          fiscalYearStartMonth: 1,
          timeZone: 'Asia/Jerusalem',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        login(mockUser, mockCompany);
      } else {
        setError(language === 'he' ? 'אנא מלא את כל השדות' : 'Please fill in all fields');
      }
    } catch {
      setError(language === 'he' ? 'שגיאה בהתחברות' : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" textAlign="center">
              {language === 'he' ? 'התחברות' : 'Login'}
            </Typography>
            <IconButton onClick={toggleLanguage} color="primary">
              <Language />
            </IconButton>
          </Box>

          <Typography variant="body1" textAlign="center" color="textSecondary" mb={3}>
            {language === 'he' 
              ? 'מערכת הנהלת חשבונות מבוססת AI' 
              : 'AI-First Accounting Platform'
            }
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={language === 'he' ? 'אימייל' : 'Email'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              label={language === 'he' ? 'סיסמה' : 'Password'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />

            <FormControlLabel
              control={<Switch />}
              label={language === 'he' ? 'זכור אותי' : 'Remember me'}
              sx={{ mt: 1, mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 2, mb: 2 }}
            >
              {isLoading 
                ? (language === 'he' ? 'מתחבר...' : 'Signing in...') 
                : (language === 'he' ? 'התחבר' : 'Sign In')
              }
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          {/* Demo credentials */}
          <Box textAlign="center">
            <Typography variant="body2" color="textSecondary" mb={1}>
              {language === 'he' ? 'נתוני דמו:' : 'Demo credentials:'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {language === 'he' ? 'אימייל: ' : 'Email: '}demo@example.com
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {language === 'he' ? 'סיסמה: ' : 'Password: '}demo123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

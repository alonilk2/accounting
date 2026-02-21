import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Company, User } from '../types/entities';
import {
  decodeGoogleCredential,
  isGoogleAuthConfigured,
  loadGoogleIdentityScript,
  renderGoogleSignInButton,
  type GoogleCredentialResponse,
} from '../auth/googleAuth';

const createMockCompany = (): Company => ({
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
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);

  const { login } = useAuthStore();
  const { language, setLanguage } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (email && password) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockCompany = createMockCompany();
        const mockUser: User = {
          id: '1',
          name: 'Demo User',
          email,
          roleId: '1',
          companyId: String(mockCompany.id),
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

  const handleGoogleSuccess = useCallback((credentialResponse: GoogleCredentialResponse) => {
    setError('');
    setIsLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error('Missing Google credential');
      }

      const googlePayload = decodeGoogleCredential(credentialResponse.credential);
      if (!googlePayload?.email || !googlePayload.sub) {
        throw new Error('Invalid Google credential payload');
      }

      const now = new Date();
      const mockCompany = createMockCompany();
      const googleUser: User = {
        id: googlePayload.sub,
        name: googlePayload.name ?? googlePayload.email.split('@')[0],
        email: googlePayload.email,
        roleId: '1',
        companyId: String(mockCompany.id),
        createdAt: now,
        updatedAt: now,
      };

      login(googleUser, mockCompany);
    } catch {
      setError(language === 'he' ? 'התחברות עם Google נכשלה' : 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }, [language, login]);

  useEffect(() => {
    if (!isGoogleAuthConfigured || !googleButtonContainerRef.current) {
      return;
    }

    let isMounted = true;
    setIsGoogleLoading(true);

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !googleButtonContainerRef.current) {
          return;
        }

        renderGoogleSignInButton(googleButtonContainerRef.current, handleGoogleSuccess);
        setIsGoogleReady(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setIsGoogleReady(false);
        setError(language === 'he' ? 'טעינת Google נכשלה' : 'Failed to load Google sign-in.');
      })
      .finally(() => {
        if (isMounted) {
          setIsGoogleLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (googleButtonContainerRef.current) {
        googleButtonContainerRef.current.innerHTML = '';
      }
    };
  }, [handleGoogleSuccess, language]);

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

          {isGoogleAuthConfigured ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                opacity: isLoading ? 0.6 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            >
              <Box ref={googleButtonContainerRef} sx={{ minHeight: 44 }} />

              {isGoogleLoading && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  {language === 'he' ? 'טוען התחברות Google...' : 'Loading Google sign-in...'}
                </Typography>
              )}

              {!isGoogleLoading && !isGoogleReady && (
                <Alert severity="warning" sx={{ mt: 1, width: '100%' }}>
                  {language === 'he' ? 'Google לא זמין כרגע.' : 'Google sign-in is currently unavailable.'}
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              {language === 'he'
                ? 'כדי להפעיל התחברות עם Google יש להגדיר VITE_GOOGLE_CLIENT_ID.'
                : 'Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.'}
            </Alert>
          )}

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

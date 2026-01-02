import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useSearchParams } from 'react-router-dom';

// 🔧 Typography theme customization
const defaultTheme = createTheme({
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: 15, // base font size
    h4: {
      fontSize: '2.3rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.1rem',
    },
    button: {
      fontSize: '1.2rem',
      textTransform: 'none',
    },
  },
});

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [formState, setFormState] = React.useState(mode === 'signup' ? 1 : 0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else if (formState === 1) {
        const result = await handleRegister(name, username, password);
        setUsername('');
        setPassword('');
        setName('');
        setError('');
        setMessage(result || 'Registration successful! You can now sign in.');
        setOpen(true);
        // Switch to login after 2 seconds to show success message
        setTimeout(() => setFormState(0), 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />

        {/* Left Image Panel */}
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            display: { xs: 'none', sm: 'block' },
            position: 'relative',
            backgroundImage: 'url(/background.png)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
              p: 4,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome Back!
            </Typography>
            <Typography variant="body1">
              Log in to access your dashboard and manage your tasks.
            </Typography>
          </Box>
        </Grid>

        {/* Right Auth Panel */}
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: { xs: 4, sm: 8 },
              mx: { xs: 3, sm: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: { xs: 'auto', sm: '80vh' },
              justifyContent: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>

            {/* Auth Toggle */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button variant={formState === 0 ? 'contained' : 'outlined'} onClick={() => setFormState(0)}>
                Sign In
              </Button>
              <Button variant={formState === 1 ? 'contained' : 'outlined'} onClick={() => setFormState(1)}>
                Sign Up
              </Button>
            </Box>

            {/* Form Fields */}
            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
              {formState === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <Typography sx={{ color: 'red', mt: 1 }}>{error}</Typography>}

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : formState === 0 ? 'Login' : 'Register'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} message={message} />
    </ThemeProvider>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';
import { Box, Button, TextField, Typography } from '@mui/material';

const LoginSignup = () => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (tab === 'login') {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Login successful');
        navigate('/dashboard');
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await createUserWithEmailAndPassword(auth, form.email, form.password);
        toast.success('Account created! You are now logged in.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || (tab === 'login' ? 'Login failed' : 'Signup failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    
    try {
      await signInWithPopup(auth, provider);
      toast.success('Google Sign-In successful');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: 'background.paper',
          boxShadow: 3,
          borderRadius: 2,
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {tab === 'login' ? 'Login' : 'Create Account'}
        </Typography>

        <Box sx={{ display: 'flex', mb: 3 }}>
          <Button
            fullWidth
            variant={tab === 'login' ? 'contained' : 'outlined'}
            onClick={() => setTab('login')}
            sx={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              mr: -0.5
            }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant={tab === 'signup' ? 'contained' : 'outlined'}
            onClick={() => setTab('signup')}
            sx={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0
            }}
          >
            Sign Up
          </Button>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
          {tab === 'signup' && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? 'Processing...' : tab === 'login' ? 'Login' : 'Sign Up'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
          OR
        </Typography>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          
          sx={{
            mb: 2,
            textTransform: 'none',
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'text.secondary'
            }
          }}
        >
          Continue with Google
        </Button>
      </Box>
    </Box>
  );
};

export default LoginSignup;
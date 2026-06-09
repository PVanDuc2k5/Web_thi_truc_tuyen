import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container, Grow, CircularProgress } from '@mui/material';
import { School, CheckCircleOutline } from '@mui/icons-material';
import { toast } from 'sonner';


export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        const { data: profileData } = await apiClient.get('/auth/me');
        const { user } = data;
        const { profile } = profileData;

        useAuthStore.getState().login(data.session!.access_token, {
          id: user.id,
          email: user.email!,
          role: profile.role,
          username: profile.username,
        });

        setUserName(profile.username || user.email || '');
        setSuccess(true);

        setTimeout(() => {
          if (profile.role === 'teacher') {
            navigate('/teacher');
          } else {
            navigate('/student');
          }
        }, 2000);
      } catch (err) {
        setError('Failed to fetch user profile.');
        setLoading(false);
        console.error(err);
      }
    }
  };

  if (success) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          p: 3
        }}
      >
        <Grow in timeout={600}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircleOutline sx={{ fontSize: 80, color: '#10b981', mb: 3 }} />
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ letterSpacing: '-1px' }}>
              Login Successful!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400, maxWidth: 500 }}>
              Welcome back, {userName}. We're redirecting you to your dashboard...
            </Typography>
            <CircularProgress color="inherit" size={28} />
          </Box>
        </Grow>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <Grow in timeout={800}>
          <Card 
            elevation={12}
            sx={{ 
              p: 1,
              borderRadius: 3, 
              background: 'rgba(255, 255, 255, 0.85)', 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.3)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <School sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h4" fontWeight={600} gutterBottom>Online Exam System</Typography>
                <Typography variant="body2" color="text.secondary">Sign in to continue</Typography>
              </Box>
              <form onSubmit={handleLogin}>
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Don't have an account?{' '}<Button onClick={() => navigate('/register')} sx={{ textTransform: 'none' }}>Register</Button></Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grow>
      </Container>
    </Box>
  );
}
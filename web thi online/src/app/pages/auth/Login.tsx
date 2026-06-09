import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container, Grow } from '@mui/material';
import { School } from '@mui/icons-material';


export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
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

        if (profile.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      }
    }
  };

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
                <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Sign In</Button>
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
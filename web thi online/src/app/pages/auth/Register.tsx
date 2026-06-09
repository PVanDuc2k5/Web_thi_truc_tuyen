import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container, MenuItem, Grow, CircularProgress } from '@mui/material';
import { School, CheckCircleOutline } from '@mui/icons-material';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInData.session) {
          const { data: profileData } = await apiClient.get('/auth/me');
          const { user } = signInData;
          const { profile } = profileData;

          useAuthStore.getState().login(signInData.session.access_token, {
            id: user.id,
            email: user.email!,
            role: profile.role,
            username: profile.username,
          });

          setRegisteredName(profile.username || '');
          setSuccess(true);

          setTimeout(() => {
            if (profile.role === 'teacher') {
              navigate('/teacher');
            } else {
              navigate('/student');
            }
          }, 2000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to fetch user profile.');
        setLoading(false);
        console.error(err);
      }
    } else {
      setLoading(false);
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
              Registration Successful!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400, maxWidth: 500 }}>
              Welcome, {registeredName}! We're preparing your workspace and redirecting you...
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
                <Typography variant="h4" fontWeight={600} gutterBottom>Create Account</Typography>
                <Typography variant="body2" color="text.secondary">Register to get started</Typography>
              </Box>
              <form onSubmit={handleRegister}>
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                <TextField fullWidth label="Username" variant="outlined" margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
                <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                <TextField fullWidth select label="Role" value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')} margin="normal" disabled={loading}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                </TextField>
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  {loading ? 'Registering...' : 'Register'}
                </Button>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Already have an account?{' '}<Button onClick={() => navigate('/')} sx={{ textTransform: 'none' }} disabled={loading}>Sign In</Button></Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grow>
      </Container>
    </Box>
  );
}
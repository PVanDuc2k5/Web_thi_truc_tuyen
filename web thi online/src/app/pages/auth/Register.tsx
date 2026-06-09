import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container, MenuItem } from '@mui/material';
import { School } from '@mui/icons-material';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      return;
    }

    if (data.user) {
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInData.session) {
        const { data: profileData } = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${signInData.session.access_token}` }
        });
        const { user } = signInData;
        const { profile } = profileData;

        useAuthStore.getState().login(signInData.session.access_token, {
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
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <Card elevation={8}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <School sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h4" fontWeight={600} gutterBottom>Create Account</Typography>
              <Typography variant="body2" color="text.secondary">Register to get started</Typography>
            </Box>
            <form onSubmit={handleRegister}>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField fullWidth label="Username" variant="outlined" margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <TextField fullWidth select label="Role" value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')} margin="normal">
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
              </TextField>
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Register</Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Already have an account?{' '}<Button onClick={() => navigate('/')} sx={{ textTransform: 'none' }}>Sign In</Button></Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
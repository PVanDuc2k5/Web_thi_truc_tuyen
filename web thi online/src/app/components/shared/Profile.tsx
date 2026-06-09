import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Person, Lock, Email, CalendarToday } from '@mui/icons-material';
import { useAuthStore } from '../../../lib/auth-store';
import { supabase } from '../../../lib/supabase';
import apiClient from '../../../lib/api-client';

interface ProfileProps {
  username: string;
  role: 'teacher' | 'student';
  createdDate: string;
}

export default function Profile({ username: fallbackUsername, role: fallbackRole, createdDate: fallbackCreatedDate }: ProfileProps) {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [dbProfile, setDbProfile] = useState<any>(null);

  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fetch real profile information from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError('');
        const { data } = await apiClient.get('/auth/me');
        setDbProfile(data.profile);
      } catch (err: any) {
        console.error('Error fetching profile details:', err);
        setProfileError('Failed to fetch account information from backend.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Confirm password does not match!' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters long!' });
      return;
    }

    const email = user?.email;
    if (!email) {
      setStatus({ type: 'error', message: 'User email not found in active session.' });
      return;
    }

    setUpdating(true);
    try {
      // 1. Verify current password by signing in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (verifyError) {
        setStatus({ type: 'error', message: 'Current password is incorrect.' });
        setUpdating(false);
        return;
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setStatus({ type: 'error', message: updateError.message });
      } else {
        setStatus({ type: 'success', message: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Error during password update:', err);
      setStatus({ type: 'error', message: 'A system error occurred. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const username = dbProfile?.username || user?.username || fallbackUsername;
  const role = dbProfile?.role || user?.role || fallbackRole;
  const email = user?.email || 'N/A';
  const createdDate = dbProfile?.created_at 
    ? new Date(dbProfile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : fallbackCreatedDate;

  const getAvatarColor = () => {
    switch (role) {
      case 'teacher': return '#667eea';
      case 'student': return '#4facfe';
      default: return '#667eea';
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        My Profile
      </Typography>

      {profileError && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {profileError}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              {profileLoading ? (
                <Box sx={{ py: 4 }}><CircularProgress /></Box>
              ) : (
                <>
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(),
                      width: 120,
                      height: 120,
                      fontSize: 48,
                      margin: '0 auto',
                      mb: 2,
                    }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h5" fontWeight={600}>
                    {username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Account Information
                </Typography>
              </Box>

              {profileLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={username}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={email}
                      disabled
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Email color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={role.charAt(0).toUpperCase() + role.slice(1)}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Account Created"
                      value={createdDate}
                      disabled
                      variant="outlined"
                      InputProps={{
                        startAdornment: <CalendarToday color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Lock color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Change Password
                </Typography>
              </Box>

              <form onSubmit={handlePasswordChange}>
                {status && (
                  <Alert severity={status.type} sx={{ mb: 3 }}>
                    {status.message}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      required
                      type="password"
                      label="Current Password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      variant="outlined"
                      disabled={updating}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      variant="outlined"
                      disabled={updating}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      variant="outlined"
                      disabled={updating}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={updating || !oldPassword || !newPassword || !confirmPassword}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        minWidth: 150,
                      }}
                    >
                      {updating ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

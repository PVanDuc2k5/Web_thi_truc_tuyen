import { useState } from 'react';
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
} from '@mui/material';
import { Person, Lock } from '@mui/icons-material';

interface ProfileProps {
  username: string;
  role: 'teacher' | 'student';
  createdDate: string;
}

export default function Profile({ username, role, createdDate }: ProfileProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    console.log('Password change requested');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
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
                  />
                </Grid>
              </Grid>
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

              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={12}>
                  <Button
                    variant="contained"
                    onClick={handlePasswordChange}
                    disabled={!oldPassword || !newPassword || !confirmPassword}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    Update Password
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

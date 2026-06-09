import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { Person, Logout } from '@mui/icons-material';
import { useAuthStore } from '../../../lib/auth-store';

export default function UserDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate(`/${user?.role}/profile`);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const getAvatarColor = () => {
    switch (user?.role) {
      case 'teacher': return '#667eea';
      case 'student': return '#4facfe';
      default: return '#667eea';
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>{user?.username || user?.email}</Typography>
          <Typography variant="caption" fontWeight={600} sx={{ color: getAvatarColor(), textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>{user?.role}</Typography>
        </Box>
        <IconButton onClick={handleClick} size="small" sx={{ p: 0.25, border: '2px solid rgba(226, 232, 240, 0.8)', transition: 'border-color 0.2s', '&:hover': { borderColor: getAvatarColor() } }}>
          <Avatar sx={{ bgcolor: getAvatarColor(), width: 38, height: 38, fontWeight: 600, fontSize: '1rem' }}>
            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            minWidth: 200,
            overflow: 'visible',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.2,
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                color: '#4f46e5',
                '& .MuiListItemIcon-root': {
                  color: '#4f46e5',
                }
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon sx={{ transition: 'color 0.15s ease' }}><Person fontSize="small" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}>Profile</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: 'rgba(226, 232, 240, 0.8)' }} />
        <MenuItem onClick={handleLogout} sx={{ '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08) !important', color: '#ef4444 !important', '& .MuiListItemIcon-root': { color: '#ef4444 !important' } } }}>
          <ListItemIcon sx={{ transition: 'color 0.15s ease' }}><Logout fontSize="small" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import { Person, Logout } from '@mui/icons-material';

interface UserDropdownProps {
  username: string;
  role: 'teacher' | 'student';
}

export default function UserDropdown({ username, role }: UserDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate(`/${role}/profile`);
    handleClose();
  };

  const handleLogout = () => {
    navigate('/');
    handleClose();
  };

  const getAvatarColor = () => {
    switch (role) {
      case 'teacher': return '#667eea';
      case 'student': return '#4facfe';
      default: return '#667eea';
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight={600}>
            {username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {role}
          </Typography>
        </Box>
        <IconButton onClick={handleClick} size="small">
          <Avatar
            sx={{
              bgcolor: getAvatarColor(),
              width: 40,
              height: 40,
            }}
          >
            {username.charAt(0).toUpperCase()}
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
          elevation: 3,
          sx: { mt: 1.5, minWidth: 200 },
        }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

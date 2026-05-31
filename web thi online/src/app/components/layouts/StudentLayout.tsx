import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard,
  Assessment,
  School,
} from '@mui/icons-material';
import UserDropdown from '../shared/UserDropdown';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/student' },
  { text: 'My Results', icon: <Assessment />, path: '/student/results' },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          background: 'white',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Student Dashboard
          </Typography>
          <UserDropdown />
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <School sx={{ fontSize: 32 }} />
          <Typography variant="h6" fontWeight={600}>
            Exam System
          </Typography>
        </Box>

        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f5f5f5',
          p: 3,
          minHeight: '100vh',
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

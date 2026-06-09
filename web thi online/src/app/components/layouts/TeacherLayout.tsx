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
  QuestionAnswer,
  Assignment,
  School,
  Add,
} from '@mui/icons-material';
import UserDropdown from '../shared/UserDropdown';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/teacher' },
  { text: 'My Exams', icon: <Assignment />, path: '/teacher/my-exams' },
  { text: 'Question Management', icon: <QuestionAnswer />, path: '/teacher/questions' },
  { text: 'Create Exam', icon: <Add />, path: '/teacher/exam-builder' },
];

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(241, 245, 249, 1)',
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, color: '#0f172a' }}>
            Teacher Dashboard
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
            background: 'linear-gradient(180deg, #1e1b4b 0%, #0f0b29 100%)',
            color: 'white',
            borderRight: 'none',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', mb: 2 }}>
          <School sx={{ fontSize: 32, color: '#818cf8' }} />
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '0.5px' }}>
            Exam System
          </Typography>
        </Box>

        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    px: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)', 
                      minWidth: 40,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.95rem',
                      color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8fafc',
          p: 4,
          minHeight: '100vh',
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

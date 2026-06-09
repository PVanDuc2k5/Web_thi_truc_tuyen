import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import {
  People,
  Assignment,
  QuestionAnswer,
  Add,
  Edit,
  CheckCircle,
  PersonAdd,
} from '@mui/icons-material';

const stats = [
  { title: 'Total Users', value: '1,245', icon: <People />, color: '#667eea' },
  { title: 'Total Exams', value: '87', icon: <Assignment />, color: '#f093fb' },
  { title: 'Total Questions', value: '3,421', icon: <QuestionAnswer />, color: '#4facfe' },
];

const recentActivities = [
  { user: 'john_doe', action: 'Created new exam', date: '2026-04-24 10:30', icon: <Add />, color: '#667eea' },
  { user: 'jane_smith', action: 'Added 15 questions', date: '2026-04-24 09:15', icon: <QuestionAnswer />, color: '#f093fb' },
  { user: 'mike_wilson', action: 'Completed exam', date: '2026-04-24 08:45', icon: <CheckCircle />, color: '#52c41a' },
  { user: 'sarah_jones', action: 'Registered as teacher', date: '2026-04-23 16:20', icon: <PersonAdd />, color: '#4facfe' },
  { user: 'david_brown', action: 'Updated exam settings', date: '2026-04-23 14:10', icon: <Edit />, color: '#faad14' },
];

export default function AdminDashboard() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, md: 4 }} key={stat.title}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${stat.color}, ${stat.color}99)`,
                      color: 'white',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Recent Activities
        </Typography>
        <TableContainer component={Paper} elevation={2} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }} width="50"></TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentActivities.map((activity, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: activity.color,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{activity.user}</TableCell>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell color="text.secondary">{activity.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

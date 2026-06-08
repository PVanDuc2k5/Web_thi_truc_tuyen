import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  ContentCopy,
  Search,
  Assignment,
  People,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'sonner';

const myExams = [
  {
    id: 1,
    title: 'Mathematics Final Exam',
    code: 'MATH2024',
    questions: 50,
    duration: 90,
    students: 45,
    status: 'active',
    createdDate: '2026-04-10',
    attempts: 45,
  },
  {
    id: 2,
    title: 'Algebra Quiz',
    code: 'ALG2024X',
    questions: 25,
    duration: 60,
    students: 38,
    status: 'active',
    createdDate: '2026-04-15',
    attempts: 38,
  },
  {
    id: 3,
    title: 'Geometry Test',
    code: 'GEO24ABC',
    questions: 30,
    duration: 45,
    students: 42,
    status: 'draft',
    createdDate: '2026-04-20',
    attempts: 0,
  },
  {
    id: 4,
    title: 'Calculus Midterm',
    code: 'CALC2024',
    questions: 40,
    duration: 80,
    students: 35,
    status: 'active',
    createdDate: '2026-04-12',
    attempts: 35,
  },
  {
    id: 5,
    title: 'Trigonometry Quiz',
    code: 'TRIG2024',
    questions: 20,
    duration: 30,
    students: 40,
    status: 'archived',
    createdDate: '2026-03-25',
    attempts: 40,
  },
  {
    id: 6,
    title: 'Statistics Final',
    code: 'STAT2024',
    questions: 35,
    duration: 70,
    students: 33,
    status: 'active',
    createdDate: '2026-04-18',
    attempts: 33,
  },
];

const stats = [
  { title: 'Total Exams', value: '6', icon: <Assignment />, color: '#667eea' },
  { title: 'Active Exams', value: '4', icon: <CheckCircle />, color: '#52c41a' },
  { title: 'Total Students', value: '156', icon: <People />, color: '#4facfe' },
];

export default function MyExams() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Exam code "${code}" copied to clipboard!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredExams = myExams
    .filter((exam) => {
      if (filterStatus === 'all') return true;
      return exam.status === filterStatus;
    })
    .filter((exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        My Exams
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, md: 4 }} key={stat.title}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
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
                    <Typography variant="h5" fontWeight={600}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Tabs
          value={filterStatus}
          onChange={(_, newValue) => setFilterStatus(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab key="all" label="All" value="all" />
          <Tab key="active" label="Active" value="active" />
          <Tab key="draft" label="Draft" value="draft" />
          <Tab key="archived" label="Archived" value="archived" />
        </Tabs>

        <TextField
          fullWidth
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'white' }}
        />
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell fontWeight={600}>Exam Title</TableCell>
              <TableCell fontWeight={600}>Exam Code</TableCell>
              <TableCell fontWeight={600}>Questions</TableCell>
              <TableCell fontWeight={600}>Duration</TableCell>
              <TableCell fontWeight={600}>Students</TableCell>
              <TableCell fontWeight={600}>Attempts</TableCell>
              <TableCell fontWeight={600}>Status</TableCell>
              <TableCell fontWeight={600}>Created</TableCell>
              <TableCell fontWeight={600} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExams.length > 0 ? (
              filteredExams.map((exam) => (
                <TableRow key={exam.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{exam.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={exam.code}
                        sx={{
                          bgcolor: '#f5f5ff',
                          color: '#667eea',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                        }}
                        size="small"
                      />
                      <Tooltip title="Copy Code">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyCode(exam.code)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>{exam.questions}</TableCell>
                  <TableCell>{exam.duration} min</TableCell>
                  <TableCell>{exam.students}</TableCell>
                  <TableCell>{exam.attempts}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status}
                      color={getStatusColor(exam.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{exam.createdDate}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/teacher/exam/${exam.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {/* Edit removed here - users should go to exam detail to edit */}
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No exams found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

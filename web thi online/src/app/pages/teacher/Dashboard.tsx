import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Assignment, QuestionAnswer, People, Edit, Delete, Visibility, ContentCopy } from '@mui/icons-material';
import { toast } from 'sonner';

const stats = [
  { title: 'My Exams', value: '12', icon: <Assignment />, color: '#667eea' },
  { title: 'Total Questions', value: '340', icon: <QuestionAnswer />, color: '#f093fb' },
  { title: 'Total Students', value: '156', icon: <People />, color: '#4facfe' },
];

const myExams = [
  { id: 1, title: 'Mathematics Final Exam', questions: 50, students: 45, status: 'active', code: 'MATH2024' },
  { id: 2, title: 'Algebra Quiz', questions: 25, students: 38, status: 'active', code: 'ALG2024X' },
  { id: 3, title: 'Geometry Test', questions: 30, students: 42, status: 'draft', code: 'GEO24ABC' },
  { id: 4, title: 'Calculus Midterm', questions: 40, students: 35, status: 'active', code: 'CALC2024' },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Exam code "${code}" copied to clipboard!`);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Teacher Dashboard
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
          My Exams
        </Typography>
        <TableContainer component={Paper} elevation={2} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell fontWeight={600}>Exam Title</TableCell>
                <TableCell fontWeight={600}>Exam Code</TableCell>
                <TableCell fontWeight={600}>Questions</TableCell>
                <TableCell fontWeight={600}>Students</TableCell>
                <TableCell fontWeight={600}>Status</TableCell>
                <TableCell fontWeight={600} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myExams.map((exam) => (
                <TableRow key={exam.id} hover>
                  <TableCell>{exam.title}</TableCell>
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
                  <TableCell>{exam.students}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status}
                      color={exam.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
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
                    <Tooltip title="Edit">
                      <IconButton color="primary" size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../../../lib/api-client';
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
  CircularProgress,
} from '@mui/material';
import { Assignment, QuestionAnswer, People, Delete, Visibility, ContentCopy } from '@mui/icons-material';
import { toast } from 'sonner';

interface DashboardData {
  examCount: number | null;
  questionCount: number | null;
  studentCount: number;
}

interface Exam {
  id: number;
  title: string;
  code: string;
  questions: number | null;
  students: number;
  status: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData>({
    examCount: 0,
    questionCount: 0,
    studentCount: 0,
  });
  const [myExams, setMyExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);

    try {
      const [dashboardResponse, examsResponse] = await Promise.all([
        apiClient.get<DashboardData>('/teacher/getDashboard'),
        apiClient.get<{ exams: Exam[] }>('/teacher/getAllExams'),
      ]);
      setDashboard(dashboardResponse.data);
      setMyExams(examsResponse.data.exams);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải dữ liệu dashboard'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Exam code "${code}" copied to clipboard!`);
  };

  const handleDeleteExam = async (id: number) => {
    try {
      await apiClient.delete('/teacher/deleteExam', { data: { id } });
      await fetchDashboard();
      toast.success('Xóa đề thi thành công');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa đề thi'));
    }
  };

  const stats = [
    { title: 'My Exams', value: dashboard.examCount ?? 0, icon: <Assignment />, color: '#667eea' },
    { title: 'Total Questions', value: dashboard.questionCount ?? 0, icon: <QuestionAnswer />, color: '#f093fb' },
    { title: 'Total Students', value: dashboard.studentCount, icon: <People />, color: '#4facfe' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

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
              {myExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No exams found
                  </TableCell>
                </TableRow>
              )}
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
                    {/* Edit removed here - go to details page to edit */}
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => void handleDeleteExam(exam.id)}>
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

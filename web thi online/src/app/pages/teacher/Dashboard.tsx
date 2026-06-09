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
    <Box sx={{ pb: 6 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.5px', color: '#0f172a' }}>
        Teacher Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, md: 4 }} key={stat.title}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'white',
                transition: 'all 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 20px rgba(0,0,0,0.05)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}bb 100%)`,
                      color: 'white',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#0f172a', mt: 0.5 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#0f172a' }}>
          My Exams
        </Typography>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            mt: 2, 
            borderRadius: 3, 
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Exam Title</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Exam Code</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Questions</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Students</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myExams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No exams found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {myExams.map((exam) => (
                <TableRow key={exam.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 500, color: '#0f172a' }}>{exam.title}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={exam.code}
                        sx={{
                          bgcolor: 'rgba(79, 70, 229, 0.08)',
                          color: '#4f46e5',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: 0.5,
                          borderRadius: 1.5,
                        }}
                        size="small"
                      />
                      <Tooltip title="Copy Code">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyCode(exam.code)}
                          sx={{ color: '#64748b' }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#334155' }}>{exam.questions}</TableCell>
                  <TableCell sx={{ color: '#334155' }}>{exam.students}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status}
                      color={exam.status === 'active' ? 'success' : 'warning'}
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: 1.5, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => navigate(`/teacher/exam/${exam.id}`)}
                        sx={{ mr: 1 }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
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

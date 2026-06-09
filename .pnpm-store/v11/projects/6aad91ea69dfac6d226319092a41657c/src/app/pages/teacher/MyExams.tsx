import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../../../lib/api-client';
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
  CircularProgress,
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

interface Exam {
  id: number;
  title: string;
  code: string;
  questions: number | null;
  duration: number;
  students: number;
  status: string;
  created_at: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function MyExams() {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState<Exam[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchExams = async () => {
    setIsLoading(true);

    try {
      const [examsResponse, dashboardResponse] = await Promise.all([
        apiClient.get<{ exams: Exam[] }>('/teacher/getAllExams'),
        apiClient.get<{ studentCount: number }>('/teacher/getDashboard'),
      ]);
      setMyExams(examsResponse.data.exams);
      setTotalStudents(dashboardResponse.data.studentCount);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách đề thi'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchExams();
  }, []);

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

  const handleDeleteExam = async (id: number) => {
    try {
      await apiClient.delete('/teacher/deleteExam', { data: { id } });
      await fetchExams();
      toast.success('Xóa đề thi thành công');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa đề thi'));
    }
  };

  const stats = [
    { title: 'Total Exams', value: myExams.length, icon: <Assignment />, color: '#667eea' },
    { title: 'Active Exams', value: myExams.filter((exam) => exam.status === 'active').length, icon: <CheckCircle />, color: '#52c41a' },
    { title: 'Total Students', value: totalStudents, icon: <People />, color: '#4facfe' },
  ];

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
              <TableCell fontWeight={600}>Status</TableCell>
              <TableCell fontWeight={600}>Created</TableCell>
              <TableCell fontWeight={600} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filteredExams.length > 0 ? (
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
                  <TableCell>
                    <Chip
                      label={exam.status}
                      color={getStatusColor(exam.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
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
                      <IconButton color="error" size="small" onClick={() => void handleDeleteExam(exam.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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

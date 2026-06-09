import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  Alert,
  Paper,
} from '@mui/material';
import { PlayArrow, CheckCircle, Schedule, Search, VpnKey, Add } from '@mui/icons-material';

// Import supabase từ thư mục lib
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';

// Khai báo kiểu dữ liệu cho Exam để code không báo lỗi
interface Exam {
  id: number;
  title: string;
  questions: number;
  duration: number;
  status: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State khởi tạo bằng mảng rỗng, sẽ được lấp đầy khi gọi DB
  const [examList, setExamList] = useState<Exam[]>([]);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [examCode, setExamCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // 🔄 KÉO DATA THẬT 100% TỪ SUPABASE
  useEffect(() => {
    const fetchExamsAndStatus = async () => {
      try {
        if (!user || !user.id) return;

        // 1. Kéo TOÀN BỘ danh sách đề thi từ bảng exams
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*'); // Lấy id, title, duration...

        if (examsError) {
          console.error("Lỗi lấy danh sách đề thi:", examsError);
          return;
        }

        // 2. Kéo danh sách ĐIỂM của học sinh này từ bảng results
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select('exam_id')
          .eq('user_id', user.id);

        if (resultsError) {
          console.error("Lỗi lấy điểm:", resultsError);
          return;
        }

        const safeResults = resultsData || [];
        const completedExamIds = safeResults.map(result => Number(result.exam_id));

        // 3. Lắp ghép 2 dữ liệu lại với nhau
        const formattedExams = (examsData || []).map(exam => ({
          id: exam.id,
          title: exam.title,
          // Nếu bảng exams của bạn chưa có cột số lượng câu hỏi, tạm để 50
          questions: exam.total_questions || 50, 
          duration: exam.duration,
          status: completedExamIds.includes(exam.id) ? 'completed' : 'not_started'
        }));

        setExamList(formattedExams);

      } catch (error) {
        console.error('Lỗi ngầm trong useEffect:', error);
      }
    };

    fetchExamsAndStatus();
  }, [user]);

  // 🔍 TÍNH NĂNG NHẬP MÃ TÌM ĐỀ THI (REAL DATA)
  const handleJoinExam = async () => {
    setJoinError('');
    setJoinSuccess('');

    if (!examCode.trim()) {
      setJoinError('Vui lòng nhập mã đề thi!');
      return;
    }

    try {
      // Tìm đề thi có mã code tương ứng trong bảng exams
      const { data: exam, error } = await supabase
        .from('exams')
        .select('id, title')
        .eq('code', examCode.toUpperCase())
        .single();

      if (error || !exam) {
        setJoinError('Mã đề thi không tồn tại. Vui lòng kiểm tra lại!');
        return;
      }

      setJoinSuccess(`Đã tìm thấy: ${exam.title}! Đang chuyển vào phòng thi...`);
      setExamCode('');
      
      // Chuyển hướng sau 1.5 giây
      setTimeout(() => {
        navigate(`/student/exam/${exam.id}`);
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi tra mã:', err);
      setJoinError('Hệ thống đang bận, vui lòng thử lại sau.');
    }
  };

  const filteredExams = examList
    .filter(exam => {
      if (filterStatus === 'all') return true;
      return exam.status === filterStatus;
    })
    .filter(exam =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Chip label="Not Started" color="default" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="warning" size="small" />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      default:
        return null;
    }
  };

  const getActionButton = (exam: Exam) => {
    if (exam.status === 'not_started') {
      return (
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={() => navigate(`/student/exam/${exam.id}`)}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          Start Exam
        </Button>
      );
    } else if (exam.status === 'in_progress') {
      return (
        <Button
          variant="contained"
          color="warning"
          startIcon={<Schedule />}
          onClick={() => navigate(`/student/exam/${exam.id}`)}
        >
          Continue
        </Button>
      );
    } else {
      return (
        <Button
          variant="outlined"
          startIcon={<CheckCircle />}
          onClick={() => navigate(`/student/result/${exam.id}`)}
        >
          View Result
        </Button>
      );
    }
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={12}>
          <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VpnKey />
              <Typography variant="h6" fontWeight={600}>
                Join Exam with Code
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Enter the exam code provided by your teacher to access the exam
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                placeholder="Enter Exam Code (e.g., MATH2024)"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinExam()}
                sx={{
                  flex: 1,
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { border: 'none' },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKey />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={handleJoinExam}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  px: 3,
                }}
              >
                Join Exam
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {joinSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setJoinSuccess('')}>
          {joinSuccess}
        </Alert>
      )}

      {joinError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setJoinError('')}>
          {joinError}
        </Alert>
      )}

      <Typography variant="h4" fontWeight={600} gutterBottom>
        Available Exams
      </Typography>

      <Box sx={{ mt: 3, mb: 3 }}>
        <Tabs
          value={filterStatus}
          onChange={(_, newValue) => setFilterStatus(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab key="all" label="All" value="all" />
          <Tab key="not_started" label="Not Started" value="not_started" />
          <Tab key="in_progress" label="In Progress" value="in_progress" />
          <Tab key="completed" label="Completed" value="completed" />
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

      <Grid container spacing={3}>
        {filteredExams.map((exam) => (
          <Grid size={{ xs: 12, md: 6 }} key={exam.id}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {exam.title}
                  </Typography>
                  {getStatusChip(exam.status)}
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Questions:</strong> {exam.questions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Duration:</strong> {exam.duration} min
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                {getActionButton(exam)}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
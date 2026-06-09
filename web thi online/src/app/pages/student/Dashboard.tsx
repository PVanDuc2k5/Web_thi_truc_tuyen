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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  
  const [examCode, setExamCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  
  // State for Waiting Room
  const [waitingExam, setWaitingExam] = useState<{ id: number; title: string; startTime: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Countdown logic for exams that haven't started
  useEffect(() => {
    if (!waitingExam) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(waitingExam.startTime).getTime();
      const distance = startTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        setWaitingExam(null);
        navigate(`/student/exam/${waitingExam.id}`);
      } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [waitingExam, navigate]);

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
        .select('id, title, start_time, end_time')
        .eq('code', examCode.toUpperCase())
        .single();

      if (error || !exam) {
        setJoinError('Mã đề thi không tồn tại. Vui lòng kiểm tra lại!');
        return;
      }

      const now = new Date().getTime();
      const startTime = exam.start_time ? new Date(exam.start_time).getTime() : 0;
      const endTime = exam.end_time ? new Date(exam.end_time).getTime() : 0;

      if (endTime && now > endTime) {
        setJoinError('Bài thi đã kết thúc. Bạn không thể tham gia nữa!');
        return;
      }

      if (startTime && now < startTime) {
        setWaitingExam({ id: exam.id, title: exam.title, startTime: exam.start_time });
        setExamCode('');
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

      {/* Waiting Room Modal */}
      <Dialog open={!!waitingExam} onClose={() => setWaitingExam(null)}>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Phòng Chờ Thi</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4, minWidth: 350 }}>
          <Schedule sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>{waitingExam?.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chưa đến giờ làm bài. Bài thi sẽ tự động bắt đầu khi đồng hồ đếm ngược kết thúc.
          </Typography>
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
            <Typography variant="h3" fontWeight={700} color="primary" sx={{ fontFamily: 'monospace' }}>
              {countdown}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="outlined" onClick={() => setWaitingExam(null)}>Thoát</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
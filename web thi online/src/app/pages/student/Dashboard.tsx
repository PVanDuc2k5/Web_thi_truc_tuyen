import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { 
  CheckCircle, 
  Schedule, 
  VpnKey, 
  Add, 
  Stars, 
  ShowChart,
  ArrowForward,
  EmojiEvents
} from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [examCode, setExamCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedCount: 0,
    avgScore: 0,
    latestExamTitle: 'N/A',
    latestExamId: null as number | null,
    latestScore: null as number | null,
  });
  
  // State for Waiting Room
  const [waitingExam, setWaitingExam] = useState<{ id: number; title: string; startTime: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('results')
          .select(`
            id,
            score,
            exam_id,
            exams (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error("Lỗi khi kéo thống kê:", error);
          return;
        }

        if (data && data.length > 0) {
          const completedCount = data.length;
          const totalScore = data.reduce((sum, item) => sum + (item.score || 0), 0);
          const avgScore = Number((totalScore / completedCount).toFixed(1));
          
          const latest = data[0];
          setStats({
            completedCount,
            avgScore,
            latestExamTitle: latest.exams?.title || 'Unknown Exam',
            latestExamId: latest.exam_id,
            latestScore: latest.score,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentStats();
  }, [user]);

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

  const handleJoinExam = async () => {
    setJoinError('');
    setJoinSuccess('');

    if (!examCode.trim()) {
      setJoinError('Vui lòng nhập mã đề thi!');
      return;
    }

    try {
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
      
      setTimeout(() => {
        navigate(`/student/exam/${exam.id}`);
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi tra mã:', err);
      setJoinError('Hệ thống đang bận, vui lòng thử lại sau.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Welcome Banner */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
          color: 'white',
          borderRadius: 4,
          mb: 4,
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
          Welcome back, {user?.username || 'Student'}! 👋
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px' }}>
          Ready to showcase your knowledge today? Join an active exam using your access code below or check your academic growth statistics.
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex' }}>
                <CheckCircle sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Exams Completed</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>{stats.completedCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex' }}>
                <ShowChart sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Average Score</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>{stats.avgScore}/10</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              transition: 'all 0.3s ease-in-out',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.05)' }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex' }}>
                <Stars sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Last Score</Typography>
                <Typography variant="h5" fontWeight={700} noWrap sx={{ color: '#0f172a' }}>
                  {stats.latestScore !== null ? `${stats.latestScore}/10` : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Join Exam */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <VpnKey sx={{ color: '#4f46e5', fontSize: 28 }} />
                <Typography variant="h5" fontWeight={600} sx={{ color: '#0f172a' }}>
                  Join Exam Code
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter the access code provided by your course instructor to start your exam session. Make sure you are in a quiet environment.
              </Typography>
              
              {joinError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{joinError}</Alert>}
              {joinSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{joinSuccess}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="EXAM2026"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinExam()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: '#f8fafc',
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleJoinExam}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)',
                    }
                  }}
                >
                  Enter Exam Room
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Performance Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4, 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <EmojiEvents sx={{ color: '#f59e0b', fontSize: 28 }} />
                <Typography variant="h5" fontWeight={600} sx={{ color: '#0f172a' }}>
                  Latest Attempt
                </Typography>
              </Box>
              
              {stats.latestExamId ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, mt: 1 }}>
                  <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid rgba(226, 232, 240, 0.5)', mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1e293b', mb: 1 }}>
                      {stats.latestExamTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Submitted Grade</Typography>
                      <Typography variant="h6" fontWeight={700} color={stats.latestScore && stats.latestScore >= 6 ? 'success.main' : 'error.main'}>
                        {stats.latestScore}/10
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(`/student/result/${stats.latestExamId}`)}
                    sx={{
                      alignSelf: 'flex-start',
                      borderRadius: 3.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderColor: '#4f46e5',
                      color: '#4f46e5',
                      '&:hover': {
                        borderColor: '#4338ca',
                        backgroundColor: 'rgba(99, 102, 241, 0.04)'
                      }
                    }}
                  >
                    Review Detailed Answer Sheet
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No exam attempts found yet. Use an exam code to start your first test!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
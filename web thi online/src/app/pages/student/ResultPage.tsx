import { useLocation, useNavigate, useParams } from 'react-router';
import { Box, Typography, Paper, Button, Divider, Card, CardContent } from '@mui/material';
import { Home, Replay, AssignmentTurnedIn } from '@mui/icons-material';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId } = useParams();
  
  // Lấy dữ liệu điểm số được truyền từ trang ExamPage sang
  const { result, examTitle } = location.state || { 
    result: { score: 0, correctCount: 0, totalQuestions: 0 }, 
    examTitle: 'Kết quả bài thi' 
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 10, p: 2 }}>
      <Paper elevation={4} sx={{ p: 5, borderRadius: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
        <AssignmentTurnedIn sx={{ fontSize: 80, color: 'rgb(22, 119, 185)', mb: 2 }} />
        
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: "'Palatino Linotype', Palatino, serif", mb: 1 }}>
          {examTitle}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Chúc mừng bạn đã hoàn thành bài thi!
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 10, mb: 5 }}>
          <Box>
            <Typography variant="h6" color="text.secondary">Số câu đúng</Typography>
            <Typography variant="h3" fontWeight={800} color="rgb(22, 119, 185)">
              {result.correctCount} <span style={{ fontSize: '20px', color: '#999' }}>/ {result.totalQuestions}</span>
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" color="text.secondary">Điểm số</Typography>
            <Typography variant="h1" fontWeight={900} sx={{ color: 'rgb(22, 119, 185)' }}>
              {result.score}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button 
            variant="contained" 
            startIcon={<Home />}
            onClick={() => navigate('/student/dashboard')}
            sx={{ bgcolor: 'rgb(22, 119, 185)', px: 4, py: 1.5, borderRadius: 2 }}
          >
            Về Trang Chủ
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Replay />}
            onClick={() => navigate(`/student/exam/${examId}`)}
            sx={{ color: 'rgb(22, 119, 185)', borderColor: 'rgb(22, 119, 185)', px: 4, py: 1.5, borderRadius: 2 }}
          >
            Thi Lại
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
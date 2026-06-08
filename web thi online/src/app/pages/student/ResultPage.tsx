import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, Home } from '@mui/icons-material';

const mockResults = {
  examTitle: 'Mathematics Final Exam',
  totalQuestions: 5,
  correctAnswers: 4,
  incorrectAnswers: 1,
  // score will be calculated as (correct / total) * 10
  answers: [
    { question: 'What is 2 + 2?', userAnswer: '4', correctAnswer: '4', isCorrect: true },
    { question: 'What is the capital of France?', userAnswer: 'Paris', correctAnswer: 'Paris', isCorrect: true },
    { question: 'Which planet is closest to the sun?', userAnswer: 'Venus', correctAnswer: 'Mercury', isCorrect: false },
    { question: 'Who wrote Romeo and Juliet?', userAnswer: 'William Shakespeare', correctAnswer: 'William Shakespeare', isCorrect: true },
    { question: 'What is the largest ocean on Earth?', userAnswer: 'Pacific', correctAnswer: 'Pacific', isCorrect: true },
  ],
};

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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="primary">
                {((mockResults.correctAnswers / mockResults.totalQuestions) * 10).toFixed(1)} / 10
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Final Score (out of 10)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600}>
                {mockResults.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2} sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="success.main">
                {mockResults.correctAnswers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Correct Answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2} sx={{ bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="error.main">
                {mockResults.incorrectAnswers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Incorrect Answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
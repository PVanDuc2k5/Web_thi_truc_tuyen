import { useNavigate, useParams, useLocation } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { Home, Replay, AssignmentTurnedIn } from '@mui/icons-material';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId } = useParams();

  // Lấy dữ liệu điểm số được truyền từ trang ExamPage sang
  const { result, examTitle } = (location.state as any) || {
    result: { score: 0, correctCount: 0, totalQuestions: 0 },
    examTitle: 'Kết quả bài thi',
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

        <Grid container spacing={3} justifyContent="center" sx={{ mb: 5 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={900} sx={{ color: 'rgb(22, 119, 185)' }}>
                  {result.score}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Điểm số (thang 10)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2} sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={600} color="success.main">
                  {result.correctCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Câu đúng
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={2} sx={{ bgcolor: '#ffebee' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={600} color="error.main">
                  {result.totalQuestions - result.correctCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Câu sai
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Tổng số câu: <strong>{result.totalQuestions}</strong>
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate('/student')}
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
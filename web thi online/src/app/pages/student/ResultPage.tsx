import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Home, Replay, AssignmentTurnedIn } from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuthStore();

  const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);
  const [examTitle, setExamTitle] = useState('Kết quả bài thi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state && (location.state as any).result) {
      const state = location.state as any;
      setResult(state.result);
      setExamTitle(state.examTitle || 'Kết quả bài thi');
      setLoading(false);
    } else {
      const fetchResult = async () => {
        try {
          setLoading(true);
          setError('');

          if (!user) {
            setError('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
            return;
          }

          const numericExamId = Number(examId);
          if (isNaN(numericExamId)) {
            setError('Mã đề thi không hợp lệ.');
            return;
          }

          // 1. Fetch user's latest result for this exam
          const { data: resultData, error: resultError } = await supabase
            .from('results')
            .select(`
              id,
              score,
              exams (
                title
              )
            `)
            .eq('user_id', user.id)
            .eq('exam_id', numericExamId)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (resultError) throw resultError;
          
          if (!resultData) {
            setError('Bạn chưa thực hiện bài thi này, hoặc kết quả bài thi chưa được lưu.');
            return;
          }

          setExamTitle(resultData.exams?.title || 'Kết quả bài thi');

          // 2. Fetch user's detailed answers to count correct ones
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select(`
              answer_id,
              answers (
                is_correct
              )
            `)
            .eq('result_id', resultData.id);

          if (answersError) throw answersError;

          // 3. Fetch total questions count for this exam
          const { data: examQuestions, error: eqError } = await supabase
            .from('exam_questions')
            .select('question_id')
            .eq('exam_id', numericExamId);

          if (eqError) throw eqError;

          const totalQuestions = examQuestions?.length || 0;
          const correctCount = userAnswers?.filter((ua: any) => ua.answers?.is_correct === true).length || 0;

          setResult({
            score: resultData.score,
            correctCount,
            totalQuestions,
          });
        } catch (err: any) {
          console.error('Lỗi khi tải chi tiết kết quả:', err);
          setError('Không thể tải kết quả bài thi từ máy chủ.');
        } finally {
          setLoading(false);
        }
      };

      fetchResult();
    }
  }, [location.state, examId, user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={50} style={{ color: 'rgb(22, 119, 185)' }} />
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 10, p: 2 }}>
        <Alert severity="error" variant="filled" sx={{ mb: 4 }}>
          {error || 'Đã xảy ra lỗi không xác định khi tải kết quả.'}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/student')}
            sx={{ bgcolor: 'rgb(22, 119, 185)', px: 4, py: 1.5 }}
          >
            Quay lại Trang Chủ
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 6, p: 2 }}>
      <Paper elevation={4} sx={{ p: 5, borderRadius: 3, textAlign: 'center', border: '1px solid #e0e0e0', bgcolor: 'white' }}>
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
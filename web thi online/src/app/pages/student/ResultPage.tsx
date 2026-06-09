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
  Chip,
  Divider,
} from '@mui/material';
import { Home, Replay, AssignmentTurnedIn, CheckCircle, Cancel } from '@mui/icons-material';
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
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswersMap, setUserAnswersMap] = useState<{ [key: number]: number | null }>({});

  useEffect(() => {
    // If state is passed, populate result immediately to avoid blank screen
    if (location.state && (location.state as any).result) {
      const state = location.state as any;
      setResult(state.result);
      setExamTitle(state.examTitle || 'Kết quả bài thi');
    }

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

        // 2. Fetch user's detailed answers (avoid relationship cache joins)
        const { data: userAnswers, error: answersError } = await supabase
          .from('user_answers')
          .select('question_id, answer_id')
          .eq('result_id', resultData.id);

        if (answersError) throw answersError;

        const answersMap: { [key: number]: number | null } = {};
        userAnswers?.forEach((ua: any) => {
          answersMap[ua.question_id] = ua.answer_id;
        });
        setUserAnswersMap(answersMap);

        // 3. Fetch all questions and answers for this exam
        const { data: examQuestions, error: eqError } = await supabase
          .from('exam_questions')
          .select(`
            questions (
              id,
              content,
              answers (
                id,
                content,
                is_correct
              )
            )
          `)
          .eq('exam_id', numericExamId);

        if (eqError) throw eqError;

        const qs = (examQuestions || [])
          .map((eq: any) => eq.questions)
          .filter(Boolean);
        
        setQuestions(qs);

        const totalQuestions = qs.length || userAnswers?.length || 0;

        // Fetch correctness of chosen answers directly from the answers table
        const chosenAnswerIds = (userAnswers || [])
          .map((ua: any) => ua.answer_id)
          .filter(Boolean);

        let correctCount = 0;
        if (chosenAnswerIds.length > 0) {
          const { data: correctAnswers, error: correctAnswersError } = await supabase
            .from('answers')
            .select('id, is_correct')
            .in('id', chosenAnswerIds);

          if (!correctAnswersError && correctAnswers) {
            correctCount = correctAnswers.filter((a: any) => a.is_correct === true).length;
          }
        }

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
  }, [examId, user]);

  if (loading && !result) {
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
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 6, p: 2 }}>
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

      {/* Answer review sheet section */}
      {questions.length > 0 && (
        <Box sx={{ mt: 5, mb: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentTurnedIn color="primary" /> Chi tiết bài làm
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Xem lại các câu hỏi và so sánh câu trả lời của bạn với đáp án đúng.
          </Typography>

          {questions.map((question, index) => {
            const studentChosenAnswerId = userAnswersMap[question.id];
            
            return (
              <Paper key={question.id} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                    Câu {index + 1}:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {question.content}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {question.answers?.map((ans: any) => {
                    const isCorrectAnswer = ans.is_correct === true;
                    const isStudentChosen = studentChosenAnswerId === ans.id;

                    let cardBg = 'transparent';
                    let borderCol = '#e0e0e0';
                    let textColor = 'text.primary';

                    if (isCorrectAnswer) {
                      cardBg = '#e8f5e9'; // Light green for correct answer
                      borderCol = '#4caf50';
                    } else if (isStudentChosen && !isCorrectAnswer) {
                      cardBg = '#ffebee'; // Light red for wrong answer chosen
                      borderCol = '#f44336';
                    }

                    return (
                      <Grid size={12} key={ans.id}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: cardBg,
                            borderColor: borderCol,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: isStudentChosen || isCorrectAnswer ? 600 : 400 }}>
                            {ans.content}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isCorrectAnswer && (
                              <Chip 
                                icon={<CheckCircle style={{ color: 'white' }} />} 
                                label="Đáp án đúng" 
                                color="success" 
                                size="small" 
                                variant="filled" 
                              />
                            )}
                            {isStudentChosen && !isCorrectAnswer && (
                              <Chip 
                                icon={<Cancel style={{ color: 'white' }} />} 
                                label="Bạn chọn (Sai)" 
                                color="error" 
                                size="small" 
                                variant="filled" 
                              />
                            )}
                            {isStudentChosen && isCorrectAnswer && (
                              <Chip 
                                icon={<CheckCircle style={{ color: 'white' }} />} 
                                label="Bạn chọn (Đúng)" 
                                color="success" 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
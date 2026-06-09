import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import {
  Box, Typography, Paper, RadioGroup, FormControlLabel, Radio,
  Button, LinearProgress, Card, CardContent, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { NavigateBefore, NavigateNext, Send, Warning, CheckCircleOutline } from '@mui/icons-material';
import { supabase } from '../../../lib/supabase';

interface Answer { id: number; content: string; }
interface Question { id: number; content: string; answers: Answer[]; }
interface Exam { id: number; title: string; duration: number; }

export default function ExamPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuthStore();
  
  const [tabSwitches, setTabSwitches] = useState(0);
  const tabSwitchesRef = useRef(0);
  const lastViolationTime = useRef<number>(0);
  
  const safeExamId = examId || "1";
  const draftKey = `exam_draft_${safeExamId}`;
  const timeKey = `exam_time_${safeExamId}`;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [answers, setAnswers] = useState<{ [key: number]: number }>(() => {
    const savedAnswers = localStorage.getItem(draftKey);
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number, correctCount: number, totalQuestions: number } | null>(null);

  // Modal/Dialog states
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [interactionWarningOpen, setInteractionWarningOpen] = useState(false);
  const [interactionWarningMessage, setInteractionWarningMessage] = useState('');

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const resultRef = useRef(result);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const handleSubmitRef = useRef<any>(null);

  // Fetch exam data and security checks
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          const { data: existingResult } = await supabase
            .from('results')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('exam_id', safeExamId)
            .single();

          if (existingResult) {
            // If already submitted, redirect directly to result details sheet
            navigate(`/student/result/${safeExamId}`);
            return;
          }
        }

        const { data } = await apiClient.get(`/student/exam/${safeExamId}`);
        setExam(data.exam);
        setQuestions(data.questions);

        const savedTime = localStorage.getItem(timeKey);
        if (savedTime) {
          setTimeLeft(parseInt(savedTime, 10));
        } else {
          setTimeLeft(data.exam.duration * 60);
        }
      } catch (err: any) {
        if (err.code !== 'PGRST116') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamData();
  }, [safeExamId, timeKey, navigate]);

  // Sync draft answers
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    }
  }, [answers, draftKey]);

  // Sync time remaining
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      localStorage.setItem(timeKey, timeLeft.toString());
    }
  }, [timeLeft, timeKey, loading]);

  // Timer countdown loop
  useEffect(() => {
    if (loading || timeLeft <= 0 || result || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (handleSubmitRef.current) {
            handleSubmitRef.current(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, isSubmitting]);

  // Anti-cheating event handlers
  useEffect(() => {
    if (loading || result || isSubmitting) return;

    const triggerViolation = () => {
      if (isSubmittingRef.current || resultRef.current) return;
      
      const now = Date.now();
      // 2-second cooldown to block multi-blur focus issues
      if (now - lastViolationTime.current < 2000) return;
      lastViolationTime.current = now;

      tabSwitchesRef.current += 1;
      const count = tabSwitchesRef.current;
      setTabSwitches(count);
      
      if (count >= 3) {
        setWarningMessage('CẢNH BÁO CỰC KỲ NGHIÊM TRỌNG: Bạn đã rời khỏi phòng thi hoặc chuyển tab 3 lần. Bài thi sẽ tự động được nộp ngay bây giờ!');
        setWarningOpen(true);
        if (handleSubmitRef.current) {
          handleSubmitRef.current(true);
        }
      } else {
        setWarningMessage(`CẢNH BÁO CHỐNG GIAN LẬN: Bạn không được phép chuyển tab hoặc rời màn hình làm bài! (Số lần vi phạm: ${count}/3)`);
        setWarningOpen(true);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setInteractionWarningMessage('Không được phép sử dụng chuột phải trong quá trình làm bài thi!');
      setInteractionWarningOpen(true);
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setInteractionWarningMessage('Không được phép sao chép hoặc dán nội dung trong quá trình làm bài thi!');
      setInteractionWarningOpen(true);
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus()) {
          triggerViolation();
        }
      }, 200);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loading, result, isSubmitting]);

  // Submit action handler
  const handleSubmit = async (isForced = false) => {
    if (!exam || isSubmitting) return;

    if (!user) {
      setInteractionWarningMessage('Lỗi: Không tìm thấy thông tin sinh viên. Vui lòng quay lại trang Đăng nhập!');
      setInteractionWarningOpen(true);
      navigate('/');
      return;
    }
    
    const forced = isForced === true;
    
    if (!forced && timeLeft > 0) {
      setSubmitDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentAnswers = answersRef.current;
      const answersPayload = Object.entries(currentAnswers).map(([qId, aId]) => ({
        questionId: Number(qId),
        answerId: Number(aId)
      }));

      const payload = {
        userId: user.id,
        examId: exam.id,
        answers: answersPayload
      };

      const { data } = await apiClient.post('/student/submit', payload);
      setResult(data);

      localStorage.removeItem(draftKey);
      localStorage.removeItem(timeKey);
    } catch (error) {
      setInteractionWarningMessage('Có lỗi xảy ra khi nộp bài!');
      setInteractionWarningOpen(true);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress style={{color: 'rgb(22, 119, 185)'}} /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'error.main', typography: 'h6' }}>{error}</Box>;
  if (questions.length === 0) return <Box sx={{ p: 4, textAlign: 'center' }}>Chưa có câu hỏi nào trong đề này.</Box>;

  // Result view layout
  if (result) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 4, textAlign: 'center', bgcolor: 'white', borderRadius: 2, boxShadow: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="h3" fontWeight={700} sx={{ color: 'rgb(22, 119, 185)', fontFamily: "'Palatino Linotype', Palatino, serif", mb: 3 }}>
          Hoàn thành bài thi!
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Số câu đúng: <strong>{result.correctCount} / {result.totalQuestions}</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary">Điểm tổng kết:</Typography>
        <Typography variant="h1" fontWeight={900} sx={{ color: 'rgb(22, 119, 185)', mt: 1, mb: 4 }}>
          {result.score}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/student')}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
        >
          Quay lại Trang chủ
        </Button>
      </Box>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header Panel */}
      <Card elevation={3} sx={{ mb: 3, backgroundColor: 'rgb(22, 119, 185)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}>
                {exam?.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Câu hỏi {currentQuestion + 1} / {questions.length}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255,255,255,0.15)', px: 3, py: 1.5, borderRadius: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="caption" sx={{ mt: 0.5 }}>Thời gian còn lại</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Question sheet container */}
      <Paper elevation={2} sx={{ p: 4, minHeight: '55vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 4 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 1, '& .MuiLinearProgress-bar': { backgroundColor: 'rgb(22, 119, 185)' } }} />
        </Box>

        <Box sx={{ mb: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, borderLeft: '4px solid rgb(22, 119, 185)' }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}>
            {currentQ.content}
          </Typography>
        </Box>

        <RadioGroup
          value={answers[currentQ.id]?.toString() || ''}
          onChange={(e) => setAnswers({ ...answers, [currentQ.id]: Number(e.target.value) })}
          sx={{ flexGrow: 1 }}
        >
          {currentQ.answers.map((ans) => (
            <Paper
              key={ans.id}
              variant="outlined"
              sx={{
                mb: 2, p: 1.5, cursor: 'pointer', transition: 'all 0.2s',
                '&:hover': { bgcolor: '#f0f7fb', borderColor: 'rgb(22, 119, 185)' },
                bgcolor: answers[currentQ.id] === ans.id ? '#e3f2fd' : 'transparent',
                borderColor: answers[currentQ.id] === ans.id ? 'rgb(22, 119, 185)' : '#e0e0e0',
              }}
              onClick={() => setAnswers({ ...answers, [currentQ.id]: ans.id })}
            >
              <FormControlLabel
                value={ans.id.toString()}
                control={<Radio sx={{ color: 'rgb(22, 119, 185)', '&.Mui-checked': { color: 'rgb(22, 119, 185)' } }} />}
                label={<Typography sx={{ fontWeight: 500 }}>{ans.content}</Typography>}
                sx={{ width: '100%', m: 0 }}
              />
            </Paper>
          ))}
        </RadioGroup>

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            sx={{ color: 'rgb(22, 119, 185)', borderColor: 'rgb(22, 119, 185)', '&:hover': { borderColor: 'rgb(18, 95, 148)', bgcolor: 'rgba(22, 119, 185, 0.04)' } }}
          >
            Câu trước
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<Send />}
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              sx={{ backgroundColor: 'rgb(22, 119, 185)', '&:hover': { backgroundColor: 'rgb(18, 95, 148)' } }}
            >
              {isSubmitting ? 'Đang chấm...' : 'Nộp Bài'}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              sx={{ backgroundColor: 'rgb(22, 119, 185)', '&:hover': { backgroundColor: 'rgb(18, 95, 148)' } }}
            >
              Câu tiếp
            </Button>
          )}
        </Box>
      </Paper>

      {/* Cheating Violation warning Dialog */}
      <Dialog 
        open={warningOpen} 
        onClose={() => setWarningOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 2, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 700 }}>
          <Warning sx={{ fontSize: 32 }} /> Cảnh báo Vi phạm
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6 }}>
            {warningMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => setWarningOpen(false)}
            sx={{ px: 4, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Tôi đã hiểu và cam kết không vi phạm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog 
        open={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 2, maxWidth: 400 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>
          Xác nhận Nộp bài
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn nộp bài thi này không? Hãy chắc chắn bạn đã rà soát kỹ tất cả các câu trả lời.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={() => setSubmitDialogOpen(false)}
            sx={{ flex: 1, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }}
          >
            Làm tiếp
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setSubmitDialogOpen(false);
              void handleSubmit(true);
            }}
            sx={{ 
              flex: 1, 
              py: 1, 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)',
              }
            }}
          >
            Nộp bài
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Copy/Paste/Context Warning Dialog */}
      <Dialog 
        open={interactionWarningOpen} 
        onClose={() => setInteractionWarningOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 2, maxWidth: 400 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 700 }}>
          <Warning sx={{ fontSize: 28 }} /> Hành động bị hạn chế
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {interactionWarningMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => setInteractionWarningOpen(false)}
            sx={{ px: 4, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
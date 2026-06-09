import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import {
  Box, Typography, Paper, RadioGroup, FormControlLabel, Radio,
  Button, LinearProgress, Card, CardContent, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid
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
        const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải đề thi';
        setError(errorMsg);
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

  const handleSelectOption = (questionId: number, answerId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const question = questions[currentQuestion];
  const progressPercent = (Object.keys(answers).length / questions.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4, px: { xs: 2, md: 4 } }}>
      {/* Header of the Exam */}
      <Paper 
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a', fontFamily: "'Palatino Linotype', Palatino, serif" }}>
            {exam?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Thí sinh: <strong>{user?.username || 'Student'}</strong> | Email: <strong>{user?.email || 'N/A'}</strong>
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleSubmit(false)}
          startIcon={<Send />}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
            }
          }}
        >
          Nộp bài thi
        </Button>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Sidebar (Timer, Progress, Navigator) */}
        <Grid item xs={12} md={4} lg={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 24 }}>
            {/* Timer card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'white',
                textAlign: 'center',
                p: 2
              }}
            >
              <CardContent sx={{ p: '16px !important' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                  THỜI GIAN CÒN LẠI
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={800}
                  sx={{
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    my: 1.5,
                    display: 'inline-block',
                    transition: 'all 0.3s ease',
                    ...(timeLeft < 180 ? {
                      color: '#ef4444',
                      animation: 'pulse 1s infinite alternate',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', textShadow: '0 0 4px rgba(239, 68, 68, 0.2)' },
                        '100%': { transform: 'scale(1.08)', textShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }
                      }
                    } : {
                      color: '#1e293b'
                    })
                  }}
                >
                  {formatTime(timeLeft)}
                </Typography>
                {timeLeft < 180 && (
                  <Typography variant="caption" color="error" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                    ⚠️ Sắp hết giờ! Nhanh chóng hoàn thành bài thi.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'white',
                p: 2
              }}
            >
              <CardContent sx={{ p: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    TIẾN ĐỘ LÀM BÀI
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {Object.keys(answers).length}/{questions.length} câu
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progressPercent} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Question Navigator Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'white',
                p: 2
              }}
            >
              <CardContent sx={{ p: '16px !important' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                  BẢNG ĐIỀU HƯỚNG
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 1.2,
                    maxHeight: 280,
                    overflowY: 'auto',
                    pr: 0.5,
                    '&::-webkit-scrollbar': {
                      width: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f8fafc',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#cbd5e1',
                      borderRadius: 3,
                    }
                  }}
                >
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isActive = idx === currentQuestion;

                    let btnBg = 'white';
                    let btnColor = '#475569';
                    let btnBorder = '1px solid #cbd5e1';

                    if (isActive) {
                      btnBg = '#4f46e5';
                      btnColor = 'white';
                      btnBorder = '1px solid #4f46e5';
                    } else if (isAnswered) {
                      btnBg = 'rgba(79, 70, 229, 0.1)';
                      btnColor = '#4f46e5';
                      btnBorder = '1px solid rgba(79, 70, 229, 0.3)';
                    }

                    return (
                      <Button
                        key={q.id}
                        onClick={() => setCurrentQuestion(idx)}
                        sx={{
                          aspectRatio: '1/1',
                          minWidth: 0,
                          p: 0,
                          borderRadius: 2.5,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          bgcolor: btnBg,
                          color: btnColor,
                          border: btnBorder,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: isActive ? '#4338ca' : 'rgba(79, 70, 229, 0.05)',
                            borderColor: '#4f46e5',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        {idx + 1}
                      </Button>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Right main workspace (question prompt, multiple-choice options) */}
        <Grid item xs={12} md={8} lg={9}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'white',
              p: { xs: 3, md: 4 },
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              {/* Question header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Câu hỏi {currentQuestion + 1} / {questions.length}
                </Typography>
                {answers[question.id] !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                    <CheckCircleOutline sx={{ fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={600}>Đã lưu</Typography>
                  </Box>
                )}
              </Box>

              {/* Question prompt content */}
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  color: '#0f172a', 
                  mb: 4, 
                  lineHeight: 1.6,
                  fontSize: '1.2rem',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                {question.content}
              </Typography>

              {/* Multiple-choice options list */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {question.answers.map((answer, index) => {
                  const labelLetter = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = answers[question.id] === answer.id;

                  return (
                    <Box
                      key={answer.id}
                      onClick={() => handleSelectOption(question.id, answer.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 3,
                        border: isSelected ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                        bgcolor: isSelected ? 'rgba(79, 70, 229, 0.02)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
                          borderColor: isSelected ? '#4f46e5' : '#4f46e5'
                        },
                        ...(isSelected && {
                          transform: 'scale(1.015)',
                          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.12)'
                        })
                      }}
                    >
                      {/* Letter badge */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          mr: 2,
                          transition: 'all 0.2s',
                          bgcolor: isSelected ? '#4f46e5' : '#f1f5f9',
                          color: isSelected ? 'white' : '#475569',
                          border: isSelected ? '1px solid #4f46e5' : '1px solid #cbd5e1'
                        }}
                      >
                        {labelLetter}
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#1e293b' : '#334155',
                          fontSize: '1.05rem'
                        }}
                      >
                        {answer.content}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Navigation buttons at the bottom of the workspace */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 6, pt: 3, borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderWidth: 1.5,
                  '&:hover': { borderWidth: 1.5 }
                }}
              >
                Câu trước
              </Button>

              <Button
                variant="outlined"
                endIcon={<NavigateNext />}
                disabled={currentQuestion === questions.length - 1}
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderWidth: 1.5,
                  '&:hover': { borderWidth: 1.5 }
                }}
              >
                Câu sau
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Warning Dialog (anti-cheat) */}
      <Dialog 
        open={warningOpen} 
        onClose={() => setWarningOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#ef4444', fontWeight: 700 }}>
          <Warning sx={{ fontSize: 28 }} />
          Cảnh Báo Chống Gian Lận!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6 }}>
            {warningMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => setWarningOpen(false)}
            sx={{ borderRadius: 3, px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Tôi đã hiểu và cam kết không vi phạm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interaction Block Warning Dialog (right click, copy, paste) */}
      <Dialog 
        open={interactionWarningOpen} 
        onClose={() => setInteractionWarningOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#f59e0b', fontWeight: 700 }}>
          <Warning sx={{ fontSize: 28 }} />
          Thao Tác Không Hợp Lệ!
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.6 }}>
            {interactionWarningMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => setInteractionWarningOpen(false)}
            sx={{ borderRadius: 3, px: 3, py: 1, textTransform: 'none', fontWeight: 600, color: 'white' }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog 
        open={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#4f46e5', fontWeight: 700 }}>
          <Send sx={{ fontSize: 24 }} />
          Xác Nhận Nộp Bài Thi
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
            Bạn có chắc chắn muốn nộp bài thi không?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Số câu đã trả lời: <strong>{Object.keys(answers).length} / {questions.length}</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button 
            variant="outlined" 
            onClick={() => setSubmitDialogOpen(false)}
            sx={{ borderRadius: 3, px: 3, py: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              setSubmitDialogOpen(false);
              handleSubmit(true);
            }}
            sx={{ 
              borderRadius: 3, 
              px: 3, 
              py: 1, 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)'
              }
            }}
          >
            Xác nhận nộp bài
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
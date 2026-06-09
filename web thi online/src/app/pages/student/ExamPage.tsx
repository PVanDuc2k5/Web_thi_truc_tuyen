import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import {
  Box, Typography, Paper, RadioGroup, FormControlLabel, Radio,
  Button, LinearProgress, Card, CardContent, CircularProgress
} from '@mui/material';
import { NavigateBefore, NavigateNext, Send } from '@mui/icons-material';

// Import supabase để kiểm tra điểm cũ
import { supabase } from '../../../lib/supabase';

// Định nghĩa Types chuẩn với Backend
interface Answer { id: number; content: string; }
interface Question { id: number; content: string; answers: Answer[]; }
interface Exam { id: number; title: string; duration: number; }

export default function ExamPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  
  // Đảm bảo luôn có ID để làm key lưu LocalStorage
  const safeExamId = examId || "1";
  const draftKey = `exam_draft_${safeExamId}`;
  const timeKey = `exam_time_${safeExamId}`;

  // State quản lý Data từ API
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State quản lý luồng thi
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // 1. Khởi tạo Đáp án từ LocalStorage (Nếu có)
  const [answers, setAnswers] = useState<{ [key: number]: number }>(() => {
    const savedAnswers = localStorage.getItem(draftKey);
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number, correctCount: number, totalQuestions: number } | null>(null);

  // Lấy dữ liệu bài thi khi mở trang VÀ KIỂM TRA ĐÃ THI CHƯA
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // --- BẮT ĐẦU ĐOẠN KIỂM TRA BẢO MẬT ---
        const savedUser = localStorage.getItem('currentUser');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        
        if (currentUser) {
          // Check xem trong DB có điểm của người này cho đề này chưa
          const { data: existingResult, error: checkError } = await supabase
            .from('results')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('exam_id', safeExamId)
            .single(); // Tìm 1 kết quả duy nhất

          // Nếu tìm thấy điểm (nghĩa là đã thi rồi)
          if (existingResult) {
            alert('Bạn đã hoàn thành bài thi này rồi! Hệ thống không cho phép thi lại.');
            navigate('/student/dashboard'); // Đá văng về trang chủ
            return; // Dừng lập tức, không chạy phần code lấy đề bên dưới nữa
          }
        }
        // --- KẾT THÚC ĐOẠN KIỂM TRA BẢO MẬT ---

        // Nếu chưa thi thì tiếp tục gọi Backend lấy đề thi
        const response = await fetch(`http://localhost:3001/student/exam/${safeExamId}`);
        if (!response.ok) throw new Error('Không tìm thấy đề thi (DB trống)');
        
        const data = await response.json();
        setExam(data.exam);
        setQuestions(data.questions);

        // 2. Phục hồi thời gian: Nếu có thời gian cũ thì dùng, không thì lấy thời gian gốc của đề
        const savedTime = localStorage.getItem(timeKey);
        if (savedTime) {
          setTimeLeft(parseInt(savedTime, 10));
        } else {
          setTimeLeft(data.exam.duration * 60); // Đổi phút ra giây
        }

      } catch (err: any) {
        // Bỏ qua lỗi "No rows found" của .single() vì nó có nghĩa là học sinh CHƯA THI (điều tốt)
        if (err.code !== 'PGRST116') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamData();
  }, [safeExamId, timeKey, navigate]); // Thêm navigate vào mảng phụ thuộc cho chuẩn React

  // 3. THEO DÕI VÀ LƯU TRỮ LIÊN TỤC
  // Lưu đáp án mỗi khi học sinh tích chọn
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    }
  }, [answers, draftKey]);

  // Lưu thời gian mỗi khi đồng hồ nhảy (Bỏ qua lúc đang loading hoặc time = 0)
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      localStorage.setItem(timeKey, timeLeft.toString());
    }
  }, [timeLeft, timeKey, loading]);

  // Logic Đồng hồ đếm ngược
  useEffect(() => {
    if (loading || timeLeft <= 0 || result || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Hết giờ tự động nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, isSubmitting]);

  // Hàm Nộp bài gọi API Backend
  const handleSubmit = async () => {
    if (!exam || isSubmitting) return;

    // Lấy thông tin user từ Zustand auth store
    if (!user) {
      alert('Lỗi: Không tìm thấy thông tin sinh viên. Vui lòng quay lại trang Đăng nhập!');
      navigate('/');
      return;
    }
    
    // Nếu còn thời gian thì hỏi lại, hết giờ thì ép nộp luôn
    if (timeLeft > 0) {
      const isConfirm = window.confirm('Bạn có chắc chắn muốn nộp bài?');
      if (!isConfirm) return;
    }

    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(answers).map(([qId, aId]) => ({
        questionId: Number(qId),
        answerId: Number(aId)
      }));

      const payload = {
        userId: currentUser.id,
        examId: exam.id,
        answers: answersPayload
      };

      const { data } = await apiClient.post('/student/submit', payload);
      setResult(data);

      // 4. DỌN DẸP HIỆN TRƯỜNG: Nộp thành công thì xóa file nháp
      localStorage.removeItem(draftKey);
      localStorage.removeItem(timeKey);

    } catch (error) {
      alert('Có lỗi xảy ra khi nộp bài!');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress style={{color: 'rgb(22, 119, 185)'}} /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'error.main', typography: 'h6' }}>{error}</Box>;
  if (questions.length === 0) return <Box sx={{ p: 4, textAlign: 'center' }}>Chưa có câu hỏi nào trong đề này.</Box>;

  // MÀN HÌNH KẾT QUẢ
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
        <Typography variant="h1" fontWeight={900} sx={{ color: 'rgb(22, 119, 185)', mt: 1 }}>
          {result.score}
        </Typography>
      </Box>
    );
  }

  // MÀN HÌNH LÀM BÀI
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header Đếm ngược */}
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

      {/* Vùng câu hỏi */}
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

        {/* Nút điều hướng */}
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
              onClick={handleSubmit}
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
    </Box>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import apiClient from '../../../lib/api-client';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Edit, People, QuestionAnswer, Schedule, CheckCircle, ContentCopy, VpnKey, Visibility } from '@mui/icons-material';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { getExamResults } from '../../../lib/submission-service';

interface ExamData {
  id: number;
  title: string;
  questions: number;
  duration: number;
  status: string;
  totalAttempts: number;
  averageScore: number;
  createdDate: string;
  examCode: string;
  startTime: string | null;
  endTime: string | null;
  questionList: { id: number; question: string }[];
}

const emptyEditForm = {
  title: '',
  duration: '',
  startTime: '',
  endTime: '',
  status: 'draft',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);

  // States for student submissions
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  // States for detailed submission preview
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchExam = async () => {
    if (!examId) return;

    setIsLoading(true);
    try {
      const response = await apiClient.get<ExamData>(`/teacher/getExam/${examId}`);
      setExamData(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải chi tiết đề thi'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!examId) return;
    setLoadingResults(true);
    try {
      const { data, error } = await getExamResults(Number(examId));
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách kết quả học sinh:', err);
      toast.error('Không thể tải danh sách kết quả học sinh');
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    void fetchExam();
    void fetchResults();
  }, [examId]);

  const handleCopyCode = () => {
    if (!examData) return;
    navigator.clipboard.writeText(examData.examCode);
    toast.success('Exam code copied to clipboard!');
  };

  const handleOpenEdit = () => {
    if (!examData) return;
    setEditForm({
      title: examData.title,
      duration: String(examData.duration),
      startTime: examData.startTime || '',
      endTime: examData.endTime || '',
      status: examData.status,
    });
    setEditOpen(true);
  };

  const handleSaveExam = async () => {
    if (!examData) return;

    setIsSaving(true);
    try {
      await apiClient.put('/teacher/updateExam', {
        id: examData.id,
        title: editForm.title.trim(),
        duration: Number(editForm.duration),
        status: editForm.status,
        start_time: editForm.startTime || null,
        end_time: editForm.endTime || null,
      });
      await fetchExam();
      setEditOpen(false);
      toast.success('Cập nhật đề thi thành công');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật đề thi'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = async (result: any) => {
    setSelectedResult(result);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      // Fetch user answers
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select(`
          question_id,
          answer_id,
          answers (
            is_correct
          )
        `)
        .eq('result_id', result.id);

      if (answersError) throw answersError;
      setSelectedAnswers(userAnswers || []);

      // Fetch questions for this exam
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
        .eq('exam_id', Number(examId));

      if (eqError) throw eqError;

      const qs = (examQuestions || []).map((eq: any) => eq.questions).filter(Boolean);
      setSelectedQuestions(qs);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải chi tiết bài làm');
    } finally {
      setLoadingDetail(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!examData) {
    return <Typography color="error">Exam not found</Typography>;
  }

  const stats = [
    { title: 'Total Questions', value: examData.questions, icon: <QuestionAnswer />, color: '#667eea' },
    { title: 'Duration', value: `${examData.duration} min`, icon: <Schedule />, color: '#f093fb' },
    { title: 'Students Attempted', value: examData.totalAttempts, icon: <People />, color: '#4facfe' },
    { title: 'Average Score', value: examData.averageScore, icon: <CheckCircle />, color: '#52c41a' },
  ];

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/teacher')}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {examData.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              bgcolor: '#f5f5ff',
              border: '2px solid #667eea',
              minWidth: 200,
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <VpnKey sx={{ color: '#667eea', fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                EXAM CODE
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{
                fontFamily: 'monospace',
                color: '#667eea',
                letterSpacing: 2,
                mb: 1,
              }}
            >
              {examData.examCode}
            </Typography>
            <Tooltip title="Copy Code">
              <IconButton
                size="small"
                onClick={handleCopyCode}
                sx={{ bgcolor: 'white' }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip
              label={examData.status}
              color={examData.status === 'active' ? 'success' : 'warning'}
            />
            <Button
              variant="contained"
              startIcon={<Edit />}
              size="small"
              onClick={handleOpenEdit}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Edit Exam
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${stat.color}, ${stat.color}99)`,
                      color: 'white',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Exam Settings
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Start Time
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {examData.startTime || 'No limit'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                End Time
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {examData.endTime || 'No limit'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Created Date
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(examData.createdDate).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Student Submissions Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Student Submissions
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Score</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Submitted Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingResults ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Chưa có sinh viên nào nộp bài.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id} hover>
                      <TableCell>{result.user_profiles?.username || 'Unknown Student'}</TableCell>
                      <TableCell align="center">
                        <strong>{result.score}/10</strong>
                      </TableCell>
                      <TableCell>
                        {new Date(result.submitted_at).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetails(result)}
                        >
                          View Answers
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Questions in this Exam
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examData.questionList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      No questions found
                    </TableCell>
                  </TableRow>
                )}
                {examData.questionList.map((q, index) => (
                  <TableRow key={q.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{q.question}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detailed Answers Review Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 600 }}>
          Chi tiết bài làm - {selectedResult?.user_profiles?.username || 'Sinh viên'}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : selectedQuestions.length === 0 ? (
            <Typography align="center" color="text.secondary">Chưa tải được câu hỏi.</Typography>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Typography variant="subtitle1">
                  Điểm số: <strong>{selectedResult?.score}/10</strong>
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {selectedQuestions.map((question, index) => {
                // Find student chosen answer
                const studentAnswer = selectedAnswers.find((sa: any) => sa.question_id === question.id);
                const chosenAnswerId = studentAnswer?.answer_id;

                return (
                  <Paper key={question.id} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fbfbfb' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                        Câu {index + 1}:
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {question.content}
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5}>
                      {question.answers?.map((ans: any) => {
                        const isCorrectAnswer = ans.is_correct === true;
                        const isChosen = chosenAnswerId === ans.id;

                        let cardBg = 'transparent';
                        let borderCol = '#e0e0e0';

                        if (isCorrectAnswer) {
                          cardBg = '#e8f5e9'; // Green background for correct
                          borderCol = '#4caf50';
                        } else if (isChosen && !isCorrectAnswer) {
                          cardBg = '#ffebee'; // Red background for chosen incorrect
                          borderCol = '#f44336';
                        }

                        return (
                          <Grid size={12} key={ans.id}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: cardBg,
                                borderColor: borderCol,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: isChosen || isCorrectAnswer ? 600 : 400 }}>
                                {ans.content}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {isCorrectAnswer && (
                                  <Chip label="Đáp án đúng" color="success" size="small" variant="filled" />
                                )}
                                {isChosen && !isCorrectAnswer && (
                                  <Chip label="Học sinh chọn (Sai)" color="error" size="small" variant="filled" />
                                )}
                                {isChosen && isCorrectAnswer && (
                                  <Chip label="Học sinh chọn (Đúng)" color="success" size="small" variant="outlined" />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="contained" sx={{ bgcolor: '#667eea' }}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Exam Title"
            margin="normal"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <TextField
            fullWidth
            select
            label="Status"
            margin="normal"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          >
            <MenuItem value="active">active</MenuItem>
            <MenuItem value="draft">draft</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            margin="normal"
            value={editForm.duration}
            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
          />
          <TextField
            fullWidth
            label="Start Time"
            margin="normal"
            value={editForm.startTime}
            onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
          />
          <TextField
            fullWidth
            label="End Time"
            margin="normal"
            value={editForm.endTime}
            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveExam()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Divider,
  InputAdornment,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Save, ContentCopy, CheckCircle, VpnKey } from '@mui/icons-material';
import { toast } from 'sonner';

interface Question {
  id: number;
  question: string;
  category: string;
  answers: string[];
  correct: number | null;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function ExamBuilder() {
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [status, setStatus] = useState('active');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [examCode, setExamCode] = useState('');
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await apiClient.get<{ questions: Question[] }>('/teacher/getAllQuestions');
        setAvailableQuestions(response.data.questions);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không thể tải danh sách câu hỏi'));
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    void fetchQuestions();
  }, []);

  const handleToggleQuestion = (id: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  const handleCreateExam = async () => {
    if (!examTitle || !duration || selectedQuestions.length === 0) {
      toast.error('Please fill in all required fields and select at least one question');
      return;
    }

    setIsCreatingExam(true);

    try {
      const response = await apiClient.post<{ message: string; examCode: string }>(
        '/teacher/createExam',
        {
          title: examTitle.trim(),
          duration: Number(duration),
          status,
          start_time: startTime || null,
          end_time: endTime || null,
          question_ids: selectedQuestions,
        },
      );

      setExamCode(response.data.examCode);
      setShowSuccessDialog(true);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tạo đề thi'));
    } finally {
      setIsCreatingExam(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(examCode);
    toast.success('Exam code copied to clipboard!');
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    // Reset form
    setExamTitle('');
    setDuration('');
    setStartTime('');
    setEndTime('');
    setMaxAttempts('1');
    setSelectedQuestions([]);
    setExamCode('');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Exam Builder
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exam Details
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Exam Title"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Start Time (Optional)"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="End Time (Optional)"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {/* <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Max Attempts (Optional)"
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Limit:</InputAdornment>,
              }}
            />
          </Grid> */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="draft">draft</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Questions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selected: {selectedQuestions.length} questions
        </Typography>

        {isLoadingQuestions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : availableQuestions.length === 0 ? (
          <Alert severity="info">Chưa có câu hỏi nào trong database.</Alert>
        ) : (
          <Grid container spacing={2}>
            {availableQuestions.map((q) => (
              <Grid size={{ xs: 12, md: 6 }} key={q.id}>
                <Card
                  variant="outlined"
                  sx={{
                    border: selectedQuestions.includes(q.id) ? '2px solid #667eea' : undefined,
                    backgroundColor: selectedQuestions.includes(q.id) ? '#f5f5ff' : undefined,
                  }}
                >
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedQuestions.includes(q.id)}
                          onChange={() => handleToggleQuestion(q.id)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">{q.question}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Category: {q.category}
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleCreateExam}
            disabled={isCreatingExam || !examTitle || !duration || selectedQuestions.length === 0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {isCreatingExam ? 'Creating...' : 'Create Exam'}
          </Button>
        </Box>
      </Paper>

      <Dialog open={showSuccessDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: '#52c41a' }} />
            <Typography variant="h6">Exam Created Successfully!</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your exam has been created and is now available for students to join.
          </Alert>

          <Box
            sx={{
              p: 3,
              bgcolor: '#f5f5ff',
              borderRadius: 2,
              border: '2px solid #667eea',
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
              <VpnKey sx={{ color: '#667eea' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                EXAM CODE
              </Typography>
            </Box>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{
                fontFamily: 'monospace',
                color: '#667eea',
                letterSpacing: 4,
                mb: 2,
              }}
            >
              {examCode}
            </Typography>
            <Button
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={handleCopyCode}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Copy Code
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary">
            <strong>Share this code with your students</strong> so they can join the exam. Students will use this code on their dashboard to access the exam.
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCloseDialog}>
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

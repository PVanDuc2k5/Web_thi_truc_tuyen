import { useEffect, useState } from 'react';
import { Add, Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'sonner';
import apiClient from '../../../lib/api-client';

interface Question {
  id: number;
  question: string;
  category: string;
  answers: string[];
  correct: number | null;
}

interface QuestionForm {
  question: string;
  category: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  correct: string;
}

const emptyForm: QuestionForm = {
  question: '',
  category: '',
  answer1: '',
  answer2: '',
  answer3: '',
  answer4: '',
  correct: '0',
};

const categoryOptions = ['Math', 'Geography', 'Science', 'Literature', 'Chemistry', 'Physics'];

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;

  return Array.isArray(message) ? message.join(', ') : message || fallback;
};

export default function QuestionManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuestionForm>(emptyForm);

  const fetchQuestions = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.get<{ questions: Question[] }>('/teacher/getAllQuestions');
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Lấy danh sách câu hỏi lỗi:', error);
      toast.error(getErrorMessage(error, 'Không thể tải danh sách câu hỏi'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuestions();
  }, []);

  const openCreateDialog = () => {
    setEditingQuestionId(null);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestionId(question.id);
    setFormData({
      question: question.question,
      category: question.category,
      answer1: question.answers[0] || '',
      answer2: question.answers[1] || '',
      answer3: question.answers[2] || '',
      answer4: question.answers[3] || '',
      correct: String((question.correct || 1) - 1),
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestionId(null);
  };

  const handleSubmitQuestion = async () => {
    setIsSubmitting(true);

    try {
      const body = {
        ...(editingQuestionId ? { id: editingQuestionId } : {}),
        question: formData.question.trim(),
        category: formData.category,
        answer1: formData.answer1.trim(),
        answer2: formData.answer2.trim(),
        answer3: formData.answer3.trim(),
        answer4: formData.answer4.trim(),
        correct: Number(formData.correct) + 1,
      };

      if (editingQuestionId) {
        await apiClient.put('/teacher/updateQuestion', body);
      } else {
        await apiClient.post('/teacher/createQuestion', body);
      }

      await fetchQuestions();
      toast.success(editingQuestionId ? 'Cập nhật câu hỏi thành công' : 'Tạo câu hỏi thành công');
      handleCloseDialog();
    } catch (error) {
      console.error('Lưu câu hỏi lỗi:', error);
      toast.error(getErrorMessage(error, 'Lưu câu hỏi thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await apiClient.delete('/teacher/deleteQuestion', { data: { id } });
      setQuestions((current) => current.filter((question) => question.id !== id));
      toast.success('Xóa câu hỏi thành công');
    } catch (error) {
      console.error('Xóa câu hỏi lỗi:', error);
      toast.error(getErrorMessage(error, 'Xóa câu hỏi thất bại'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Question Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          Add Question
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>ID</TableCell>
              <TableCell>Question</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Answers</TableCell>
              <TableCell>Correct Answer</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Chưa có câu hỏi nào
                </TableCell>
              </TableRow>
            )}
            {questions.map((question) => (
              <TableRow key={question.id} hover>
                <TableCell>{question.id}</TableCell>
                <TableCell>{question.question}</TableCell>
                <TableCell>{question.category}</TableCell>
                <TableCell>
                  {question.answers.map((answer, index) => (
                    <Box key={`${question.id}-${index}`} component="span" sx={{ display: 'block', fontSize: '0.9rem' }}>
                      {index + 1}. {answer}
                    </Box>
                  ))}
                </TableCell>
                <TableCell>
                  {question.correct ? question.answers[question.correct - 1] : 'Chưa chọn'}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" size="small" onClick={() => openEditDialog(question)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => handleDeleteQuestion(question.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingQuestionId ? 'Edit Question' : 'Create New Question'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Category"
            margin="normal"
            value={formData.category}
            onChange={(event) => setFormData({ ...formData, category: event.target.value })}
          >
            {categoryOptions.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Question"
            multiline
            rows={2}
            margin="normal"
            value={formData.question}
            onChange={(event) => setFormData({ ...formData, question: event.target.value })}
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answers:
          </Typography>
          {(['answer1', 'answer2', 'answer3', 'answer4'] as const).map((field, index) => (
            <TextField
              key={field}
              fullWidth
              label={`Answer ${index + 1}`}
              margin="dense"
              value={formData[field]}
              onChange={(event) => setFormData({ ...formData, [field]: event.target.value })}
            />
          ))}

          <Box sx={{ mt: 3 }}>
            <FormLabel>Correct Answer:</FormLabel>
            <RadioGroup
              value={formData.correct}
              onChange={(event) => setFormData({ ...formData, correct: event.target.value })}
            >
              {['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'].map((label, index) => (
                <FormControlLabel
                  key={label}
                  value={String(index)}
                  control={<Radio />}
                  label={label}
                />
              ))}
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitQuestion}
            disabled={isSubmitting}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {isSubmitting ? 'Saving...' : editingQuestionId ? 'Save Changes' : 'Create Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const questions = [
  {
    id: 1,
    question: 'What is 2 + 2?',
    category: 'Math',
    answers: ['3', '4', '5', '6'],
    correct: 1,
  },
  {
    id: 2,
    question: 'What is the capital of France?',
    category: 'Geography',
    answers: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct: 2,
  },
  {
    id: 3,
    question: 'Which planet is closest to the sun?',
    category: 'Science',
    answers: ['Venus', 'Mercury', 'Earth', 'Mars'],
    correct: 1,
  },
];

const categoryOptions = ['Math', 'Geography', 'Science', 'Literature', 'Chemistry', 'Physics'];

export default function QuestionManagement() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    category: '',
    answer1: '',
    answer2: '',
    answer3: '',
    answer4: '',
    correct: '0',
  });

  const openCreateDialog = () => {
    setEditingQuestionId(null);
    setFormData({
      question: '',
      category: '',
      answer1: '',
      answer2: '',
      answer3: '',
      answer4: '',
      correct: '0',
    });
    setOpenDialog(true);
  };

  const openEditDialog = (question: typeof questions[number]) => {
    setEditingQuestionId(question.id);
    setFormData({
      question: question.question,
      category: question.category,
      answer1: question.answers[0],
      answer2: question.answers[1],
      answer3: question.answers[2],
      answer4: question.answers[3],
      correct: question.correct.toString(),
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestionId(null);
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
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          Add Question
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell fontWeight={600}>ID</TableCell>
              <TableCell fontWeight={600}>Question</TableCell>
              <TableCell fontWeight={600}>Category</TableCell>
              <TableCell fontWeight={600}>Answers</TableCell>
              <TableCell fontWeight={600}>Correct Answer</TableCell>
              <TableCell fontWeight={600} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((q) => (
              <TableRow key={q.id} hover>
                <TableCell>{q.id}</TableCell>
                <TableCell>{q.question}</TableCell>
                <TableCell>{q.category}</TableCell>
                <TableCell>
                  {q.answers.map((ans, idx) => (
                    <Box key={idx} component="span" sx={{ display: 'block', fontSize: '0.9rem' }}>
                      {idx + 1}. {ans}
                    </Box>
                  ))}
                </TableCell>
                <TableCell>{q.answers[q.correct]}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" size="small" onClick={() => openEditDialog(q)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" size="small">
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
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Answers:
          </Typography>
          {['answer1', 'answer2', 'answer3', 'answer4'].map((field, idx) => (
            <TextField
              key={field}
              fullWidth
              label={`Answer ${idx + 1}`}
              margin="dense"
              value={formData[field as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            />
          ))}

          <Box sx={{ mt: 3 }}>
            <FormLabel>Correct Answer:</FormLabel>
            <RadioGroup
              value={formData.correct}
              onChange={(e) => setFormData({ ...formData, correct: e.target.value })}
            >
              {['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'].map((label, idx) => (
                <FormControlLabel
                  key={idx}
                  value={idx.toString()}
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
            onClick={handleCloseDialog}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {editingQuestionId ? 'Save Changes' : 'Create Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

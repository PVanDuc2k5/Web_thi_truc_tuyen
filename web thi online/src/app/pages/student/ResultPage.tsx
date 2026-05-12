import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { CheckCircle, Cancel, Home } from '@mui/icons-material';

const mockResults = {
  examTitle: 'Mathematics Final Exam',
  totalQuestions: 5,
  correctAnswers: 4,
  incorrectAnswers: 1,
  score: 80,
  answers: [
    { question: 'What is 2 + 2?', userAnswer: '4', correctAnswer: '4', isCorrect: true },
    { question: 'What is the capital of France?', userAnswer: 'Paris', correctAnswer: 'Paris', isCorrect: true },
    { question: 'Which planet is closest to the sun?', userAnswer: 'Venus', correctAnswer: 'Mercury', isCorrect: false },
    { question: 'Who wrote Romeo and Juliet?', userAnswer: 'William Shakespeare', correctAnswer: 'William Shakespeare', isCorrect: true },
    { question: 'What is the largest ocean on Earth?', userAnswer: 'Pacific', correctAnswer: 'Pacific', isCorrect: true },
  ],
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { examId } = useParams();

  return (
    <Box>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Exam Results
        </Typography>
        <Typography variant="h6">
          {mockResults.examTitle}
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="primary">
                {mockResults.score}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Final Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600}>
                {mockResults.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2} sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="success.main">
                {mockResults.correctAnswers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Correct Answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card elevation={2} sx={{ bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={600} color="error.main">
                {mockResults.incorrectAnswers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Incorrect Answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Answer Review
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Your Answer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Correct Answer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockResults.answers.map((answer, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{answer.question}</TableCell>
                  <TableCell>{answer.userAnswer}</TableCell>
                  <TableCell>{answer.correctAnswer}</TableCell>
                  <TableCell>
                    {answer.isCorrect ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Correct"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<Cancel />}
                        label="Incorrect"
                        color="error"
                        size="small"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Home />}
          onClick={() => navigate('/student')}
          sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
}

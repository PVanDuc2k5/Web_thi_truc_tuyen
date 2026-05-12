import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { NavigateBefore, NavigateNext, Send } from '@mui/icons-material';

const mockQuestions = [
  {
    id: 1,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
  },
  {
    id: 2,
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
  },
  {
    id: 3,
    question: 'Which planet is closest to the sun?',
    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
  },
  {
    id: 4,
    question: 'Who wrote Romeo and Juliet?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
  },
  {
    id: 5,
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
  },
];

export default function ExamPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = () => {
    navigate(`/student/result/${examId}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  return (
    <Box>
      <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Exam in Progress
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Question {currentQuestion + 1} of {mockQuestions.length}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255,255,255,0.2)', px: 3, py: 2, borderRadius: 2 }}>
              <Typography variant="h3" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>Time Remaining</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Paper elevation={2} sx={{ p: 4, minHeight: '60vh' }}>
        <Box sx={{ mb: 4 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Progress: {currentQuestion + 1}/{mockQuestions.length}
          </Typography>
        </Box>

        <Box sx={{ mb: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2, borderLeft: '4px solid #667eea' }}>
          <Typography variant="h5" fontWeight={600}>
            {mockQuestions[currentQuestion].question}
          </Typography>
        </Box>

        <RadioGroup
          value={answers[currentQuestion] || ''}
          onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })}
        >
          {mockQuestions[currentQuestion].options.map((option, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                mb: 2,
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' },
                bgcolor: answers[currentQuestion] === option ? '#e8eaf6' : 'transparent',
              }}
            >
              <FormControlLabel
                value={option}
                control={<Radio />}
                label={option}
                sx={{ width: '100%', m: 0 }}
              />
            </Paper>
          ))}
        </RadioGroup>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
          >
            Previous
          </Button>

          {currentQuestion === mockQuestions.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<Send />}
              onClick={handleSubmit}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Submit Exam
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

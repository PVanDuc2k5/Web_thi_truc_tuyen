import { useNavigate } from 'react-router';
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
  Chip,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

const results = [
  {
    id: 1,
    examName: 'Mathematics Final Exam',
    correctAnswers: 42,
    totalQuestions: 50,
    duration: '85 min',
    submissionDate: '2026-04-20 14:30',
  },
  {
    id: 2,
    examName: 'Biology Practice Test',
    correctAnswers: 38,
    totalQuestions: 40,
    duration: '70 min',
    submissionDate: '2026-04-18 11:15',
  },
  {
    id: 3,
    examName: 'Chemistry Quiz 1',
    correctAnswers: 18,
    totalQuestions: 20,
    duration: '28 min',
    submissionDate: '2026-04-15 09:45',
  },
  {
    id: 4,
    examName: 'Physics Basics',
    correctAnswers: 25,
    totalQuestions: 30,
    duration: '55 min',
    submissionDate: '2026-04-10 16:20',
  },
];

export default function MyResults() {
  const navigate = useNavigate();

  const getPercentage = (correct: number, total: number) => {
    return ((correct / total) * 100).toFixed(0);
  };

  const getScoreChip = (correct: number, total: number) => {
    const percentage = parseFloat(getPercentage(correct, total));
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        My Results
      </Typography>

      <TableContainer component={Paper} elevation={2} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell fontWeight={600}>Exam Name</TableCell>
              <TableCell fontWeight={600} align="center">Score</TableCell>
              <TableCell fontWeight={600} align="center">Percentage</TableCell>
              <TableCell fontWeight={600}>Duration</TableCell>
              <TableCell fontWeight={600}>Submission Date</TableCell>
              <TableCell fontWeight={600} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id} hover>
                <TableCell>{result.examName}</TableCell>
                <TableCell align="center">
                  <strong>
                    {((result.correctAnswers / result.totalQuestions) * 10).toFixed(1)}/10
                  </strong>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${getPercentage(result.correctAnswers, result.totalQuestions)}%`}
                    color={getScoreChip(result.correctAnswers, result.totalQuestions)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{result.duration}</TableCell>
                <TableCell>{result.submissionDate}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/student/result/${result.id}`)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

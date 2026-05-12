import { useParams, useNavigate } from 'react-router';
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
} from '@mui/material';
import { ArrowBack, Edit, People, QuestionAnswer, Schedule, CheckCircle, ContentCopy, VpnKey } from '@mui/icons-material';
import { toast } from 'sonner';

const examData = {
  id: 1,
  title: 'Mathematics Final Exam',
  description: 'Comprehensive final exam covering all topics from the semester',
  questions: 50,
  duration: 90,
  status: 'active',
  totalAttempts: 45,
  averageScore: 38.5,
  createdDate: '2026-04-10',
  examCode: 'MATH2024',
  startTime: '2026-04-25 09:00',
  endTime: '2026-04-30 23:59',
  maxAttempts: 2,
};

const questions = [
  { id: 1, question: 'What is 2 + 2?', type: 'Multiple Choice', points: 2 },
  { id: 2, question: 'Solve for x: 2x + 5 = 15', type: 'Multiple Choice', points: 3 },
  { id: 3, question: 'Calculate the derivative of x^2', type: 'Multiple Choice', points: 5 },
  { id: 4, question: 'What is the Pythagorean theorem?', type: 'Multiple Choice', points: 2 },
  { id: 5, question: 'Find the area of a circle with radius 5', type: 'Multiple Choice', points: 3 },
  { id: 6, question: 'What is the quadratic formula?', type: 'Multiple Choice', points: 4 },
  { id: 7, question: 'Solve the equation: 3x - 7 = 20', type: 'Multiple Choice', points: 2 },
];

const stats = [
  { title: 'Total Questions', value: '50', icon: <QuestionAnswer />, color: '#667eea' },
  { title: 'Duration', value: '90 min', icon: <Schedule />, color: '#f093fb' },
  { title: 'Students Attempted', value: '45', icon: <People />, color: '#4facfe' },
  { title: 'Average Score', value: '77%', icon: <CheckCircle />, color: '#52c41a' },
];

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(examData.examCode);
    toast.success('Exam code copied to clipboard!');
  };

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
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {examData.description}
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
                Max Attempts
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {examData.maxAttempts} attempt(s)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Created Date
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {examData.createdDate}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Questions in this Exam
          </Typography>
          <Divider sx={{ my: 2 }} />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell fontWeight={600}>#</TableCell>
                  <TableCell fontWeight={600}>Question</TableCell>
                  <TableCell fontWeight={600}>Type</TableCell>
                  <TableCell fontWeight={600} align="right">Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((q, index) => (
                  <TableRow key={q.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{q.question}</TableCell>
                    <TableCell>
                      <Chip label={q.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{q.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

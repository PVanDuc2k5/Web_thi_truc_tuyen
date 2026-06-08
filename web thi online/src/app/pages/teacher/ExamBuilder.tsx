import { useState } from 'react';
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
  IconButton,
  Alert,
  Divider,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { Save, ContentCopy, CheckCircle, VpnKey } from '@mui/icons-material';
import { toast } from 'sonner';

const availableQuestions = [
  { id: 1, question: 'What is 2 + 2?', category: 'Math' },
  { id: 2, question: 'What is the capital of France?', category: 'Geography' },
  { id: 3, question: 'Which planet is closest to the sun?', category: 'Science' },
  { id: 4, question: 'Who wrote Romeo and Juliet?', category: 'Literature' },
  { id: 5, question: 'What is H2O?', category: 'Chemistry' },
  { id: 6, question: 'What is the speed of light?', category: 'Physics' },
];

const generateExamCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
  const [generatedCode, setGeneratedCode] = useState('');

  const handleToggleQuestion = (id: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  const handleCreateExam = () => {
    if (!examTitle || !duration || selectedQuestions.length === 0) {
      toast.error('Please fill in all required fields and select at least one question');
      return;
    }

    const code = generateExamCode();
    setGeneratedCode(code);
    setShowSuccessDialog(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
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
          <Grid size={{ xs: 12, md: 4 }}>
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
          </Grid>
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleCreateExam}
            disabled={!examTitle || !duration || selectedQuestions.length === 0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create Exam
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
              {generatedCode}
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

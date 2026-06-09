import { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';

// Import supabase client
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';

// Định nghĩa kiểu dữ liệu để TypeScript không báo lỗi
interface ResultData {
  id: number;
  exam_id: number;
  examName: string;
  score: number;
  duration: string;
  submissionDate: string;
}

export default function MyResults() {
  const navigate = useNavigate();
  
  // State lưu dữ liệu thật
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);

  // Kéo dữ liệu từ Supabase khi vừa vào trang
  useEffect(() => {
    const fetchMyResults = async () => {
      try {
        const user = useAuthStore.getState().user;
        if (!user || !user.id) {
          setLoading(false);
          return;
        }

        // Gọi DB: Lấy điểm từ bảng results, ĐỒNG THỜI join sang bảng exams để lấy tên đề thi
        const { data, error } = await supabase
          .from('results')
          .select(`
            id,
            score,
            submitted_at,
            exam_id,
            exams (
              title,
              duration
            )
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false }); // Sắp xếp bài mới nộp lên đầu

        if (error) {
          console.error("Lỗi khi kéo lịch sử điểm:", error);
          return;
        }

        // Fomart lại dữ liệu cho giống với giao diện Table
        const formattedData = (data || []).map((item: any) => ({
          id: item.id,
          exam_id: item.exam_id,
          examName: item.exams?.title || 'Unknown Exam',
          score: item.score, // Điểm đã là thang 10 từ Backend
          duration: `${item.exams?.duration || 0} min`,
          // Format ngày tháng đẹp mắt kiểu Việt Nam
          submissionDate: new Date(item.submitted_at).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));

        setResults(formattedData);
      } catch (err) {
        console.error('Lỗi ngầm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyResults();
  }, []);

  // Công thức tính % dựa trên thang điểm 10
  const getPercentage = (score: number) => {
    return ((score / 10) * 100).toFixed(0);
  };

  const getScoreChip = (score: number) => {
    const percentage = parseFloat(getPercentage(score));
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
              {/* Đổi fontWeight={600} thành sx={{ fontWeight: 600 }} */}
              <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Score</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Percentage</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Submission Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Bạn chưa hoàn thành bài thi nào.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow key={result.id} hover>
                  <TableCell>{result.examName}</TableCell>
                  <TableCell align="center">
                    <strong>
                      {result.score}/10
                    </strong>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${getPercentage(result.score)}%`}
                      color={getScoreChip(result.score) as any}
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
                      onClick={() => navigate(`/student/result/${result.exam_id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
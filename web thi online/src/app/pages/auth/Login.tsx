import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { School } from '@mui/icons-material';

// Import hàm signIn xịn sò từ thư mục auth
import { signIn } from '../../../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(''); // State báo lỗi đăng nhập
  const [isLoading, setIsLoading] = useState(false); // State chống click nhiều lần

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    // 1. Gọi hàm signIn gọi xuống Database
    const { data, error } = await signIn(username, password);

    setIsLoading(false);

    // 2. Nếu sai pass hoặc không có data thì báo lỗi
    if (error || !data) {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại!');
      return;
    }

    // 3. Nếu đúng, lưu thẻ sinh viên (có chứa ID thật) vào localStorage
    localStorage.setItem('currentUser', JSON.stringify(data));

    // 4. Phân luồng dựa vào role THẬT từ Database trả về
    if (data.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={8}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <School sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Online Exam System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue
              </Typography>
            </Box>

            {/* Thông báo lỗi nếu đăng nhập sai */}
            {loginError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />

              {/* Đã xóa phần MenuItem chọn Role vì bây giờ hệ thống tự lấy Role thật từ Database! */}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                  },
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Button
                    onClick={() => navigate('/register')}
                    sx={{ textTransform: 'none' }}
                    disabled={isLoading}
                  >
                    Register
                  </Button>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
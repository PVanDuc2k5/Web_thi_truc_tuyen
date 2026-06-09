import { createBrowserRouter } from 'react-router';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherLayout from './components/layouts/TeacherLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherDashboard from './pages/teacher/Dashboard';
import MyExams from './pages/teacher/MyExams';
import QuestionManagement from './pages/teacher/QuestionManagement';
import ExamBuilder from './pages/teacher/ExamBuilder';
import ExamDetail from './pages/teacher/ExamDetail';
import TeacherProfilePage from './pages/teacher/ProfilePage';
import StudentDashboard from './pages/student/Dashboard';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import MyResults from './pages/student/MyResults';
import StudentProfilePage from './pages/student/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    children: [
      {
        element: <TeacherLayout />,
        children: [
          { index: true, Component: TeacherDashboard },
          { path: 'my-exams', Component: MyExams },
          { path: 'questions', Component: QuestionManagement },
          { path: 'exam-builder', Component: ExamBuilder },
          { path: 'exam/:examId', Component: ExamDetail },
          { path: 'profile', Component: TeacherProfilePage },
        ],
      },
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      { index: true, Component: StudentDashboard },
      { path: 'results', Component: MyResults },
      { path: 'exam/:examId', Component: ExamPage },
      { path: 'result/:examId', Component: ResultPage },
      { path: 'profile', Component: StudentProfilePage },
    ],
  },
]);

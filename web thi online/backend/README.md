# NestJS Backend for Web Thi Online

This folder contains a separate NestJS backend server for the Web Thi Online project.

## Quick start

```bash
cd "d:\Web_thi_truc_tuyen\web thi online"
pnpm install
pnpm --filter @web-thi-online/backend dev
```

## Request

--Trang teacher_Dashboard:
GET http://localhost:3001/teacher/getDashboard: Lấy 3 biến đầu ở trang Teacher Dashboard
GET http://localhost:3001/teacher/getAllExams: Lấy các thông tin về danh sách kỳ thi mà giáo viên tổ chức

--Trang teacher_MyExams:
GET http://localhost:3001/teacher/getAllExams: Lấy các thông tin về danh sách kỳ thi mà giáo viên tổ chức

GET http://localhost:3001/teacher/getExam/id của đề: Lấy các thông tin chi tiết về kỳ thi đó
Gắn giá trị id đề vào cái icon mắt để gọi API cho tiện

PUT http://localhost:3001/teacher/updateExam: Sửa thông tin đề
Ví dụ:
{
  "id": 6,
  "title": "Cập nhật đề thi 1",
  "duration": 60,
  "start_time": "2026-06-01T08:00:00",
  "end_time": "2026-06-01T09:00:00"
}

DELETE http://localhost:3001/teacher/deleteExam: Xoá đề thi
Ví dụ:
{
  "id": 7
}

--Trang teacher_QuestionManagement
GET http://localhost:5173/teacher/questions: Lấy thông tin về hết các câu hỏi của giáo viên

POST http://localhost:3001/teacher/createQuestion: Tạo câu hỏi
Ví dụ
{
  "question": "What is the capital of Vietnam?",
  "category": "Geography",
  "answer1": "Ho Chi Minh City",
  "answer2": "Da Nang",
  "answer3": "Ha Noi",
  "answer4": "Hue",
  "correct": 3
}

PUT http://localhost:3001/teacher/updateQuestion
Ví dụ:
{
  "id": 22, 
  "question": "What is the capital of Vietnam? a",
  "category": "Geography",
  "answer1": "Ho Chi Minh City",
  "answer2": "Da Nang",
  "answer3": "Ha Noi",
  "answer4": "Hue",
  "correct": 3
}

DELETE http://localhost:3001/teacher/deleteQuestion
Ví dụ:
{
  "id": 23
}

--Trang teacher_CreateExam(ExamBuilder)
POST http://localhost:3001/teacher/createExam
Ví dụ:
{
  "title": "Đề thi Toán giữa kỳ",
  "duration": 60,
  "start_time": "2026-06-01T08:00:00",
  "end_time": "2026-06-01T09:00:00",
  "question_ids": [16, 17, 18, 19, 20]
}
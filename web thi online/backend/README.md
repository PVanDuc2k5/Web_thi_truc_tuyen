# NestJS Backend for Web Thi Online

This folder contains a separate NestJS backend server for the Web Thi Online project.

## Quick start

```bash
cd "d:\Web_thi_truc_tuyen\web thi online"
pnpm install
pnpm --filter @web-thi-online/backend dev
```

## Request

POST http://localhost:3001/teacher/createQuestion: Thêm bài tập
Ví dụ:
{
  "question": "What is 2 + 2?",
  "answer1": "3",
  "answer2": "4",
  "answer3": "5",
  "answer4": "6",
  "correct": "1",
}

DELETE http://localhost:3001/teacher/deleteQuestion  : Xoá bài tập theo mã bài tập và mã giảng viên
Ví dụ: 
{
  "id": 5
}

POST http://localhost:3001/teacher/createExam : Thêm đề thi
Ví dụ:
{
  "title": "Math Test",
  "duration": 60,
  "start_time": "2026-05-28T08:00:00",
  "end_time": "2026-05-28T10:00:00",
  "question_ids": [2, 3, 6]
}

DELETE http://localhost:3001/teacher/deleteExam : Xoá đề thi theo mã bài tập và mã giảng viên
Ví dụ:
{
  "id": 2
}
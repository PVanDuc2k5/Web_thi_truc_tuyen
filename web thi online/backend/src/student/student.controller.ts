import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('exam/:id')
  async getExam(@Param('id') id: string) {
    return this.studentService.getExamForStudent(Number(id));
  }

  // THÊM API NỘP BÀI
  @Post('submit')
  async submitExam(
    @Body() body: { userId: number, examId: number, answers: { questionId: number, answerId: number }[] }
  ) {
    return this.studentService.submitExam(body.userId, body.examId, body.answers);
  }
}
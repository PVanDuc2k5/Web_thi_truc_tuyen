import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { StudentService } from './student.service';

@Controller('student')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('exam/:id')
  async getExam(@Param('id') id: string) {
    return this.studentService.getExamForStudent(Number(id));
  }

  // THÊM API NỘP BÀI
  @Post('submit')
  async submitExam(
    @Body() body: { examId: number, answers: { questionId: number, answerId: number }[] },
    @CurrentUser() user: any
  ) {
    return this.studentService.submitExam(user.id, body.examId, body.answers);
  }
}
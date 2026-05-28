import { Body, Controller, Delete, Post } from '@nestjs/common';
import { TeacherService } from './teacher.service';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

    @Post('createQuestion')
    async createQuestion(
        @Body()
        body: any,
    ) {
        return this.teacherService.createQuestion(body);
    }

    @Delete('deleteQuestion')
    deleteQuestion(
        @Body()
        body: any,
    ) {
        return this.teacherService.deleteQuestion(body);
    }

    @Post('createExam')
    async createExam(
        @Body()
        body: any,
    ) {
        return this.teacherService.createExam(body);
    }

    @Delete('deleteExam')
    deleteExam(
        @Body() 
        body: any
    ) {
        return this.teacherService.deleteExam(body);
    }

}

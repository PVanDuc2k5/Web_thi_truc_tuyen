import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { TeacherService } from './teacher.service';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

    @Get('test-token')
    testToken() {
        return this.teacherService.testToken();
    }

    @Post('createQuestion')
    async createQuestion(
        @Body() body: any,
        @Req() req: any
    ) {
        return this.teacherService.createQuestion(body, req);
    }

    @Delete('deleteQuestion')
    deleteQuestion(
        @Body()
        body: any,
        @Req() req: any,
    ) {
        return this.teacherService.deleteQuestion(body, req);
    }

    @Post('createExam')
    async createExam(
        @Body()
        body: any,
        @Req() req: any,
    ) {
        return this.teacherService.createExam(body, req);
    }

    @Delete('deleteExam')
    deleteExam(
        @Body()
        body: any,
        @Req() req: any,
    ) {
        return this.teacherService.deleteExam(body, req);
    }

}

import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
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

    @Put('updateQuestion')
    updateQuestion(
        @Body() body: any,
        @Req() req: any
    ) {
        return this.teacherService.updateQuestion(body, req);
    }

    @Put('updateExam')
    updateExam(
        @Body() body: any,
        @Req() req: any
    ) {
        return this.teacherService.updateExam(body, req);
    }

    @Get('getDashboard')
     getDashboard(
        @Req() req: any
    ) {
        return this.teacherService.getDashboard(req);
    }

    @Get('getAllExams')
    getAllExams(
        @Req() req: any
    ) {
        return this.teacherService.getAllExams(req);
    }

    @Get('getAllQuestions')
    getAllQuestions(
        @Req() req: any
    ) {
        return this.teacherService.getAllQuestions(req);
    }

    @Get('getExam/:id')
    getExam(
        @Param('id') id: string,
        @Req() req: any
    ) {
        return this.teacherService.getExam(Number(id), req);
    }
}

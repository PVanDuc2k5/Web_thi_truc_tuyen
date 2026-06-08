import { Body, Controller, Delete, Get, Post, Req, Put, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@UseGuards(SupabaseAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

    @Get('test-token')
    @Roles('teacher')
    testToken() {
        return this.teacherService.testToken();
    }

    @Post('createQuestion')
    @Roles('teacher')
    async createQuestion(
        @Body() body: any,
        @Req() req: any
    ) {
        return this.teacherService.createQuestion(body, req);
    }

    @Delete('deleteQuestion')
    @Roles('teacher')
    deleteQuestion(
        @Body()
        body: any,
        @Req() req: any,
    ) {
        return this.teacherService.deleteQuestion(body, req);
    }

    @Post('createExam')
    @Roles('teacher')
    async createExam(
        @Body()
        body: any,
        @Req() req: any,
    ) {
        return this.teacherService.createExam(body, req);
    }

    @Delete('deleteExam')
    @Roles('teacher')
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

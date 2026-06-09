import { Body, Controller, Delete, Get, Post, Put, Param, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/user.decorator';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherController {
    constructor(private readonly teacherService: TeacherService) {}

    @Post('createQuestion')
    async createQuestion(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.createQuestion(body, user.id);
    }

    @Delete('deleteQuestion')
    deleteQuestion(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.deleteQuestion(body, user.id);
    }

    @Post('createExam')
    async createExam(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.createExam(body, user.id);
    }

    @Delete('deleteExam')
    deleteExam(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.deleteExam(body, user.id);
    }

    @Put('updateQuestion')
    updateQuestion(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.updateQuestion(body, user.id);
    }

    @Put('updateExam')
    updateExam(
        @Body() body: any,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.updateExam(body, user.id);
    }

    @Get('getDashboard')
    getDashboard(@CurrentUser() user: any) {
        return this.teacherService.getDashboard(user.id);
    }

    @Get('getAllExams')
    getAllExams(@CurrentUser() user: any) {
        return this.teacherService.getAllExams(user.id);
    }

    @Get('getAllQuestions')
    getAllQuestions(@CurrentUser() user: any) {
        return this.teacherService.getAllQuestions(user.id);
    }

    @Get('getExam/:id')
    getExam(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.teacherService.getExam(Number(id), user.id);
    }
}

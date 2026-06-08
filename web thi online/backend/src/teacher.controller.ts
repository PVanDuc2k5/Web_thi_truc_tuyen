import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
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

}

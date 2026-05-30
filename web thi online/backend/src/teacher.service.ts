import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class TeacherService {
    private supabase = createClient(
        process.env.SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    constructor(private readonly jwtService: JwtService) {}

    // Lấy teacher_id từ token
    private getTeacherIdFromToken(req: any) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Thiếu token');
        }

        const token = authHeader.split(' ')[1];
        let user: any;

        try {
            user = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }

        if (user.role !== 'teacher') {
            throw new ForbiddenException('Bạn không có quyền thực hiện chức năng này');
        }

        return user.id;
    }

    // Tạo token test
    testToken() {
        const token = this.jwtService.sign({
            id: 1,
            role: 'teacher',
        });

        return {
            token,
        };
    }

    // Tạo câu hỏi
    async createQuestion(body: any, req: any) {
        const teacher_id = this.getTeacherIdFromToken(req);
        const { question, answer1, answer2, answer3, answer4, correct } = body;

        if (!question) {
            throw new BadRequestException('Thiếu nội dung câu hỏi');
        }

        const answers = [answer1, answer2, answer3, answer4];

        if (answers.some((a) => !a)) {
            throw new BadRequestException('Phải nhập đủ 4 đáp án');
        }

        const correctIndex = Number(correct);

        if (Number.isNaN(correctIndex) || correctIndex < 1 || correctIndex > 4) {
            throw new BadRequestException('Đáp án đúng không hợp lệ');
        }

        const { data: createdQuestion, error: questionError } = await this.supabase
            .from('questions')
            .insert({
                content: question,
                teacher_id,
            })
            .select()
            .single();

        if (questionError) {
            throw new BadRequestException(questionError.message);
        }

        const answerRows = answers.map((answer, index) => ({
            question_id: createdQuestion.id,
            content: answer,
            is_correct: index + 1 === correctIndex,
        }));

        const { error: answerError } = await this.supabase.from('answers').insert(answerRows);

        if (answerError) {
            throw new BadRequestException(answerError.message);
        }

        return {
            message: 'Tạo câu hỏi thành công',
        };
    }

    // Xoá câu hỏi
    async deleteQuestion(body: any, req: any) {
        const teacher_id = this.getTeacherIdFromToken(req);
        const { id } = body;

        if (!id) {
            throw new BadRequestException('Thiếu question id');
        }

        const { data: question, error: findError } = await this.supabase
            .from('questions')
            .select('*')
            .eq('id', id)
            .eq('teacher_id', teacher_id)
            .single();

        if (findError || !question) {
            throw new BadRequestException('Không tìm thấy câu hỏi hoặc bạn không có quyền xóa');
        }

        const { error: answerError } = await this.supabase
            .from('answers')
            .delete()
            .eq('question_id', id);

        if (answerError) {
            throw new BadRequestException(answerError.message);
        }

        const { error: questionError } = await this.supabase
            .from('questions')
            .delete()
            .eq('id', id)
            .eq('teacher_id', teacher_id);

        if (questionError) {
            throw new BadRequestException(questionError.message);
        }

        return {
            message: 'Xóa câu hỏi thành công',
        };
    }

    // Tạo đề thi
    async createExam(body: any, req: any) {
        const teacher_id = this.getTeacherIdFromToken(req);
        const { title, duration, start_time, end_time, question_ids } = body;

        if (!title) {
            throw new BadRequestException('Thiếu tiêu đề đề thi');
        }

        if (!duration) {
            throw new BadRequestException('Thiếu thời gian làm bài');
        }

        if (!question_ids || question_ids.length === 0) {
            throw new BadRequestException('Phải chọn ít nhất 1 câu hỏi');
        }

        const { data: questions, error: checkError } = await this.supabase
            .from('questions')
            .select('id')
            .in('id', question_ids)
            .eq('teacher_id', teacher_id);

        if (checkError) {
            throw new BadRequestException(checkError.message);
        }

        if (!questions || questions.length !== question_ids.length) {
            throw new BadRequestException('Có câu hỏi không tồn tại hoặc không thuộc giáo viên này');
        }

        const examCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: createdExam, error: examError } = await this.supabase
            .from('exams')
            .insert({
                title,
                duration,
                code: examCode,
                teacher_id,
                status: 'active',
                start_time,
                end_time,
                created_at: new Date(),
            })
            .select()
            .single();

        if (examError) {
            throw new BadRequestException(examError.message);
        }

        const examQuestions = question_ids.map((question_id: number) => ({
            exam_id: createdExam.id,
            question_id,
        }));

        const { error: questionError } = await this.supabase
            .from('exam_questions')
            .insert(examQuestions);

        if (questionError) {
            await this.supabase.from('exams').delete().eq('id', createdExam.id);

            throw new BadRequestException(questionError.message);
        }

        return {
            message: 'Tạo đề thi thành công',
            exam: createdExam,
        };
    }

    // Xoá đề thi
    async deleteExam(body: any, req: any) {
        const teacher_id = this.getTeacherIdFromToken(req);
        const { id } = body;

        if (!id) {
            throw new BadRequestException('Thiếu exam id');
        }

        const { data: exam, error: findError } = await this.supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .eq('teacher_id', teacher_id)
            .single();

        if (findError || !exam) {
            throw new BadRequestException('Không tìm thấy đề thi hoặc bạn không có quyền xóa');
        }

        const { error: examQuestionError } = await this.supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', id);

        if (examQuestionError) {
            throw new BadRequestException(examQuestionError.message);
        }

        const { error: examError } = await this.supabase
            .from('exams')
            .delete()
            .eq('id', id)
            .eq('teacher_id', teacher_id);

        if (examError) {
            throw new BadRequestException(examError.message);
        }

        return {
            message: 'Xóa đề thi thành công',
        };
    }
}

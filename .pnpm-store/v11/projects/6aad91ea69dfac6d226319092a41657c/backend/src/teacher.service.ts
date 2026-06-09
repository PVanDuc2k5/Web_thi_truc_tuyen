import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { randomInt } from 'crypto';

@Injectable()
export class TeacherService {
    constructor(private readonly supabaseService: SupabaseService) {}

    private get supabase() {
        return this.supabaseService.getClient();
    }

    private createExamCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[randomInt(chars.length)];
        }
        return code;
    }

    private async generateUniqueExamCode() {
        for (let attempt = 0; attempt < 10; attempt++) {
            const code = this.createExamCode();

            const { data: existingExam, error } = await this.supabase
                .from('exams')
                .select('id')
                .eq('code', code)
                .maybeSingle();

            if (error) {
                throw new BadRequestException(error.message);
            }

            if (!existingExam) {
                return code;
            }
        }

        throw new BadRequestException('Khong tao duoc ma de thi, vui long thu lai');
    }

    // Tạo câu hỏi
    async createQuestion(body: any, userId: string) {
        const teacher_id = userId;
        const { category, question, answer1, answer2, answer3, answer4, correct } = body;

        if (!category) {
            throw new BadRequestException('Thiếu chuyên mục câu hỏi');
        }

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
                category,
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
    async deleteQuestion(body: any, userId: string) {
        const teacher_id = userId;
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
    async createExam(body: any, userId: string) {
        const teacher_id = userId;
        const { title, duration, status, start_time, end_time, question_ids } = body;

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

        const examCode = await this.generateUniqueExamCode();

        const { data: createdExam, error: examError } = await this.supabase
            .from('exams')
            .insert({
                title,
                duration,
                code: examCode,
                teacher_id,
                status,
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
            examCode,
        };
    }

    // Xoá đề thi
    async deleteExam(body: any, userId: string) {
        const teacher_id = userId;
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

    // Sửa câu hỏi
    async updateQuestion(body: any, userId: string) {
        const teacher_id = userId;
        const { id, category, question, answer1, answer2, answer3, answer4, correct } = body;

        if (!id) {
            throw new BadRequestException('Thiếu question id');
        }

        if (!question) {
            throw new BadRequestException('Thiếu nội dung câu hỏi');
        }

        if (!category) {
            throw new BadRequestException('Thiếu chuyên mục câu hỏi');
        }

        const answers = [answer1, answer2, answer3, answer4];

        if (answers.some((a) => !a)) {
            throw new BadRequestException('Phải nhập đủ 4 đáp án');
        }

        const correctIndex = Number(correct);

        if (Number.isNaN(correctIndex) || correctIndex < 1 || correctIndex > 4) {
            throw new BadRequestException('Đáp án đúng không hợp lệ');
        }

        const { data: oldQuestion, error: findError } = await this.supabase
            .from('questions')
            .select('*')
            .eq('id', id)
            .eq('teacher_id', teacher_id)
            .single();

        if (findError || !oldQuestion) {
            throw new BadRequestException('Không tìm thấy câu hỏi hoặc bạn không có quyền sửa');
        }

        const { error: questionError } = await this.supabase
            .from('questions')
            .update({
                category,
                content: question,
            })
            .eq('id', id)
            .eq('teacher_id', teacher_id);

        if (questionError) {
            throw new BadRequestException(questionError.message);
        }

        const { error: deleteAnswerError } = await this.supabase
            .from('answers')
            .delete()
            .eq('question_id', id);

        if (deleteAnswerError) {
            throw new BadRequestException(deleteAnswerError.message);
        }

        const answerRows = answers.map((answer, index) => ({
            question_id: id,
            content: answer,
            is_correct: index + 1 === correctIndex,
        }));

        const { error: answerError } = await this.supabase
            .from('answers')
            .insert(answerRows);

        if (answerError) {
            throw new BadRequestException(answerError.message);
        }

        return {
            message: 'Cập nhật câu hỏi thành công',
        };
    }

    // Sửa đề thi
    async updateExam(body: any, userId: string) {
        const teacher_id = userId;
        const { id, title, duration, status, start_time, end_time } = body;

        if (!id) {
            throw new BadRequestException('Thiếu exam id');
        }

        if (!title) {
            throw new BadRequestException('Thiếu tiêu đề đề thi');
        }

        if (!duration) {
            throw new BadRequestException('Thiếu thời gian làm bài');
        }

        const { data: exam, error: findError } = await this.supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .eq('teacher_id', teacher_id)
            .single();

        if (findError || !exam) {
            throw new BadRequestException('Không tìm thấy đề thi hoặc bạn không có quyền sửa');
        }

        const { error: updateError } = await this.supabase
            .from('exams')
            .update({
                title,
                duration,
                status,
                start_time,
                end_time,
            })
            .eq('id', id)
            .eq('teacher_id', teacher_id);

        if (updateError) {
            throw new BadRequestException(updateError.message);
        }

        return {
            message: 'Cập nhật đề thi thành công',
        };
    }

    // Lấy dữ liệu dashboard
    async getDashboard(userId: string) {
        const teacher_id = userId;

        const { count: examCount, error: examError } = await this.supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacher_id);

        if (examError) {
            throw new BadRequestException(examError.message);
        }

        const { count: questionCount, error: questionError } = await this.supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacher_id);

        if (questionError) {
            throw new BadRequestException(questionError.message);
        }

        const { data: exams, error: examListError } = await this.supabase
            .from('exams')
            .select('id')
            .eq('teacher_id', teacher_id);

        if (examListError) {
            throw new BadRequestException(examListError.message);
        }

        const examIds = exams.map((exam) => exam.id);

        let studentCount = 0;

        if (examIds.length > 0) {
            const { data: results, error: resultError } = await this.supabase
                .from('results')
                .select('user_id')
                .in('exam_id', examIds);

            if (resultError) {
                throw new BadRequestException(resultError.message);
            }

            const uniqueStudents = new Set(results.map((result) => result.user_id));
            studentCount = uniqueStudents.size;
        }

        return {
            examCount,
            questionCount,
            studentCount,
        };
    }

    // Lấy danh sách exam
    async getAllExams(userId: string) {
        const teacher_id = userId;

        const { data: exams, error: examError } = await this.supabase
            .from('exams')
            .select('id, title, code, status, duration, created_at')
            .eq('teacher_id', teacher_id)
            .order('id', { ascending: false });

        if (examError) {
            throw new BadRequestException(examError.message);
        }

        const result = [];

        for (const exam of exams) {
            const { count: questionCount, error: questionError } = await this.supabase
                .from('exam_questions')
                .select('*', { count: 'exact', head: true })
                .eq('exam_id', exam.id);

            if (questionError) {
                throw new BadRequestException(questionError.message);
            }

            const { data: students, error: studentError } = await this.supabase
                .from('results')
                .select('user_id')
                .eq('exam_id', exam.id);

            if (studentError) {
                throw new BadRequestException(studentError.message);
            }

            const uniqueStudents = new Set(students.map((item) => item.user_id));

            result.push({
                id: exam.id,
                title: exam.title,
                code: exam.code,
                questions: questionCount,
                duration: exam.duration,
                students: uniqueStudents.size,
                status: exam.status,
                created_at: exam.created_at,
            });
        }

        return {
            exams: result,
        };
    }

    // Lấy toàn bộ câu hỏi của giáo viên
    async getAllQuestions(userId: string) {
        const teacher_id = userId;

        const { data: questions, error: questionError } = await this.supabase
            .from('questions')
            .select('*')
            .eq('teacher_id', teacher_id)
            .order('id', { ascending: false });

        if (questionError) {
            throw new BadRequestException(questionError.message);
        }

        const result = [];

        for (const question of questions) {
            const { data: answers, error: answerError } = await this.supabase
                .from('answers')
                .select('*')
                .eq('question_id', question.id)
                .order('id', { ascending: true });

            if (answerError) {
                throw new BadRequestException(answerError.message);
            }

            const correctAnswer = answers.find((a) => a.is_correct);

            result.push({
                id: question.id,
                question: question.content,
                category: question.category,
                answers: answers.map((a) => a.content),
                correct: correctAnswer
                    ? answers.findIndex((a) => a.is_correct) + 1
                    : null,
            });
        }

        return {
            questions: result,
        };
    }

    // Lấy chi tiết 1 exam
    async getExam(id: number, userId: string) {
        const teacher_id = userId;

        if (!id) {
            throw new BadRequestException('Thiếu exam id');
        }

        const { data: exam, error: examError } = await this.supabase
            .from('exams')
            .select('*')
            .eq('id', id)
            .eq('teacher_id', teacher_id)
            .single();

        if (examError || !exam) {
            throw new BadRequestException(
                'Không tìm thấy đề thi hoặc bạn không có quyền truy cập',
            );
        }

        const { data: examQuestions, error: examQuestionError } = await this.supabase
            .from('exam_questions')
            .select('question_id')
            .eq('exam_id', id);

        if (examQuestionError) {
            throw new BadRequestException(examQuestionError.message);
        }

        const questionIds = examQuestions.map((item) => item.question_id);

        let questions: any[] = [];

        if (questionIds.length > 0) {
            const { data: questionData, error: questionError } = await this.supabase
                .from('questions')
                .select('id, content')
                .in('id', questionIds);

            if (questionError) {
                throw new BadRequestException(questionError.message);
            }

            questions = questionData.map((question) => ({
                id: question.id,
                question: question.content,
            }));
        }

        const { data: results, error: resultError } = await this.supabase
            .from('results')
            .select('user_id, score')
            .eq('exam_id', id);

        if (resultError) {
            throw new BadRequestException(resultError.message);
        }

        const uniqueStudents = new Set(results.map((item) => item.user_id));

        let averageScore = 0;

        if (results.length > 0) {
            const totalScore = results.reduce(
                (sum, item) => sum + Number(item.score),
                0,
            );
            averageScore = totalScore / results.length;
        }

        return {
            id: exam.id,
            title: exam.title,
            questions: questions.length,
            duration: exam.duration,
            status: exam.status,
            totalAttempts: uniqueStudents.size,
            averageScore: Number(averageScore.toFixed(2)),
            createdDate: exam.created_at,
            examCode: exam.code,
            startTime: exam.start_time,
            endTime: exam.end_time,
            questionList: questions,
        };
    }
}

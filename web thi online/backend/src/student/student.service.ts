import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StudentService {
  private supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string // Ép kiểu để TS không báo lỗi
  );

  // API 1: Lấy chi tiết đề thi và danh sách câu hỏi
  async getExamForStudent(examId: number) {
    const { data, error } = await this.supabase
      .from('exams')
      .select(`
        id, title, duration, start_time, end_time,
        exam_questions (
          questions (
            id, content,
            answers (id, content) 
          )
        )
      `)
      .eq('id', examId)
      .single();

    if (error || !data) {
      throw new HttpException('Không tìm thấy đề thi', HttpStatus.NOT_FOUND);
    }

    const formattedQuestions = data.exam_questions.map((eq: any) => ({
      id: eq.questions.id,
      content: eq.questions.content,
      answers: eq.questions.answers
    }));

    return {
      exam: {
        id: data.id,
        title: data.title,
        duration: data.duration,
      },
      questions: formattedQuestions
    };
  }
  // API 2: THÊM MỚI - Nộp bài, chấm tự động và lưu kết quả
  async submitExam(userId: number, examId: number, userAnswers: { questionId: number, answerId: number }[]) {
    // 1. Lấy các đáp án ĐÚNG của đề thi này từ bảng answers
    const questionIds = userAnswers.map(a => a.questionId);
    const { data: correctData, error: fetchError } = await this.supabase
      .from('answers')
      .select('id, question_id, is_correct')
      .eq('is_correct', true)
      .in('question_id', questionIds);

    if (fetchError) throw new HttpException('Lỗi khi truy xuất đáp án', HttpStatus.INTERNAL_SERVER_ERROR);

    // 2. Chấm điểm (Mỗi câu đúng được cộng điểm đều nhau)
    let correctCount = 0;
    const totalQuestions = userAnswers.length; 
    
    userAnswers.forEach(ua => {
      const isCorrect = correctData?.some(cd => cd.question_id === ua.questionId && cd.id === ua.answerId);
      if (isCorrect) correctCount++;
    });
    
    // Tính điểm thang 10 (làm tròn 2 chữ số thập phân)
    const score = Math.round((correctCount / totalQuestions) * 10 * 100) / 100; 

    // 3. Lưu tổng quát vào bảng results
    const { data: resultData, error: resultError } = await this.supabase
      .from('results')
      .insert({
        user_id: userId,
        exam_id: examId,
        score: score,
        started_at: new Date().toISOString(), 
        submitted_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (resultError) throw new HttpException('Lỗi khi lưu bảng results', HttpStatus.INTERNAL_SERVER_ERROR);

    // 4. Lưu chi tiết từng câu (để làm tính năng xem lại bài) vào bảng user_answers
    const detailAnswers = userAnswers.map(ua => ({
      result_id: resultData.id,
      question_id: ua.questionId,
      answer_id: ua.answerId
    }));

    await this.supabase.from('user_answers').insert(detailAnswers);

    // Trả kết quả về cho màn hình Frontend hiển thị
    return {
      message: 'Nộp bài thành công',
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions
    };
  }

}
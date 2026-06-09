import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// GỌI ĐỘNG CƠ SUPABASE ĐÃ ĐƯỢC CẤU HÌNH CHUẨN VÀO ĐÂY
// (Nếu file supabase.service.ts nằm ở ngoài thư mục student, dùng ../)
import { SupabaseService } from '../supabase.service'; 

@Injectable()
export class StudentService {
  // Inject SupabaseService thông qua constructor chuẩn của NestJS
  constructor(private readonly supabaseService: SupabaseService) {}

  // Lấy client kết nối an toàn
  private get supabase() {
    return this.supabaseService.getClient();
  }

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
    // 🟢 HỆ THỐNG ĐỊNH VỊ: In ra Terminal để biết Backend đang chạy
    console.log(`\n🚀 [BẮT ĐẦU CHẤM BÀI] Học sinh ID: ${userId} | Đề thi ID: ${examId}`);
    console.log(`📥 Nhận được ${userAnswers.length} câu trả lời từ Frontend...`);

    // 1. Lấy các đáp án ĐÚNG
    const questionIds = userAnswers.map(a => a.questionId);
    const { data: correctData, error: fetchError } = await this.supabase
      .from('answers')
      .select('id, question_id, is_correct')
      .eq('is_correct', true)
      .in('question_id', questionIds);

    if (fetchError) {
      console.error('❌ LỖI LẤY ĐÁP ÁN:', fetchError);
      throw new HttpException('Lỗi khi truy xuất đáp án', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 2. Chấm điểm
    let correctCount = 0;
    const totalQuestions = userAnswers.length; 
    
    if (totalQuestions === 0) {
      throw new HttpException('Bài làm rỗng, chưa chọn đáp án nào!', HttpStatus.BAD_REQUEST);
    }

    userAnswers.forEach(ua => {
      const isCorrect = correctData?.some(cd => cd.question_id === ua.questionId && cd.id === ua.answerId);
      if (isCorrect) correctCount++;
    });
    
    const score = Math.round((correctCount / totalQuestions) * 10);
    console.log(`✅ Chấm xong! Số câu đúng: ${correctCount}/${totalQuestions} | Điểm số: ${score}`);

    // 3. Lưu tổng quát vào bảng results
    console.log('💾 Đang cất điểm vào bảng "results"...');
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

    if (resultError) {
      console.error('❌ LỖI DATABASE (Bảng results):', resultError);
      throw new HttpException('Lỗi khi lưu bảng results', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    console.log(`🎉 Đã lưu thành công điểm số! (Result ID: ${resultData.id})`);

    // 4. Lưu chi tiết từng câu vào bảng user_answers
    console.log('💾 Đang cất chi tiết từng câu vào bảng "user_answers"...');
    const detailAnswers = userAnswers.map(ua => ({
      result_id: resultData.id,
      question_id: ua.questionId,
      answer_id: ua.answerId
    }));

    const { error: detailError } = await this.supabase.from('user_answers').insert(detailAnswers);
    if (detailError) {
      console.error('⚠️ LỖI DATABASE (Bảng user_answers):', detailError);
      // Lỗi chi tiết ta chỉ ghi log, không làm đứt luồng trả điểm cho học sinh
    } else {
      console.log('🎉 Đã cất xong chi tiết bài làm!');
    }

    // Trả kết quả về cho màn hình Frontend hiển thị
    return {
      message: 'Nộp bài thành công',
      score: score,
      correctCount: correctCount,
      totalQuestions: totalQuestions
    };
  }
}
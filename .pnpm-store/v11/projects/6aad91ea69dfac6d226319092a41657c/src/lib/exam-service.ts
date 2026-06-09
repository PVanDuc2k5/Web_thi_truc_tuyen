import { supabase } from './supabase';

export interface Exam {
    id: number;
    title: string;
    duration: number;
    code: string;
    teacher_id: number;
    status: 'draft' | 'published' | 'closed';
    start_time: string;
    end_time: string;
    created_at: string;
}

// Lấy tất cả bài thi của giáo viên
export const getTeacherExams = async (teacherId: number) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy chi tiết một bài thi
export const getExamDetail = async (examId: number) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select(`
        *,
        exam_questions (
          question_id,
          questions (*)
        )
      `)
            .eq('id', examId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Tạo bài thi mới
export const createExam = async (examData: Omit<Exam, 'id' | 'created_at'>) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .insert([examData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật bài thi
export const updateExam = async (examId: number, updates: Partial<Exam>) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .update(updates)
            .eq('id', examId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Xóa bài thi
export const deleteExam = async (examId: number) => {
    try {
        const { error } = await supabase.from('exams').delete().eq('id', examId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

// Lấy bài thi theo mã (cho sinh viên)
export const getExamByCode = async (examCode: string) => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select(`
        *,
        exam_questions (
          question_id,
          questions (
            id,
            content,
            answers (*)
          )
        )
      `)
            .eq('code', examCode)
            .eq('status', 'published')
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy danh sách bài thi cho sinh viên (bài thi hiện tại)
export const getAvailableExams = async () => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('status', 'published')
            .lte('start_time', now)
            .gte('end_time', now)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Thêm câu hỏi vào bài thi
export const addQuestionToExam = async (examId: number, questionId: number) => {
    try {
        const { data, error } = await supabase
            .from('exam_questions')
            .insert([{ exam_id: examId, question_id: questionId }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Xóa câu hỏi khỏi bài thi
export const removeQuestionFromExam = async (examId: number, questionId: number) => {
    try {
        const { error } = await supabase
            .from('exam_questions')
            .delete()
            .eq('exam_id', examId)
            .eq('question_id', questionId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

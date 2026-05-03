import { supabase } from './supabase';

export interface Question {
    id: number;
    content: string;
    teacher_id: number;
}

export interface Answer {
    id: number;
    question_id: number;
    content: string;
    is_correct: boolean;
}

// Lấy tất cả câu hỏi của giáo viên
export const getTeacherQuestions = async (teacherId: number) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select(`
        *,
        answers (*)
      `)
            .eq('teacher_id', teacherId)
            .order('id', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Tạo câu hỏi mới
export const createQuestion = async (questionData: Omit<Question, 'id'>) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .insert([questionData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật câu hỏi
export const updateQuestion = async (questionId: number, updates: Partial<Question>) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .update(updates)
            .eq('id', questionId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Xóa câu hỏi
export const deleteQuestion = async (questionId: number) => {
    try {
        const { error } = await supabase.from('questions').delete().eq('id', questionId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

// Lấy câu hỏi theo ID (kèm đáp án)
export const getQuestionById = async (questionId: number) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select(`
        *,
        answers (*)
      `)
            .eq('id', questionId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy các câu hỏi theo danh sách ID
export const getQuestionsByIds = async (questionIds: number[]) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select(`
        *,
        answers (*)
      `)
            .in('id', questionIds);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Tạo đáp án
export const createAnswer = async (answerData: Omit<Answer, 'id'>) => {
    try {
        const { data, error } = await supabase
            .from('answers')
            .insert([answerData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật đáp án
export const updateAnswer = async (answerId: number, updates: Partial<Answer>) => {
    try {
        const { data, error } = await supabase
            .from('answers')
            .update(updates)
            .eq('id', answerId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Xóa đáp án
export const deleteAnswer = async (answerId: number) => {
    try {
        const { error } = await supabase.from('answers').delete().eq('id', answerId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

import { supabase } from './supabase';

export interface Result {
    id: number;
    user_id: number;
    exam_id: number;
    score: number;
    started_at: string;
    submitted_at: string;
}

export interface UserAnswer {
    id: number;
    result_id: number;
    question_id: number;
    answer_id: number | null;
}

// Tạo result mới (khi sinh viên bắt đầu làm bài)
export const createResult = async (resultData: Omit<Result, 'id'>) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .insert([resultData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật result (lưu điểm)
export const updateResult = async (resultId: number, updates: Partial<Result>) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .update(updates)
            .eq('id', resultId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Nộp bài (submit result)
export const submitResult = async (resultId: number, score: number) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .update({
                score,
                submitted_at: new Date().toISOString(),
            })
            .eq('id', resultId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy tất cả result của một sinh viên
export const getStudentResults = async (studentId: number) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select(`
        *,
        exams (*)
      `)
            .eq('user_id', studentId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy result của sinh viên cho một bài thi
export const getStudentExamResult = async (studentId: number, examId: number) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select(`
        *,
        user_answers (*)
      `)
            .eq('user_id', studentId)
            .eq('exam_id', examId)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy tất cả result cho một bài thi (cho giáo viên)
export const getExamResults = async (examId: number) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select(`
        *,
        user_profiles (*)
      `)
            .eq('exam_id', examId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy result chi tiết
export const getResultDetail = async (resultId: number) => {
    try {
        const { data, error } = await supabase
            .from('results')
            .select(`
        *,
        user_answers (
          *,
          questions (*),
          answers (*)
        )
      `)
            .eq('id', resultId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Tạo user answer
export const createUserAnswer = async (userAnswerData: Omit<UserAnswer, 'id'>) => {
    try {
        const { data, error } = await supabase
            .from('user_answers')
            .insert([userAnswerData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật user answer
export const updateUserAnswer = async (userAnswerId: number, answerId: number | null) => {
    try {
        const { data, error } = await supabase
            .from('user_answers')
            .update({ answer_id: answerId })
            .eq('id', userAnswerId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy user answers của một result
export const getUserAnswersByResult = async (resultId: number) => {
    try {
        const { data, error } = await supabase
            .from('user_answers')
            .select(`
        *,
        questions (*),
        answers (*)
      `)
            .eq('result_id', resultId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

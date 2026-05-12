import { supabase } from './supabase';

export type UserRole = 'teacher' | 'student';

export interface User {
    id: number;
    username: string;
    role: UserRole;
    created_at: string;
}

// Đăng ký
export const signUp = async (username: string, password: string, role: UserRole) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password, role }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Đăng nhập
export const signIn = async (username: string, password: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Lấy user theo ID
export const getUserById = async (id: number) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Cập nhật profile
export const updateProfile = async (userId: number, updates: Partial<User>) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Đổi mật khẩu
export const changePassword = async (userId: number, newPassword: string) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

// Xóa tài khoản
export const deleteAccount = async (userId: number) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', userId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

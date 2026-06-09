-- Tạo enum type cho vai trò người dùng
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

-- Tạo bảng user_profiles
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL,
    role public.user_role NOT NULL DEFAULT 'student',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bật Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Chính sách: Tất cả người dùng đã đăng nhập có thể xem profiles (giúp giáo viên xem thông tin sinh viên)
CREATE POLICY "Allow authenticated users to read profiles" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Chính sách: Người dùng có thể cập nhật profile của chính mình
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);
-- Function tạo user profile khi có user mới đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, username, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::public.user_role,
            'student'::public.user_role
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger tự động tạo profile khi user mới được tạo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_profile();
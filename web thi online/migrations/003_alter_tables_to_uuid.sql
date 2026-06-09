-- 1. Drop foreign key constraints pointing to old users table
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_teacher_id_fkey;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_teacher_id_fkey;
ALTER TABLE public.results DROP CONSTRAINT IF EXISTS results_user_id_fkey;

-- 2. Truncate tables to allow safe integer -> UUID type conversion
TRUNCATE TABLE public.user_answers CASCADE;
TRUNCATE TABLE public.results CASCADE;
TRUNCATE TABLE public.exam_questions CASCADE;
TRUNCATE TABLE public.answers CASCADE;
TRUNCATE TABLE public.questions CASCADE;
TRUNCATE TABLE public.exams CASCADE;

-- 3. Alter column types from integer to UUID
ALTER TABLE public.exams ALTER COLUMN teacher_id TYPE uuid USING null;
ALTER TABLE public.questions ALTER COLUMN teacher_id TYPE uuid USING null;
ALTER TABLE public.results ALTER COLUMN user_id TYPE uuid USING null;

-- 4. Add new foreign key constraints referencing public.user_profiles(user_id)
ALTER TABLE public.exams 
    ADD CONSTRAINT exams_teacher_id_fkey 
    FOREIGN KEY (teacher_id) 
    REFERENCES public.user_profiles(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.questions 
    ADD CONSTRAINT questions_teacher_id_fkey 
    FOREIGN KEY (teacher_id) 
    REFERENCES public.user_profiles(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.results 
    ADD CONSTRAINT results_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.user_profiles(user_id) 
    ON DELETE CASCADE;

-- 5. Drop the old users table
DROP TABLE IF EXISTS public.users;

# Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-stack, production-grade auth system using Supabase Auth, JWT, and RBAC for the Web Thi Online application.

**Architecture:** Supabase Auth for identity + JWT, custom `user_profiles` for RBAC, NestJS backend with guards, React frontend with Zustand state and route guards.

**Tech Stack:** React 18 (Vite), NestJS, Supabase, Zustand, MUI, React Router v6

---

## Phase 1: Database Setup & Migration

### Task 1: Create `user_profiles` Table Migration

**File:** `web thi online/migrations/001_create_user_profiles.sql`

- [ ] **Step 1: Write the SQL migration to create the new table**

```sql
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Notify user to run this migration in their Supabase SQL Editor**

```
Run the SQL above in your Supabase project's SQL Editor to execute the migration.
```

- [ ] **Step 3: Commit the migration file**

```bash
git add web thi online/migrations/001_create_user_profiles.sql
git commit -m "db: add user_profiles table for RBAC"
```

### Task 2: Create Database Trigger for `auth.users` Insert

**File:** `web thi online/migrations/002_create_profile_trigger.sql`

- [ ] **Step 1: Write the trigger to auto-create a profile on new user signup**

```sql
-- Trigger to create a user_profile after a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- We assume the 'role' is passed in the user's metadata on signup.
  -- If role is not provided, it defaults to 'student'.
  INSERT INTO public.user_profiles (user_id, username, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
```

- [ ] **Step 2: Notify user to run this migration**

```
Run the SQL above in your Supabase project's SQL Editor.
```

- [ ] **Step 3: Commit the trigger file**

```bash
git add web thi online/migrations/002_create_profile_trigger.sql
git commit -m "db: add trigger to auto-create user_profile on signup"
```

---

## Phase 2: Backend Implementation (NestJS)

### Task 3: Install Supabase Auth Helpers for NestJS

- [ ] **Step 1: Install dependencies in backend**

```bash
pnpm --filter @web-thi-online/backend add @supabase/supabase-js
```

- [ ] **Step 2: Commit** the `package.json` and `pnpm-lock.yaml` changes.

```bash
git add backend/package.json backend/pnpm-lock.yaml
git commit -m "chore: install @supabase/supabase-js"
```

### Task 4: Create `SupabaseAuthGuard`

**File:** `web thi online/backend/src/guards/supabase-auth.guard.ts`
**Uses:** `web thi online/backend/src/supabase.service.ts`

- [ ] **Step 1: Create the guard file**

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Attach the user object to the request for downstream use
    request.user = user;
    return true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/backend/src/guards/supabase-auth.guard.ts
git commit -m "feat: add SupabaseAuthGuard for JWT validation"
```

### Task 5: Create `@Roles` Decorator and `RolesGuard`

**File 1:** `web thi online/backend/src/decorators/roles.decorator.ts`
**File 2:** `web thi online/backend/src/guards/roles.guard.ts`
**File 3:** `web thi online/backend/src/decorators/user.decorator.ts`

- [ ] **Step 1: Create the `@Roles` decorator**

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../types/roles';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 2: Create the `UserRole` type**

```typescript
// web thi online/backend/src/types/roles.ts
export type UserRole = 'student' | 'teacher' | 'admin';
```

- [ ] **Step 3: Create the `RolesGuard`**

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../types/roles';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { data: profile, error } = await this.supabaseService.getClient()
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      throw new ForbiddenException('User profile not found');
    }

    if (!requiredRoles.includes(profile.role as UserRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

- [ ] **Step 4: Create the `@CurrentUser` decorator**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
```

- [ ] **Step 5: Commit all new files**

```bash
git add web thi online/backend/src/decorators/
git add web thi online/backend/src/guards/roles.guard.ts
git add web thi online/backend/src/types/roles.ts
git add web thi online/backend/src/decorators/user.decorator.ts
git commit -m "feat: add RBAC guards and decorators"
```

### Task 6: Create `AuthController` and `AuthService`

**File 1:** `web thi online/backend/src/auth/auth.controller.ts`
**File 2:** `web thi online/backend/src/auth/auth.service.ts`
**File 3:** `web thi online/backend/src/auth/auth.module.ts`

- [ ] **Step 1: Create `AuthService`**

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error('Could not fetch user profile');
    }
    return data;
  }

  // Placeholder for future password reset logic or custom auth needs
}
```

- [ ] **Step 2: Create `AuthController`**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    const profile = await this.authService.getUserProfile(user.id);
    return {
      user: user,
      profile: profile,
    };
  }
}
```

- [ ] **Step 3: Create `AuthModule`**

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    // ... other imports if needed
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
```

- [ ] **Step 4: Commit**

```bash
git add web thi online/backend/src/auth/
git commit -m "feat: add AuthController, AuthService, and AuthModule"
```

### Task 7: Update `TeacherController` to Use Guards

**File:** `web thi online/backend/src/teacher.controller.ts`

- [ ] **Step 1: Modify imports and add guards**

```typescript
import { Controller, Get, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@UseGuards(SupabaseAuthGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // Apply roles directly on the methods that require them
  @Get('test-token')
  @Roles('teacher') // Only teachers
  testToken() {
    return this.teacherService.testToken();
  }

  @Post('createQuestion')
  @Roles('teacher')
  async createQuestion(@Body() body: any, @Req() req: any) {
    return this.teacherService.createQuestion(body, req);
  }

  @Delete('deleteQuestion')
  @Roles('teacher')
  deleteQuestion(@Body() body: any, @Req() req: any) {
    return this.teacherService.deleteQuestion(body, req);
  }

  @Post('createExam')
  @Roles('teacher')
  async createExam(@Body() body: any, @Req() req: any) {
    return this.teacherService.createExam(body, req);
  }

  @Delete('deleteExam')
  @Roles('teacher')
  deleteExam(@Body() body: any, @Req() req: any) {
    return this.teacherService.deleteExam(body, req);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/backend/src/teacher.controller.ts
git commit -m "feat: secure teacher endpoints with SupabaseAuthGuard and RolesGuard"
```

---

## Phase 3: Frontend Implementation (React)

### Task 8: Install Zustand

**Command:**

```bash
pnpm add zustand
```

- [ ] **Step 1: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install zustand for state management"
```

### Task 9: Create Zustand Auth Store

**File:** `web thi online/src/lib/auth-store.ts`

- [ ] **Step 1: Write the Zustand store**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase'; // Existing supabase client

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  username: string;
}

interface AuthState {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, role: user.role, isAuthenticated: true, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      login: (token, user) =>
        set({
          token,
          user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
        }),
      logout: () =>
        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/lib/auth-store.ts
git commit -m "feat: add zustand auth store for state management"
```

### Task 10: Create `apiClient` with Auth Interceptors

**File:** `web thi online/src/lib/api-client.ts`

- [ ] **Step 1: Write the API client**

```typescript
import axios from 'axios';
import { useAuthStore } from './auth-store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/lib/api-client.ts
git commit -m "feat: add apiClient with auth interceptors"
```

### Task 11: Create `AuthProvider` Component

**File:** `web thi online/src/app/providers/AuthProvider.tsx`

- [ ] **Step 1: Write the provider**

```typescript
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth-store';
import apiClient from '../../lib/api-client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Fetch user profile from NestJS backend
          const { data } = await apiClient.get('/auth/me');
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: data.profile.role,
            username: data.profile.username,
          });
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          // If /auth/me fails, clear state
          useAuthStore.getState().logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         // Will be handled by the initAuth logic or login flow
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/app/providers/AuthProvider.tsx
git commit -m "feat: add AuthProvider for initializing and syncing auth state"
```

### Task 12: Create `ProtectedRoute` Component

**File:** `web thi online/src/app/components/ProtectedRoute.tsx`

- [ ] **Step 1: Write the route guard**

```typescript
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../../lib/auth-store';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectPath = '/' }: ProtectedRouteProps) {
  const { user, role, isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(role!)) {
    return <div>Forbidden: You do not have access to this page.</div>; // Or a proper 403 page
  }

  return <Outlet />;
}
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/app/components/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component for RBAC"
```

### Task 13: Update `routes.tsx`

**File:** `web thi online/src/app/routes.tsx`

- [ ] **Step 1: Wrap protected routes in `ProtectedRoute`**

```tsx
import { createBrowserRouter } from 'react-router';
// ... other imports
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/teacher',
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    children: [
      { index: true, Component: TeacherDashboard },
      { path: 'my-exams', Component: MyExams },
      { path: 'questions', Component: QuestionManagement },
      { path: 'exam-builder', Component: ExamBuilder },
      { path: 'exam/:examId', Component: ExamDetail },
      { path: 'profile', Component: TeacherProfilePage },
    ],
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      { index: true, Component: StudentDashboard },
      { path: 'results', Component: MyResults },
      { path: 'exam/:examId', Component: ExamPage },
      { path: 'result/:examId', Component: ResultPage },
      { path: 'profile', Component: StudentProfilePage },
    ],
  },
]);
```

**Note:** You will need to ensure `TeacherLayout` and `StudentLayout` are correctly integrated or used within these routes. If they are wrappers, they should be applied to the `ProtectedRoute` or as part of the children's layout.

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/app/routes.tsx
git commit -m "feat: implement route guards for RBAC"
```

### Task 14: Update `Login.tsx` and `Register.tsx`

**File 1:** `web thi online/src/app/pages/auth/Login.tsx`
**File 2:** `web thi online/src/app/pages/auth/Register.tsx`

- [ ] **Step 1: Update `Login.tsx` to use Supabase Auth**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container } from '@mui/material';
import { School } from '@mui/icons-material';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.user) {
      // Fetch user profile from backend to get role and username
      try {
        const { data: profileData } = await apiClient.get('/auth/me');
        const { user } = data;
        const { profile } = profileData;

        useAuthStore.getState().login(data.session!.access_token, {
          id: user.id,
          email: user.email!,
          role: profile.role,
          username: profile.username,
        });

        // Redirect based on role
        if (profile.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <Card elevation={8}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <School sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h4" fontWeight={600} gutterBottom>Online Exam System</Typography>
              <Typography variant="body2" color="text.secondary">Sign in to continue</Typography>
            </Box>
            <form onSubmit={handleLogin}>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Sign In</Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Don't have an account?{' '}<Button onClick={() => navigate('/register')} sx={{ textTransform: 'none' }}>Register</Button></Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
```

- [ ] **Step 2: Update `Register.tsx` to use Supabase Auth**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/auth-store';
import apiClient from '../../../lib/api-client';
import { TextField, Button, Box, Typography, Card, CardContent, Container, MenuItem } from '@mui/material';
import { School } from '@mui/icons-material';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      // Log the user in immediately after sign up if not requiring email confirmation
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInData.session) {
        const { data: profileData } = await apiClient.get('/auth/me');
        const { user } = signInData;
        const { profile } = profileData;

        useAuthStore.getState().login(signInData.session.access_token, {
          id: user.id,
          email: user.email!,
          role: profile.role,
          username: profile.username,
        });

        // Redirect based on role
        if (profile.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container maxWidth="sm">
        <Card elevation={8}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <School sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h4" fontWeight={600} gutterBottom>Create Account</Typography>
              <Typography variant="body2" color="text.secondary">Register to get started</Typography>
            </Box>
            <form onSubmit={handleRegister}>
              {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
              <TextField fullWidth label="Email" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField fullWidth label="Username" variant="outlined" margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <TextField fullWidth select label="Role" value={role} onChange={(e) => setRole(e.target.value as 'student' | 'teacher')} margin="normal">
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
              </TextField>
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>Register</Button>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Already have an account?{' '}<Button onClick={() => navigate('/')} sx={{ textTransform: 'none' }}>Sign In</Button></Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
```

**Note:** Ensure that `Supabase` is configured to confirm emails if desired. If not, the `signUp` function will work seamlessly.

- [ ] **Step 3: Commit**

```bash
git add web thi online/src/app/pages/auth/Login.tsx
git add web thi online/src/app/pages/auth/Register.tsx
git commit -m "feat: update Login and Register to use Supabase Auth"
```

### Task 15: Update `App.tsx` to include `AuthProvider`

**File:** `web thi online/src/app/App.tsx`

- [ ] **Step 1: Wrap the app with the provider**

```tsx
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import AuthProvider from './providers/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web thi online/src/app/App.tsx
git commit -m "feat: wrap app with AuthProvider"
```

### Task 16: Update `UserDropdown` and Layouts

**File 1:** `web thi online/src/app/components/shared/UserDropdown.tsx`
**File 2:** `web thi online/src/app/components/layouts/TeacherLayout.tsx`
**File 3:** `web thi online/src/app/components/layouts/StudentLayout.tsx`

- [ ] **Step 1: Update `UserDropdown` to use real data**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { Person, Logout } from '@mui/icons-material';
import { useAuthStore } from '../../../lib/auth-store';

export default function UserDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate(`/${user?.role}/profile`);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const getAvatarColor = () => {
    switch (user?.role) {
      case 'teacher': return '#667eea';
      case 'student': return '#4facfe';
      default: return '#667eea';
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight={600}>{user?.username || user?.email}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
        </Box>
        <IconButton onClick={handleClick} size="small">
          <Avatar sx={{ bgcolor: getAvatarColor(), width: 40, height: 40 }}>
            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Box>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ elevation: 3, sx: { mt: 1.5, minWidth: 200 } }}>
        <MenuItem onClick={handleProfile}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
```

- [ ] **Step 2: Update `TeacherLayout` and `StudentLayout` to remove hardcoded `username` and `role` props**

**`TeacherLayout.tsx`:**

Change the line:
```tsx
<UserDropdown username="teacher_user" role="teacher" />
```
to:
```tsx
<UserDropdown />
```

Similarly for `StudentLayout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add web thi online/src/app/components/shared/UserDropdown.tsx
git add web thi online/src/app/components/layouts/TeacherLayout.tsx
git add web thi online/src/app/components/layouts/StudentLayout.tsx
git commit -m "feat: wire up UserDropdown and layouts with real auth state"
```

---

## Phase 4: Cleanup & Verification

### Task 17: Clean Up Old Auth Code

- [ ] **Step 1: Remove `src/lib/auth.ts`**

This file is from the old custom auth system. Remove it and update any remaining imports if present.

```bash
git rm web thi online/src/lib/auth.ts
git commit -m "chore: remove old custom auth logic"
```

- [ ] **Step 2: Search for old auth imports**

```bash
grep -r "from '../lib/auth'" web thi online/src/ || echo "No old imports found"
```

### Task 18: Run the Application

- [ ] **Step 1: Start the backend**

```bash
pnpm --filter @web-thi-online/backend dev
```

- [ ] **Step 2: Start the frontend**

```bash
pnpm dev
```

- [ ] **Step 3: Verify the auth flow**

1. Go to `http://localhost:5173/` (or your frontend URL).
2. Try to register a new user.
3. Check the `user_profiles` table in Supabase to see if the user was created with the correct role.
4. Try to log in with the newly created user.
5. Verify that you are redirected to the correct dashboard (`/teacher` or `/student`).
6. Try to access a protected route directly (e.g., `/teacher` as a logged-out user) — should redirect to `/`.
7. Try to access a route with the wrong role (e.g., `/teacher` as a `student`) — should show a forbidden message.
8. Try to make an API request to a protected backend endpoint without a token — should return 401.
9. Check the `UserDropdown` to see if the real username and role are displayed.

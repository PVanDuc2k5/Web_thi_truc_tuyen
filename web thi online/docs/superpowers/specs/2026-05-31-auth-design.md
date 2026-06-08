# Auth Feature Design: Robust JWT + RBAC

**Date**: 2026-05-31  
**Status**: Review  
**Scope**: Full-stack auth implementation (backend + frontend)

## 1. Overview

Implement a production-grade authentication and authorization system for the Web Thi Online (Online Exam System) using **Supabase Auth** for identity management, **JWT tokens** for session handling, and **Role-Based Access Control (RBAC)** for authorization. Password hashing is handled natively by Supabase Auth. The system must be extensible to support additional roles (e.g., `admin`) beyond the current `teacher` and `student`.

## 2. Architecture

### 2.1 High-Level Data Flow

```
┌─────────────────────┐         Sign Up / Sign In          ┌──────────────────┐
│     Frontend        │ ────────────────────────────────────►│   Supabase       │
│     (React)         │                                      │      Auth        │
└─────────────────────┘                                      └───────┬──────────┘
        │                                                            │
        │  Receives JWT access_token                                   │
        │◄───────────────────────────────────────────────────────────────┘
        │
        │  Stores token in Zustand
        │  (persisted to localStorage)
        │
        │  API calls with
        │  Authorization: Bearer <token>
        │
        ▼
┌─────────────────────┐     Validates JWT                   ┌──────────────────┐
│   Backend           │  ──────────────────────────────────►│   Supabase       │
│   (NestJS)          │                                     │      JWKS        │
└─────────────────────┘                                     └──────────────────┘
        │
        │  JWT valid → extracts user.id
        │  Queries user_profiles for role
        │
        ▼
     RBAC Check (RolesGuard)
        │
        ▼
    Route Handler
```

### 2.2 Components

#### Backend (NestJS)

| Component | Description |
|-----------|-------------|
| `SupabaseAuthGuard` | Validates the JWT from the `Authorization` header by calling Supabase. Attaches the `user` object to the request. |
| `RolesGuard` | Checks if the user's role (from `user_profiles` table) is allowed to access a route. Uses a `@Roles()` decorator. |
| `AuthController` | Exposes `/auth/me` endpoint to return the current user's profile (for frontend hydration). |
| `AuthService` | Encapsulates user profile queries, role lookups, and any custom auth logic. |
| `AuthModule` | Groups auth guards, services, and controllers together. |

#### Frontend (React + Vite)

| Component | Description |
|-----------|-------------|
| `useAuthStore` (Zustand) | Global auth state: `user`, `role`, `token`, `isAuthenticated`. Persists to `localStorage`. |
| `AuthProvider` (Context/Zustand) | Wraps the app, listens to Supabase auth state changes. |
| `ProtectedRoute` | React Router component. Redirects to login if unauthenticated, or shows 403 if role is unauthorized. |
| `apiClient` | Axios/fetch wrapper that automatically attaches the `Authorization` header, handles 401, injects token. |
| `Login.tsx` / `Register.tsx` | Updated to use Supabase Auth client methods. |

#### Database (Supabase PostgreSQL)

| Table | Description |
|-------|-------------|
| `auth.users` (managed by Supabase) | Stores email, hashed password, email verification status, etc. |
| `public.user_profiles` | Custom table linked to `auth.users` by `user_id (UUID)`. Stores `role`, `username`, `created_at`, etc. |

### 2.3 Role Model (RBAC)

- Roles are stored in `public.user_profiles.role` as an enum: `teacher`, `student`, `admin` (extensible).
- Backend: `@Roles('teacher')` decorator on controllers/routes. `RolesGuard` reads the user's role from `user_profiles`.
- Frontend: Route guards check `user.role` from Zustand store.

## 3. Data Flow

### 3.1 Sign Up

1. Frontend calls `supabase.auth.signUp({ email, password, options: { data: { username, role } } })`.
2. Supabase creates a user in `auth.users`.
3. `on_auth_user_created` trigger fires, creating a row in `public.user_profiles` with `user_id`, `username`, and `role`.
4. Optionally, Supabase sends an email confirmation link.

### 3.2 Sign In

1. Frontend calls `supabase.auth.signInWithPassword({ email, password })`.
2. Supabase returns `access_token` (JWT), `refresh_token`, and `user` object.
3. Frontend stores `access_token` in Zustand (persisted to `localStorage`).
4. Frontend calls `GET /auth/me` (with JWT) to get the `role`.
5. Zustand state is hydrated: `user`, `role`, `token`, `isAuthenticated = true`.

### 3.3 API Request (Authenticated)

1. Frontend `apiClient` attaches `Authorization: Bearer <token>` header.
2. Backend `SupabaseAuthGuard` verifies the JWT with Supabase (via `getUser()`).
3. Backend extracts `user.id` from the JWT payload.
4. Backend queries `user_profiles` for the role.
5. `RolesGuard` checks if the user's role is in the allowed list for the route.
6. Route handler executes.

### 3.4 Initial Page Load / Hydration

1. App loads. `AuthProvider` calls `supabase.auth.getSession()`.
2. If a valid session exists, `apiClient` calls `GET /auth/me` to get the user's role.
3. If `auth/me` succeeds, Zustand state is updated with user data and `isAuthenticated = true`.
4. If the session is invalid or expired, the user is redirected to `/login`.

## 4. Error Handling

- **401 Unauthorized**: Supabase Auth returns 401 for invalid/expired tokens. The frontend should clear the auth state and redirect to `/login`.
- **403 Forbidden**: `RolesGuard` returns 403 if the user's role doesn't match the required role. The frontend should show a 403 page.
- **Supabase Error (500/503)**: Retry with exponential backoff or show a generic "Service Unavailable" error.
- **Network Error**: Frontend should gracefully handle network failures (e.g., show a toast notification, allow retry).

## 5. Testing Strategy

### 5.1 Authentication
- Verify a user can sign up and receive a confirmation email.
- Verify a user can sign in and receive a valid JWT.
- Verify the JWT is correctly attached to API requests.
- Verify an invalid JWT returns 401.

### 5.2 Authorization
- Verify a `student` cannot access `teacher` routes (403).
- Verify a `teacher` can access `teacher` routes (200).
- Verify a user without a verified email is handled correctly (if required).

### 5.3 Frontend
- Verify `ProtectedRoute` redirects unauthenticated users to `/login`.
- Verify `ProtectedRoute` redirects unauthorized users (wrong role) to a 403 page.
- Verify the `UserDropdown` displays the correct username and role.

## 6. Data Model

### 6.1 `public.user_profiles`

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

-- Enable RLS
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

### 6.2 Migration from Old `users` Table

The old auth system stored users in `public.users` with a plaintext password. We will:
1. Create the new `public.user_profiles` table.
2. Run a script to migrate existing users to Supabase Auth (requiring them to set a new password via a password reset link, as we cannot migrate plaintext passwords securely).
3. Update the application to use the new `auth.users` and `public.user_profiles` tables.
4. Drop the old `public.users` table after successful migration.

**Note**: Since the old passwords are in plaintext, we cannot simply hash them. We will need existing users to reset their passwords.

## 7. API Design

### 7.1 Auth Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/me` | `GET` | Yes | Returns the current user's profile (id, username, role). |

### 7.2 Teacher Endpoints

All existing `/teacher/*` endpoints (e.g., `createQuestion`, `createExam`) will be updated to require the `teacher` role using the `@Roles('teacher')` decorator. They will receive the `user` object from the request (injected by `SupabaseAuthGuard`).

## 8. Frontend Integration

### 8.1 Zustand Store

```typescript
interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}
```

### 8.2 Route Guards

The `routes.tsx` will be updated to use `ProtectedRoute` components:

```tsx
<Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
  <Route path="/teacher" element={<TeacherLayout />} />
  {/* ... teacher routes ... */}
</Route>

<Route element={<ProtectedRoute allowedRoles={['student']} />}>
  <Route path="/student" element={<StudentLayout />} />
  {/* ... student routes ... */}
</Route>
```

### 8.3 Axios/Fetch Interceptor

A global API client will be created that:
- Reads the token from the Zustand store.
- Attaches `Authorization: Bearer <token>` to every request.
- Handles 401 errors by clearing the store and redirecting to `/login`.

## 9. Migration Plan

1. **Database**:
   - Create `public.user_profiles` table (SQL migration).
   - Set up RLS policies.
   - Create a temporary script to invite existing users to reset their password via Supabase.

2. **Backend**:
   - Install `@supabase/supabase-js`.
   - Create `SupabaseAuthGuard` and `RolesGuard`.
   - Create `AuthModule` with `AuthController` and `AuthService`.
   - Update `TeacherController` to use guards.

3. **Frontend**:
   - Install `zustand`.
   - Create `useAuthStore` with persistence.
   - Update `Login.tsx` and `Register.tsx` to use `supabase.auth` methods.
   - Update `App.tsx` to wrap with an `AuthProvider`.
   - Update `routes.tsx` with `ProtectedRoute`.
   - Create the `apiClient` with interceptors.
   - Wire up `UserDropdown` to show real user data.

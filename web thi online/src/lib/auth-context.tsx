import { createContext, useContext, useState } from 'react';
import { User } from './auth';
import { signIn as signInAuth, signUp as signUpAuth } from './auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (username: string, password: string) => Promise<void>;
    signUp: (username: string, password: string, role: 'teacher' | 'student') => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        // Lấy user từ localStorage khi app load
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);

    const signIn = async (username: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await signInAuth(username, password);
            if (error) throw error;

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (username: string, password: string, role: 'teacher' | 'student') => {
        setLoading(true);
        try {
            const { data, error } = await signUpAuth(username, password, role);
            if (error) throw error;

            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        } finally {
            setLoading(false);
        }
    };

    const signOut = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

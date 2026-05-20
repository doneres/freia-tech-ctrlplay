import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  updateUser: (updates: Partial<Pick<AuthUser, 'nome' | 'email' | 'telefone' | 'fotoPerfil'>>) => void;
  hasPermissao: (permissao: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const signIn = useCallback((authUser: AuthUser) => {
    localStorage.setItem('auth', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('auth');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<Pick<AuthUser, 'nome' | 'email' | 'telefone' | 'fotoPerfil'>>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      localStorage.setItem('auth', JSON.stringify(next));
      return next;
    });
  }, []);

  const hasPermissao = useCallback((permissao: string) => {
    if (!user) return false;
    if (user.perfil === 'ADMINISTRADOR') return true;
    return (user.permissoes ?? []).includes(permissao);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser, hasPermissao, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

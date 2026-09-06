import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * 인증 상태 뼈대.
 * TODO: 실제 로그인 API(/api/auth/login) 연동 및 토큰 저장 전략(HttpOnly 쿠키 권장) 확정.
 */
const AuthContext = createContext(null);

const STORAGE_KEY = 'changupon.auth';

function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitial);

  const login = useCallback((profile) => {
    // TODO: 서버 응답으로 교체
    const next = { id: 'demo', name: '데모 사용자', ...profile };
    setUser(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

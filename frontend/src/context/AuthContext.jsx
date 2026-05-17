import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({ user: null, loading: false });

function parseStoredUser() {
  try {
    const raw = localStorage.getItem('bidit_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => parseStoredUser());

  useEffect(() => {
    const sync = () => setUser(parseStoredUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const value = useMemo(() => ({ user, loading: false }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext } from 'react';

const AuthContext = createContext({ user: null, loading: false });

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={{ user: null, loading: false }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

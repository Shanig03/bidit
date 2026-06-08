import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../firebase/firebaseConfig';
import { getUserProfile } from '../api/usersApi';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateLocalUser: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const dbProfile = await getUserProfile(firebaseUser.uid);

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            token,
            ...dbProfile,
            role: (dbProfile?.role || 'USER').toUpperCase(),
          });
        } catch (error) {
          console.error("Failed to fetch user profile from DynamoDB:", error);

          const token = await firebaseUser.getIdToken();

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            token,
            role: 'USER',
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateLocalUser = (updatedFields) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedFields }));
  };

  const value = {
    user,
    loading,
    login: authService.login,
    register: authService.register,
    loginWithGoogle: authService.loginWithGoogle,
    logout: authService.logout,
    updateLocalUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
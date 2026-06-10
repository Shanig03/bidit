import { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { authService, realtimeDb } from '../firebase/firebaseConfig';
import { getUserProfile } from '../api/usersApi';

const BLOCKED_MESSAGE = 'Your account has been blocked by an admin.';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateLocalUser: () => {}
});

function normalizeRole(role) {
  return String(role || 'USER').toUpperCase();
}

function normalizeStatus(status) {
  return String(status || 'ACTIVE').toUpperCase();
}

function storeBlockedMessage() {
  sessionStorage.setItem('authBlockedMessage', BLOCKED_MESSAGE);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const dbProfile = await getUserProfile(firebaseUser.uid);

          const status = normalizeStatus(dbProfile?.status);

          if (status === 'BLOCKED') {
            await authService.logout();
            setUser(null);
            storeBlockedMessage();
            return;
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            token,
            ...dbProfile,
            role: normalizeRole(dbProfile?.role),
            status
          });
        } catch (error) {
          console.error('Failed to fetch user profile from DynamoDB:', error);

          const token = await firebaseUser.getIdToken();

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            token,
            role: 'USER',
            status: 'ACTIVE'
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const userStatusRef = ref(realtimeDb, `userStatuses/${user.uid}/status`);

    const unsubscribeStatus = onValue(userStatusRef, async (snapshot) => {
      const realtimeStatus = normalizeStatus(snapshot.val());

      if (realtimeStatus === 'BLOCKED') {
        storeBlockedMessage();
        await authService.logout();
        setUser(null);
      }
    });

    return () => unsubscribeStatus();
  }, [user?.uid]);

  const updateLocalUser = (updatedFields) => {
    setUser((prevUser) => ({
      ...(prevUser || {}),
      ...updatedFields,
    }));
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
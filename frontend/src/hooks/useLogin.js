import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../api/usersApi';
import { USER_ROLES } from '../../constants/authConstants';

const BLOCKED_MESSAGE = 'Your account has been blocked by an admin.';

function normalizeRole(role) {
  return String(role || USER_ROLES.USER).toUpperCase();
}

function normalizeStatus(status) {
  return String(status || 'ACTIVE').toUpperCase();
}

function getRedirectPathByRole(role) {
  return role === USER_ROLES.ADMIN ? '/admin/users' : '/';
}

function getInitialBlockedMessage() {
  return sessionStorage.getItem('authBlockedMessage') || '';
}

async function validateUserIsNotBlocked(firebaseCredential, logout) {
  const firebaseUser = firebaseCredential?.user;

  if (!firebaseUser?.uid) {
    throw new Error('Failed to load user data.');
  }

  const dbProfile = await getUserProfile(firebaseUser.uid);
  const status = normalizeStatus(dbProfile?.status);

  if (status === 'BLOCKED') {
    sessionStorage.setItem('authBlockedMessage', BLOCKED_MESSAGE);
    await logout();
    throw new Error(BLOCKED_MESSAGE);
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    ...dbProfile,
    role: normalizeRole(dbProfile?.role),
    status,
  };
}

export function useLogin() {
  const {
    user,
    loading: authLoading,
    login,
    loginWithGoogle,
    logout,
    updateLocalUser,
  } = useAuth();

  const navigate = useNavigate();

  const [error, setError] = useState(getInitialBlockedMessage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !sessionStorage.getItem('authBlockedMessage')) {
      const role = normalizeRole(user.role);
      navigate(getRedirectPathByRole(role), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const executeLogin = async (email, password) => {
    sessionStorage.removeItem('authBlockedMessage');
    setError('');
    setLoading(true);

    try {
      const credential = await login(email, password);
      const localUser = await validateUserIsNotBlocked(credential, logout);

      updateLocalUser(localUser);

      navigate(getRedirectPathByRole(localUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleLogin = async () => {
    sessionStorage.removeItem('authBlockedMessage');
    setError('');
    setLoading(true);

    try {
      const credential = await loginWithGoogle();
      const localUser = await validateUserIsNotBlocked(credential, logout);

      updateLocalUser(localUser);

      navigate(getRedirectPathByRole(localUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}
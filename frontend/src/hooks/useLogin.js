import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../api/usersApi';
import { USER_ROLES } from '../../constants/authConstants';

function buildRedirectPath(fromLocation, role) {
  if (fromLocation?.pathname) {
    return `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`;
  }

  if (typeof fromLocation === 'string') {
    return fromLocation;
  }

  return role === USER_ROLES.ADMIN ? '/admin/users' : '/dashboard';
}

async function getRedirectRole(firebaseCredential) {
  const firebaseUser = firebaseCredential?.user;

  if (!firebaseUser?.uid) {
    return USER_ROLES.USER;
  }

  try {
    const dbProfile = await getUserProfile(firebaseUser.uid);
    return (dbProfile?.role || USER_ROLES.USER).toUpperCase();
  } catch {
    return USER_ROLES.USER;
  }
}

export function useLogin() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeLogin = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      const credential = await login(email, password);
      const role = await getRedirectRole(credential);
      const redirectPath = buildRedirectPath(fromLocation, role);

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const credential = await loginWithGoogle();
      const role = await getRedirectRole(credential);
      const redirectPath = buildRedirectPath(fromLocation, role);

      navigate(redirectPath, { replace: true });
    } catch {
      setError('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}
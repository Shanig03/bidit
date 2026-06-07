import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;
  const redirectPath = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`
    : '/dashboard';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
      await loginWithGoogle();
      navigate(redirectPath, { replace: true });
    } catch {
      setError('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}

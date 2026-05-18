import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard'); 
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
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}
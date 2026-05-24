// hooks/useLogout.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeLogout = async () => {
    setError('');
    setLoading(true);
    try {
      await logout();
      navigate('/login'); // Redirect to login or home ('/') after logging out
    } catch (err) {
      setError(err.message || 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogout, error, loading };
}
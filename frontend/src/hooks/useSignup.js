import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useSignup() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeSignup = async (email, password, username) => {
    setError('');
    setLoading(true);
    try {
      await register(email, password, username);
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // Optional: Call your usersApi here to create the DynamoDB record for the new user
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeSignup, executeGoogleSignup, error, loading };
}
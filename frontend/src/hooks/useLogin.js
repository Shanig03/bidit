import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../api/usersApi'; // <-- Added API import

export function useLogin() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      // Standard email/password login.
      // We don't call createUserProfile here because if they are logging in 
      // with a password, they MUST have already signed up and been added to the DB.
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
      // 1. Authenticate with Google
      const userCredential = await loginWithGoogle();
      const user = userCredential.user;

      // 2. Sync profile data to DynamoDB
      // We use 'displayName' to match your updated Python Lambda schema
      await createUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName, 
        profilePic: user.photoURL || ""
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}
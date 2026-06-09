import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../api/usersApi';

export function useSignup() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const executeSignup = async (email, password, username) => {
    setError('');
    setLoading(true);
    try {
      // 1. Authenticate with Firebase 
      // (Your firebaseConfig.js already handles updateProfile internally!)
      const userCredential = await register(email, password, username);
      const user = userCredential.user;

      // 2. Sync profile data to DynamoDB
      await createUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: username // <-- CHANGED from 'username' to 'displayName'
      });

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
      const userCredential = await loginWithGoogle();
      const user = userCredential.user;

      await createUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName, // <-- CHANGED from 'username' to 'displayName'
        profilePic: user.photoURL || ""
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeSignup, executeGoogleSignup, error, loading };
}
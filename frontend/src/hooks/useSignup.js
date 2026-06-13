import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../api/usersApi';

export function useSignup() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // UC-01: Starts the email and password sign up flow.
  const executeSignup = async (email, password, username) => {
    setError('');
    setLoading(true);
    try {
      // UC-01: Creates the Firebase Auth user with email and password.
      // 1. Authenticate with Firebase 
      // (Your firebaseConfig.js already handles updateProfile internally!)
      const userCredential = await register(email, password, username);
      const user = userCredential.user;

      // UC-01: Saves the new user's profile in DynamoDB through the users API.
      // 2. Sync profile data to DynamoDB
      // UC-02: The Firebase UID is used as the same user id in DynamoDB.
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

  // UC-02: Starts Google sign-up and then syncs that user to our database.
  const executeGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      // UC-02: Firebase handles the Google OAuth popup and gives us the Firebase user.
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
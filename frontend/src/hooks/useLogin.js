import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../api/usersApi'; // <-- Added API import
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

// UC-05: Checks DynamoDB status so blocked users are signed out right away.
async function validateUserIsNotBlocked(firebaseCredential, logout) {
  const firebaseUser = firebaseCredential?.user;

  if (!firebaseUser?.uid) {
    throw new Error('Failed to load user data.');
  }

  // UC-02/UC-03: Loads the DynamoDB profile that matches the Firebase UID.
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

  // UC-03: Sends already logged-in users to the right page for their role.
  useEffect(() => {
    if (!authLoading && user && !sessionStorage.getItem('authBlockedMessage')) {
      const role = normalizeRole(user.role);
      navigate(getRedirectPathByRole(role), { replace: true });
    }
  }, [authLoading, user, navigate]);

  // UC-03: Starts the email and password login flow.
  const executeLogin = async (email, password) => {
    sessionStorage.removeItem('authBlockedMessage');
    setError('');
    setLoading(true);

    try {
      // UC-03: Firebase verifies the email/password and returns the logged-in user.
      const credential = await login(email, password);
      const localUser = await validateUserIsNotBlocked(credential, logout);

      // UC-03: Stores the user profile/token info locally before redirecting by role.
      updateLocalUser(localUser);

      navigate(getRedirectPathByRole(localUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  // UC-02: Starts Google login/sign-up for returning or new Google users.
  const executeGoogleLogin = async () => {
    sessionStorage.removeItem('authBlockedMessage');
    setError('');
    setLoading(true);

    // UC-02: Firebase returns the Google user and JWT-backed session.
    const credential = await loginWithGoogle();
    const localUser = await validateUserIsNotBlocked(credential, logout);

      updateLocalUser(localUser);

    try {
      // 1. Authenticate with Google
      const user = credential.user;

      // UC-02: Keeps the Google profile in sync with DynamoDB.
      // 2. Sync profile data to DynamoDB
      // We use 'displayName' to match your updated Python Lambda schema
      await createUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName, 
        profilePic: user.photoURL || ""
      });

      navigate('/dashboard');
      

      navigate(getRedirectPathByRole(localUser.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return { executeLogin, executeGoogleLogin, error, loading };
}
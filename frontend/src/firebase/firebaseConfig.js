import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider();

// Forces the Google account selection prompt
googleProvider.setCustomParameters({ prompt: 'select_account' }); 

export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);

export const authService = {
  register: async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: username
    });
    return userCredential;
  },

  login: (email, password) => signInWithEmailAndPassword(auth, email, password),

  loginWithGoogle: () => signInWithPopup(auth, googleProvider),

  logout: () => signOut(auth),

  subscribeToAuthChanges: (callback) => onAuthStateChanged(auth, callback)
};
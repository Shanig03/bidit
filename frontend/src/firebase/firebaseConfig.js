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
  apiKey: "AIzaSyBzOPxFrokkKDYFNXHDnmkAnuV9G9nr5rM",
  authDomain: "bidit-963a8.firebaseapp.com",
  databaseURL: "https://bidit-963a8-default-rtdb.firebaseio.com",
  projectId: "bidit-963a8",
  storageBucket: "bidit-963a8.firebasestorage.app",
  messagingSenderId: "489967229542",
  appId: "1:489967229542:web:2b2ef0cf298b05a4ba2ba7"
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
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config from the Firebase Console
// Go to: Firebase Console → Project Settings → Your apps → Config
const firebaseConfig = {
  apiKey: "AIzaSyByvo4wviHkRk0ekYrsKuOQ9BZq0Jfh8Xo",
  authDomain: "lifeplanner-a3444.firebaseapp.com",
  projectId: "lifeplanner-a3444",
  storageBucket: "lifeplanner-a3444.firebasestorage.app",
  messagingSenderId: "872222679536",
  appId: "1:872222679536:web:2ed31d9f2943bd2ee5bd35"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

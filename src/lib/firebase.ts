import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase - Initializing Firebase app");
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set the persistence to local (survives browser refresh)
if (typeof window !== 'undefined') {
  console.log("Firebase - Setting auth persistence to LOCAL");
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase - Successfully set auth persistence to LOCAL");
    })
    .catch((error) => {
      console.error('Firebase - Error setting auth persistence:', error);
    });
}

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

console.log("Firebase - Firebase initialized successfully");
export default app; 
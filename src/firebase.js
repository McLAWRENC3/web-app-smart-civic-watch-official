// src/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDtpvLcB4nz3YqPMtKWdOvzkpDj_sh6mTc",
  authDomain: "smartcivicwatchaut.firebaseapp.com",
  projectId: "smartcivicwatchaut",
  storageBucket: "smartcivicwatchaut.appspot.com",
  messagingSenderId: "399042818507",
  appId: "1:399042818507:web:377982e5ac0c729252064e",
  measurementId: "G-4EEKBPSYXP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Set persistence (session only - will clear when browser/tab closes)
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Auth persistence set to session only");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export { auth, db, storage };
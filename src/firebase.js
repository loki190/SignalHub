// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCEFXqzxK0bccAwo2YtRbdZF1UQDA1OP5I",
  authDomain: "signal-a14f5.firebaseapp.com",
  projectId: "signal-a14f5",
  storageBucket: "signal-a14f5.firebasestorage.app",
  messagingSenderId: "98817887158",
  appId: "1:98817887158:web:a3aa60fc77e22552920f17"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
};
  // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey           : "AIzaSyAlTL5Q1AGIK1bsKz0eWd7d5jwoyNIlLE0",
  authDomain       : "glassjar-jarstore.firebaseapp.com",
  projectId        : "glassjar-jarstore",
  storageBucket    : "glassjar-jarstore.appspot.com",
  messagingSenderId: "485993136920",
  appId            : "1:485993136920:web:cf2c6312a276293ca2946d",
  measurementId    : "G-MWSVVY6GTK"
};

  // Initialize Firebase
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
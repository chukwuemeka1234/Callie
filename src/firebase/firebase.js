// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import 'firebase/firestore';
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADURxXUEo-6awzIupEeTD9ZrZBlPiI73s",
  authDomain: "callie-a3ef9.firebaseapp.com",
  projectId: "callie-a3ef9",
  storageBucket: "callie-a3ef9.appspot.com",
  messagingSenderId: "927096845816",
  appId: "1:927096845816:web:a127d684f10f698f7ad20d",
  measurementId: "G-ZFLH2Q84C8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);



export { app, auth, firestore };
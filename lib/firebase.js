import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// My web app's Firebase configuration(from my firebase ToDo app project)
const firebaseConfig = {
  apiKey: "AIzaSyBkhkxQT0ncSFTDExECmKPNImLEC0b30Lo",
  authDomain: "todo-9f70e.firebaseapp.com",
  projectId: "todo-9f70e",
  storageBucket: "todo-9f70e.firebasestorage.app",
  messagingSenderId: "147705946337",
  appId: "1:147705946337:web:3a42abcb1d9c3963a0d7a0",
  measurementId: "G-6HLVS2H656",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVeS0OmVlGd4_RV5b1xnJ1aAUPt8rbt1M",
  authDomain: "genoibra-5ed82.firebaseapp.com",
  projectId: "genoibra-5ed82",
  storageBucket: "genoibra-5ed82.firebasestorage.app",
  messagingSenderId: "876870609201",
  appId: "1:876870609201:web:a9ba9605652dbcd8452810",
  measurementId: "G-YWWS7Y8K5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
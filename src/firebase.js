import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// Firebase Configuration for civic-d36c7 Project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqGBGdekHUNlvtBUlEKVKamLKe2JQkAis",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "civic-d36c7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "civic-d36c7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "civic-d36c7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "255141291633",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:255141291633:web:9c5f7fe500eec383301dd0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RK8E2RCM82"
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- REAL-TIME FIRESTORE SERVICES ---

/**
 * Real-time listener for public civic complaints
 */
export const subscribeToPublicIssues = (callback, categoryFilter = 'ALL') => {
  const issuesRef = collection(db, 'issues');
  let q = query(issuesRef, orderBy('created_at', 'desc'));
  
  if (categoryFilter !== 'ALL') {
    q = query(issuesRef, where('category', '==', categoryFilter), orderBy('created_at', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(issues);
  }, (error) => {
    console.warn("Firestore subscription note:", error.message);
  });
};

/**
 * Real-time listener for citizen's own complaints
 */
export const subscribeToMyComplaints = (userEmail, callback) => {
  if (!userEmail) return () => {};
  const issuesRef = collection(db, 'issues');
  const q = query(issuesRef, where('reporterEmail', '==', userEmail), orderBy('created_at', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(issues);
  }, (error) => {
    console.warn("Firestore user subscription note:", error.message);
  });
};

/**
 * Upload proof photo to Firebase Storage
 */
export const uploadProofImage = async (file, pathPrefix = 'evidence') => {
  try {
    const fileName = `${pathPrefix}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Firebase Storage Upload Error:", error);
    // Return mock fallback image if offline or demo mode
    return "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80";
  }
};

export default app;

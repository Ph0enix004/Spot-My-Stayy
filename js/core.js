import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    increment 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// TODO: Replace with your Firebase project config

const firebaseConfig = {
  apiKey: "AIzaSyBqKckOA2Xv_WupePFj7_q2DcvnPWRT_pg",
  authDomain: "spot-my-stayy.firebaseapp.com",
  projectId: "spot-my-stayy",
  storageBucket: "spot-my-stayy.firebasestorage.app",
  messagingSenderId: "898452580750",
  appId: "1:898452580750:web:eae0def7f331478f981cdf",
  measurementId: "G-7DRR541JPH"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export let currentUser = null;
export let currentUserRole = null;

// Export auth functions for use in main.js
export { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
};

export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

export function initAuthStateListener(callback) {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            currentUserRole = userDoc.exists() ? userDoc.data().role : 'user';
        } else {
            currentUserRole = null;
        }
        if (callback) callback(user);
    });
}
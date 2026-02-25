import { APP_CONFIG } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(APP_CONFIG.FIREBASE_CONFIG);
// const analytics = getAnalytics(app); // Optional for now

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Queue (very valuable)
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
        } else if (err.code == 'unimplemented') {
            console.warn("The current browser does not support all of the features required to enable persistence");
        }
    });

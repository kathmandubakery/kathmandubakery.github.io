import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Toast System Setup ---
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

window.toast = (message, type = 'success') => {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    let icon = type === 'success' ? '✓' : '⚠';
    t.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(t);

    setTimeout(() => {
        t.style.animation = 'toastFadeOut 0.3s ease forwards';
        setTimeout(() => t.remove(), 300);
    }, 3000);
};

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Failed', err));
    });
}

// --- Global Loading Screen Hide ---
window.hideLoader = () => {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('hidden-loader');
        setTimeout(() => loader.style.display = 'none', 500);
    }
};

// --- Auth Guard Setup ---
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Extracted Auth Guard logic
export const authGuard = (user, role) => {
    if (!user) {
        if (currentPage !== 'login.html') window.location.replace('login.html');
    } else {
        // If logged in
        if (currentPage === 'login.html' || currentPage === 'index.html' || currentPage === '') {
            window.location.replace(role === 'admin' ? 'admin.html' : 'employee.html');
        } else if (currentPage === 'admin.html' && role !== 'admin') {
            // Employee trying to access admin
            window.toast("Unauthorized access. Redirecting...", "error");
            setTimeout(() => window.location.replace('employee.html'), 1000);
        } else if (currentPage === 'employee.html' && role === 'admin') {
            // Admin trying to access employee - optional, let admin view employee if they want but usually redirect
            window.location.replace('admin.html');
        }
    }
};

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Allow offline role reading via persistence/indexedDb
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const role = userDoc.exists() ? userDoc.data().role : 'employee';

            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', userDoc.exists() ? userDoc.data().name : 'User');

            authGuard(user, role);
        } catch (e) {
            console.error("Error fetching role: ", e);
            // Fallback to local storage if offline and can't fetch doc
            const cachedRole = localStorage.getItem('userRole') || 'employee';
            authGuard(user, cachedRole);
        }
    } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        authGuard(null, null);
    }

    window.hideLoader();
});

// Expose logout helper globally
window.logoutUser = () => {
    signOut(auth).then(() => {
        window.location.replace('login.html');
    });
};

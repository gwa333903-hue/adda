import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// Check if admin is already logged in, redirect instantly to admin panel
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'adda@adda.com') {
        window.location.href = "admin.html";
    }
});

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.email === 'adda@adda.com') {
            window.location.href = "admin.html";
        } else {
            errorMsg.textContent = "Access denied. Admin only.";
            auth.signOut();
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Invalid email or password.";
    }
});
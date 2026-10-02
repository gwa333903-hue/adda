import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
        const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
                const errorMsg = document.getElementById('error-msg');

                    try {
                            await signInWithEmailAndPassword(auth, email, password);
                                    window.location.href = "admin.html";
                                        } catch (error) {
                                                errorMsg.textContent = "Invalid credentials. Please try again.";
                                                    }
                                                    });
                                                    
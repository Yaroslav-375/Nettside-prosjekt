const BASE_URL = 'http://localhost:3000/api/auth';

// ========================= Functions for working with localStorage =========================
function saveUserSession(token, username) {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('loggedInUsername', username);
}

function getUserSession() {
    const token = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('loggedInUsername');
    return { token, username };
}

function clearUserSession() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('loggedInUsername');
}

// ===================================== User logout =====================================
function handleLogout(event) {
    event.preventDefault();
    clearUserSession();
    window.location.href = 'index.html';
}

// ===================== Function to update the UI on the home page =====================
function updateUIForAuth(username) {
    const navbarButtons = document.querySelector('.navbar-buttons');
    const mainContent = document.querySelector('main h1');
    const navbarLinks = document.querySelector('.navbar-links');
    const burgerToggle = document.getElementById('burger-toggle');

    if (username) {
        if (navbarButtons) {
            navbarButtons.innerHTML = 
            `<div class="logged-in">
                <p class="logged-in-message">${username}</p> 
                <a href="#" class="navbar-button logout">Log out</a>
            </div>`;
            const logoutButton = navbarButtons.querySelector('.logout');
            if (logoutButton) {
                logoutButton.addEventListener('click', handleLogout);
            }
        }
        if (mainContent) {
            mainContent.textContent = `Welcome, ${username}!`;
        }
        if (navbarLinks) {
            navbarLinks.style.display = 'flex';
        }
        if (burgerToggle) {
             burgerToggle.checked = false;
        }
    } else {
        if (navbarButtons) {
            navbarButtons.innerHTML = `
                <a href="login.html?mode=signup" class="navbar-button signup">Sign up</a>
                <a href="login.html?mode=login" class="navbar-button login">Log in</a>
            `;
        }
        if (mainContent) {
            mainContent.textContent = 'Welcome!';
        }
    }
}

// ===================== Functions for displaying/hiding error messages =====================
function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// ========================== Function for user registration ==========================
async function signupUser(username, email, password, confirm_password) {
    clearErrorMessage('signupErrorMessages');

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, confirm_password }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Registration successful:', data.message);
            saveUserSession(data.token, data.username);
            window.location.href = 'index.html';
        } else {
            console.error('Registration error:', data.message);
            displayErrorMessage('signupErrorMessages', data.message);
        }
    } catch (error) {
        console.error('Network error during registration:', error);
        displayErrorMessage('signupErrorMessages', 'A network error has occurred. Try again later.');
    }
}

// =========================== Function for user login ===========================
async function loginUser(email, password) {
    clearErrorMessage('loginErrorMessages');

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Login successful:', data.message);
            saveUserSession(data.token, data.username);
            window.location.href = 'index.html';
        } else {
            console.error('Login error:', data.message);
            displayErrorMessage('loginErrorMessages', data.message);
        }
    } catch (error) {
        console.error('Network login error:', error);
        displayErrorMessage('loginErrorMessages', 'A network error has occurred. Try again.');
    }
}

// ===================== Processing of login/registration forms =====================
document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUpButton');
    const logInButton = document.getElementById('logInButton');
    const authContainer = document.getElementById('wrapper');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const googleLoginButton = document.getElementById('googleLoginButton');
    const googleSignupButton = document.getElementById('googleSignupButton');

    function setAuthMode(mode) {
        if (authContainer) {
            if (mode === 'signup') {
                authContainer.classList.add('move');
            } else {
                authContainer.classList.remove('move');
            }
        } else {
            console.warn("authContainer not found. Cannot set authentication mode.");
        }
    }

    // ========================= Google OAuth redirect to index.html =========================
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const username = urlParams.get('username');

        if (token && username) {
            saveUserSession(token, decodeURIComponent(username));
            history.replaceState(null, '', window.location.pathname);
            updateUIForAuth(decodeURIComponent(username));
        } else {
            // If there are no settings from Google OAuth, check the regular session
            const sessionData = getUserSession();
            if (sessionData.token && sessionData.username) {
                updateUIForAuth(sessionData.username);
            } else {
                updateUIForAuth(null);
            }
        }
    }

    // ===================== Checking which button has been pressed =====================
    if (window.location.pathname.endsWith('login.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'signup') {
            setAuthMode('signup');
        } else {
            setAuthMode('login');
        }
        // If there was a Google OAuth error
        const error = urlParams.get('error');
        if (error) {
            displayErrorMessage('loginErrorMessages', 'Google authorization error: ' + error);
            history.replaceState(null, '', window.location.pathname);
        }
    }

    // ============================== Mode switch buttons ==============================
    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            setAuthMode('signup');
            history.pushState(null, '', '?mode=signup');
        });
    }

    if (logInButton) {
        logInButton.addEventListener('click', () => {
            setAuthMode('login');
            history.pushState(null, '', '?mode=login');
        });
    }

    // ================================= Sending forms =================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            await loginUser(email, password);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = signupForm.username.value;
            const email = signupForm.email.value;
            const password = signupForm.password.value;
            const confirm_password = signupForm.confirm_password.value;
            await signupUser(username, email, password, confirm_password);
        });
    }

    // ============================== Handler for Google OAuth buttons ==============================
    if (googleLoginButton) {
        googleLoginButton.addEventListener('click', () => {
            window.location.href = `${BASE_URL}/google`;
        });
    }
    if (googleSignupButton) { 
        googleSignupButton.addEventListener('click', () => {
            window.location.href = `${BASE_URL}/google`;
        });
    }

    // ============================== Handler for the “Log out” button ==============================
    const logoutButton = document.querySelector('.navbar-buttons .logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});
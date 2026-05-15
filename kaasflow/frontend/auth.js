// KaasFlow Auth Logic

document.addEventListener('DOMContentLoaded', () => {
    const tabPassword = document.getElementById('tab-password');
    const tabMagic = document.getElementById('tab-magic');
    const passwordForm = document.getElementById('password-form');
    const magicLinkForm = document.getElementById('magic-link-form');
    const errorBox = document.getElementById('error-box');
    const successBox = document.getElementById('success-box');

    // Tab Switching Logic
    tabPassword.addEventListener('click', () => {
        tabPassword.classList.add('active');
        tabMagic.classList.remove('active');
        passwordForm.style.display = 'block';
        magicLinkForm.style.display = 'none';
        clearMessages();
    });

    tabMagic.addEventListener('click', () => {
        tabMagic.classList.add('active');
        tabPassword.classList.remove('active');
        magicLinkForm.style.display = 'block';
        passwordForm.style.display = 'none';
        clearMessages();
    });

    function clearMessages() {
        errorBox.style.display = 'none';
        successBox.style.display = 'none';
    }

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
        successBox.style.display = 'none';
    }

    function showSuccess(msg) {
        successBox.textContent = msg;
        successBox.style.display = 'block';
        errorBox.style.display = 'none';
    }

    // Password Login Handler
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember_me: rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to main app
                }, 1000);
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (err) {
            showError('Network error. Please check your connection.');
        }
    });

    // Magic Link Request Handler
    magicLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('magic-email').value;

        try {
            const response = await fetch('/auth/magic-link/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess(data.message || 'Check your email for the magic link!');
                // If in development mode, the link might be returned in data.link
                if (data.link) {
                    console.log('Dev Magic Link:', data.link);
                }
            } else {
                showError(data.error || 'Failed to send magic link');
            }
        } catch (err) {
            showError('Network error. Please try again.');
        }
    });
});

// Google GIS Callback
async function handleCredentialResponse(response) {
    const errorBox = document.getElementById('error-box');
    const successBox = document.getElementById('success-box');

    try {
        const res = await fetch('/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (res.ok) {
            successBox.textContent = 'Google login successful! Redirecting...';
            successBox.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/'; // Redirect to main app
            }, 1000);
        } else {
            errorBox.textContent = data.error || 'Google authentication failed';
            errorBox.style.display = 'block';
        }
    } catch (err) {
        errorBox.textContent = 'Network error during Google login';
        errorBox.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const submitButton = document.getElementById('submitButton');
    const messageDiv = document.getElementById('message');
    const API_URL = 'http://localhost:3000/api';

    const checkPasswordStrength = () => {
        const password = passwordInput.value;
        if (password.length === 0) {
            strengthBar.className = 'strength-bar';
            passwordFeedback.textContent = '';
            submitButton.disabled = true;
            return;
        }

        const result = zxcvbn(password);
        const score = result.score;

        strengthBar.className = `strength-bar strength-${score}`;
        
        if (result.feedback.warning) {
            passwordFeedback.textContent = result.feedback.warning;
        } else if (result.feedback.suggestions.length > 0) {
            passwordFeedback.textContent = `Sugerencia: ${result.feedback.suggestions[0]}`;
        } else {
            passwordFeedback.textContent = '';
        }

        // Habilitar el botón solo si la contraseña es aceptable (score >= 2)
        if (score >= 2) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    };

    passwordInput.addEventListener('input', checkPasswordStrength);

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm';

        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.confirmPassword) {
            messageDiv.textContent = 'Las contraseñas no coinciden.';
            messageDiv.classList.add('text-red-600');
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.classList.add('text-green-600');
                
                if (result.development_only) {
                    // ... (código de info de desarrollo existente)
                }

                localStorage.setItem('verificationEmail', data.email);
                setTimeout(() => {
                    window.location.href = 'verify.html';
                }, 2000);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.classList.add('text-red-600');
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
        }
    });
});

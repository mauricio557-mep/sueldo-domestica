document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('errorMessage');
    
    const verificationCodeContainer = document.getElementById('verificationCodeContainer');
    if (verificationCodeContainer) {
        verificationCodeContainer.style.display = 'none';
    }

    const API_URL = 'http://localhost:3000/api';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = '';
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            errorMessageDiv.textContent = 'Por favor, ingresa email y contraseña.';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar el token y el email del usuario
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('userEmail', email); // Guardamos el email que usó para iniciar sesión
                
                // Redirigir a la página de gestión de empleados
                window.location.href = 'employees.html';
            } else {
                errorMessageDiv.textContent = `Error: ${data.message}`;
            }

        } catch (error) {
            errorMessageDiv.textContent = 'No se pudo conectar con el servidor. ¿Está corriendo?';
            console.error('Error de conexión:', error);
        }
    });
});
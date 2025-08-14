document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const messageDiv = document.getElementById('message');
    const tokenInput = document.getElementById('resetToken');
    const API_URL = 'http://localhost:3000/api';

    // 1. Extraer el token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        form.style.display = 'none';
        messageDiv.textContent = 'Error: No se proporcionó un token de restablecimiento. Por favor, solicita un nuevo enlace.';
        messageDiv.className = 'text-center text-sm text-red-600';
        return;
    }
    tokenInput.value = token;

    // 2. Manejar el envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm';

        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (password !== confirmPassword) {
            messageDiv.textContent = 'Las contraseñas no coinciden.';
            messageDiv.classList.add('text-red-600');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword })
            });

            const result = await response.json();

            if (response.ok) {
                form.style.display = 'none';
                messageDiv.innerHTML = `
                    <p class="text-green-600">${result.message}</p>
                    <a href="index.html" class="font-medium text-blue-600 hover:underline">Ir a Iniciar Sesión</a>
                `;
            } else {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.classList.add('text-red-600');
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Nueva Contraseña';
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            messageDiv.textContent = 'No se pudo conectar con el servidor.';
            messageDiv.classList.add('text-red-600');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Nueva Contraseña';
        }
    });
});

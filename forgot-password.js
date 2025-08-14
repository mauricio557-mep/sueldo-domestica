document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    const messageDiv = document.getElementById('message');
    const API_URL = 'http://localhost:3000/api';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm';

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const email = form.email.value;

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                form.style.display = 'none'; // Ocultar el formulario
                messageDiv.textContent = result.message;
                messageDiv.classList.add('text-green-600');
                
                // Mostrar información de desarrollo si existe
                if (result.development_only) {
                    const { resetLink, previewUrl } = result.development_only;
                    const devInfo = document.createElement('div');
                    devInfo.className = 'mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-700';
                    devInfo.innerHTML = `
                        <p class="font-bold">Información de Desarrollo:</p>
                        <p class="mt-1">En un entorno real, se enviaría un email. Haz clic en el enlace para restablecer la contraseña:</p>
                        <a href="${resetLink}" class="text-blue-600 hover:underline break-all">${resetLink}</a>
                        <p class="mt-2">Puedes previsualizar el email ficticio aquí:</p>
                        <a href="${previewUrl}" target="_blank" class="text-blue-600 hover:underline">Ver Email Ficticio</a>
                    `;
                    messageDiv.after(devInfo);
                }

                // Añadir botón para volver al login
                const backButton = document.createElement('a');
                backButton.href = 'index.html';
                backButton.className = 'mt-4 inline-block w-full text-center bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-all duration-200';
                backButton.textContent = 'Volver a Inicio de Sesión';
                (document.querySelector('#dev-info') || messageDiv).after(backButton);


            } else {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.classList.add('text-red-600');
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Enlace de Recuperación';
            }

        } catch (error) {
            console.error('Error en la solicitud:', error);
            messageDiv.textContent = 'No se pudo conectar con el servidor.';
            messageDiv.classList.add('text-red-600');
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Enlace de Recuperación';
        }
    });
});

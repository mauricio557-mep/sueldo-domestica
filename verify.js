document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.getElementById('verifyForm');
    const messageDiv = document.getElementById('message');
    const infoText = document.getElementById('infoText');
    const API_URL = 'http://localhost:3000/api';

    // Recuperamos el email guardado desde la página de registro
    const email = localStorage.getItem('verificationEmail');

    if (!email) {
        infoText.textContent = 'No se encontró un email para verificar. Por favor, inicia el proceso de registro de nuevo.';
        infoText.classList.add('text-red-600');
        verifyForm.style.display = 'none'; // Ocultamos el formulario si no hay email
        return;
    }
    
    infoText.textContent = `Hemos enviado un código de 4 dígitos al email: ${email}. Por favor, ingrésalo a continuación.`;

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm';

        const code = document.getElementById('code').value;

        try {
            const response = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.classList.add('text-green-600');
                
                // Limpiamos el email de verificación del storage
                localStorage.removeItem('verificationEmail');

                // Redirigimos a la página de login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.classList.add('text-red-600');
            }

        } catch (error) {
            messageDiv.textContent = 'No se pudo conectar con el servidor.';
            messageDiv.classList.add('text-red-600');
            console.error('Error de conexión:', error);
        }
    });
});

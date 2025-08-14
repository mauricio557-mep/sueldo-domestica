document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const strengthBar = document.getElementById('strengthBar');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const submitButton = document.getElementById('submitButton');
    const restoreForm = document.getElementById('restoreForm');
    const confirmRestoreInput = document.getElementById('confirmRestore');
    const restoreButton = document.getElementById('restoreButton');
    const backupFileInput = document.getElementById('backupFile');

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}` }; // No 'Content-Type' para FormData

    // --- FUNCIONES AUXILIARES ---
    const showToast = (text, type = 'success') => {
        const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text, duration: 5000, gravity: "bottom", position: "right", backgroundColor, stopOnFocus: true }).showToast();
    };

    const checkPasswordStrength = () => { /* ... (código existente) ... */ };

    // --- MANEJO DE EVENTOS ---
    newPasswordInput.addEventListener('input', checkPasswordStrength);
    form.addEventListener('submit', async (e) => { /* ... (código existente) ... */ });

    // Lógica para el formulario de restauración
    confirmRestoreInput.addEventListener('input', () => {
        if (confirmRestoreInput.value === 'restaurar' && backupFileInput.files.length > 0) {
            restoreButton.disabled = false;
            restoreButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            restoreButton.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            restoreButton.disabled = true;
            restoreButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            restoreButton.classList.add('bg-red-600', 'hover:bg-red-700');
        }
    });
    backupFileInput.addEventListener('change', () => confirmRestoreInput.dispatchEvent(new Event('input')));

    restoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (confirmRestoreInput.value !== 'restaurar' || backupFileInput.files.length === 0) {
            showToast('Por favor, seleccione un archivo y escriba "restaurar" para confirmar.', 'error');
            return;
        }

        restoreButton.disabled = true;
        restoreButton.textContent = 'Restaurando...';

        const formData = new FormData();
        formData.append('backupFile', backupFileInput.files[0]);

        try {
            const response = await fetch('http://localhost:3000/api/backup/restore', {
                method: 'POST',
                headers: authHeaders, // No 'Content-Type', el navegador lo pone solo para FormData
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            showToast(result.message);
            setTimeout(() => {
                // Forzar recarga y limpiar cache para re-autenticar si el usuario cambió
                window.location.reload(true);
            }, 3000);

        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            restoreButton.disabled = false;
            restoreButton.textContent = 'Restaurar Datos';
        }
    });
});
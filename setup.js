document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const mainHeader = document.getElementById('mainHeader');
    const loadingDiv = document.getElementById('loading');
    const form = document.getElementById('profileForm');
    const categorySelect = document.getElementById('category_id');
    const messageDiv = document.getElementById('message');
    const submitButton = document.getElementById('submitButton');
    const pageTitle = document.querySelector('h1');

    // --- ESTADO ---
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employee_id');
    const isEditMode = Boolean(employeeId);

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // --- FUNCIONES AUXILIARES ---
    const showToast = (text, type = 'success') => {
        const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text, duration: 3000, gravity: "bottom", position: "right", backgroundColor, stopOnFocus: true }).showToast();
    };

    // --- LÓGICA ---
    const init = async () => {
        pageTitle.textContent = isEditMode ? 'Editar Perfil de Empleado' : 'Añadir Nuevo Empleado';
        submitButton.textContent = isEditMode ? 'Actualizar Perfil' : 'Guardar Perfil';

        try {
            const catResponse = await fetch('http://localhost:3000/api/categories', { headers: authHeaders });
            if (!catResponse.ok) throw new Error('No se pudieron cargar las categorías.');
            const categories = await catResponse.json();
            categorySelect.innerHTML = '<option value="">-- Seleccione una categoría --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                categorySelect.appendChild(option);
            });

            if (isEditMode) {
                const profileResponse = await fetch(`/api/employee-profile/${employeeId}`, { headers: authHeaders });
                if (!profileResponse.ok) throw new Error('No se pudo encontrar el perfil del empleado.');
                const existingProfile = await profileResponse.json();
                
                form.nombre_empleado.value = existingProfile.nombre_empleado;
                form.fecha_inicio_relacion_laboral.value = existingProfile.fecha_inicio_relacion_laboral;
                form.category_id.value = existingProfile.category_id;

                mainHeader.innerHTML = `
                    <div class="header-content">
                        <div>
                            <h1 class="app-title">Gestionando a: ${existingProfile.nombre_empleado}</h1>
                            <a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cambiar de Empleado</a>
                        </div>
                    </div>`;
            } else {
                 mainHeader.innerHTML = `
                    <div class="header-content">
                        <div>
                            <h1 class="app-title">Nuevo Empleado</h1>
                            <a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cancelar</a>
                        </div>
                    </div>`;
            }

        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loadingDiv.classList.add('hidden');
            form.classList.remove('hidden');
            form.nombre_empleado.focus();
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const url = isEditMode ? `/api/employee-profile/${employeeId}` : '/api/employee-profile';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: authHeaders, body: JSON.stringify(data) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showToast(result.message);
            setTimeout(() => { window.location.href = 'employees.html'; }, 1500);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? 'Actualizar Perfil' : 'Guardar Perfil';
        }
    });

    init();
});
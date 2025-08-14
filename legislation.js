document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('legislationForm');
    const categorySelect = document.getElementById('category_id');
    const formMessage = document.getElementById('formMessage');
    const tableLoading = document.getElementById('tableLoading');
    const tableContainer = document.getElementById('scalesTableContainer');
    const tableBody = document.getElementById('scalesTableBody');

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // --- FUNCIONES ---

    // Formatear moneda
    const formatCurrency = (value) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    // Formatear fecha
    const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES');

    // Cargar categorías en el select del formulario
    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/categories', { headers: authHeaders });
            if (!response.ok) throw new Error('No se pudieron cargar las categorías.');
            
            const categories = await response.json();
            categorySelect.innerHTML = '<option value="">-- Seleccione --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'text-center text-sm mt-4 text-red-600';
        }
    };

    // Cargar y mostrar el historial de escalas salariales
    const loadScalesHistory = async () => {
        try {
            tableLoading.classList.remove('hidden');
            tableContainer.classList.add('hidden');
            
            const response = await fetch('http://localhost:3000/api/legislation', { headers: authHeaders });
            if (!response.ok) throw new Error('No se pudo cargar el historial.');

            const scales = await response.json();
            tableBody.innerHTML = ''; // Limpiar tabla

            if (scales.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">Aún no se han cargado escalas salariales.</td></tr>';
            } else {
                scales.forEach(scale => {
                    const row = `
                        <tr class="border-b">
                            <td class="p-2">${scale.category_name}</td>
                            <td class="p-2 font-mono">${formatCurrency(scale.valor_hora)}</td>
                            <td class="p-2">${formatDate(scale.fecha_vigencia_desde)}</td>
                            <td class="p-2 text-gray-600">${scale.descripcion || ''}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-500">Error al cargar: ${error.message}</td></tr>`;
        } finally {
            tableLoading.classList.add('hidden');
            tableContainer.classList.remove('hidden');
        }
    };

    // --- MANEJO DE EVENTOS ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/legislation', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok) {
                formMessage.textContent = result.message;
                formMessage.className = 'text-center text-sm mt-4 text-green-600';
                form.reset(); // Limpiar formulario
                await loadScalesHistory(); // Recargar la tabla
            } else {
                formMessage.textContent = `Error: ${result.message}`;
                formMessage.className = 'text-center text-sm mt-4 text-red-600';
            }
        } catch (error) {
            formMessage.textContent = 'Error de conexión con el servidor.';
            formMessage.className = 'text-center text-sm mt-4 text-red-600';
        } finally {
            submitButton.disabled = false;
        }
    });

    // --- INICIALIZACIÓN ---
    await loadCategories();
    await loadScalesHistory();
});

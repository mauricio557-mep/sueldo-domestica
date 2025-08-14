document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const mainHeader = document.getElementById('mainHeader');
    const employeeSelect = document.getElementById('employeeSelect');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsBody = document.getElementById('resultsBody');

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // --- LÓGICA DE INICIALIZACIÓN ---
    const init = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/employees', { headers: authHeaders });
            const employees = await res.json();
            if (employees.length === 0) {
                employeeSelect.innerHTML = '<option value="">No hay empleados</option>';
                calculateBtn.disabled = true;
            } else {
                employeeSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.nombre_empleado}</option>`).join('');
                const urlParams = new URLSearchParams(window.location.search);
                const employeeId = urlParams.get('employee_id');
                if (employeeId) {
                    employeeSelect.value = employeeId;
                    const selectedEmployee = employees.find(e => e.id == employeeId);
                    if (selectedEmployee) {
                        mainHeader.innerHTML = `
                            <div class="header-content">
                                <div>
                                    <h1 class="app-title">Gestionando a: ${selectedEmployee.nombre_empleado}</h1>
                                    <a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cambiar de Empleado</a>
                                </div>
                            </div>`;
                    }
                }
            }
        } catch (error) {
            console.error("Error loading employees:", error);
            employeeSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    // --- MANEJO DE EVENTOS ---
    calculateBtn.addEventListener('click', async () => {
        const employee_id = employeeSelect.value;
        if (!employee_id) {
            alert('Por favor, seleccione un empleado.');
            return;
        }

        resultsContainer.classList.remove('hidden');
        resultsBody.innerHTML = '<p>Calculando...</p>';
        calculateBtn.disabled = true;

        try {
            const res = await fetch(`/api/vacations?employee_id=${employee_id}`, { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            resultsBody.innerHTML = `
                <div>
                    <p class="text-sm text-gray-500">Años de Antigüedad</p>
                    <p class="text-2xl font-bold">${data.yearsOfService}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">Días de Vacaciones Correspondientes</p>
                    <p class="text-5xl font-bold text-blue-800">${data.vacationDays}</p>
                </div>
                <div class="mt-4 p-2 bg-gray-50 rounded-md">
                    <p class="text-sm text-gray-600">${data.scaleDescription}</p>
                </div>
            `;

        } catch (error) {
            resultsBody.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        } finally {
            calculateBtn.disabled = false;
        }
    });

    init();
});

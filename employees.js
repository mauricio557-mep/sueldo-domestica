document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const loadingDiv = document.getElementById('loading');
    const employeesList = document.getElementById('employeesList');
    const emptyStateDiv = document.getElementById('emptyState');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // --- MANEJO DE EVENTOS ---
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // --- LÓGICA PRINCIPAL ---
    const createEmployeeCard = (employee) => {
        const card = document.createElement('div');
        card.className = 'card rounded-lg p-4 flex flex-wrap justify-between items-center gap-4';
        card.innerHTML = `
            <div>
                <p class="font-bold text-lg text-primary">${employee.nombre_empleado}</p>
                <p class="text-sm text-gray-600">ID: ${employee.id}</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <a href="tracker.html?employee_id=${employee.id}" class="btn bg-green-600 text-white font-bold py-2 px-3 rounded-md text-sm hover:bg-green-700">
                    Registrar Horas
                </a>
                <a href="sac.html?employee_id=${employee.id}" class="btn bg-yellow-500 text-white font-bold py-2 px-3 rounded-md text-sm hover:bg-yellow-600">
                    Calcular SAC
                </a>
                <a href="vacations.html?employee_id=${employee.id}" class="btn bg-cyan-500 text-white font-bold py-2 px-3 rounded-md text-sm hover:bg-cyan-600">
                    Calcular Vacaciones
                </a>
                <a href="history.html?employee_id=${employee.id}" class="btn bg-blue-600 text-white font-bold py-2 px-3 rounded-md text-sm hover:bg-blue-700">
                    Liquidaciones
                </a>
                 <a href="reports.html?employee_id=${employee.id}" class="btn bg-gray-600 text-white font-bold py-2 px-3 rounded-md text-sm hover:bg-gray-700">
                    Informes
                </a>
                <a href="setup.html?employee_id=${employee.id}" class="btn bg-gray-200 text-gray-800 font-bold py-2 px-3 rounded-md text-sm hover:bg-gray-300">
                    Editar
                </a>
            </div>
        `;
        employeesList.appendChild(card);
    };

    try {
        const response = await fetch('http://localhost:3000/api/employees', { headers: authHeaders });
        if (!response.ok) throw new Error('Failed to fetch employees.');

        const employees = await response.json();

        if (employees.length === 0) {
            emptyStateDiv.classList.remove('hidden');
        } else {
            employees.forEach(createEmployeeCard);
        }

    } catch (error) {
        console.error("Error loading employees:", error);
        emptyStateDiv.innerHTML = '<p class="text-red-500">Error al cargar los perfiles de empleados.</p>';
        emptyStateDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
});

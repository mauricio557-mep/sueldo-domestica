document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const mainHeader = document.getElementById('mainHeader');
    const employeeSelect = document.getElementById('employeeSelect');
    const yearSelect = document.getElementById('yearSelect');
    const semesterSelect = document.getElementById('semesterSelect');
    const calculateSacBtn = document.getElementById('calculateSacBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsBody = document.getElementById('resultsBody');

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // --- ESTADO ---
    let lastSacResult = null;

    // --- FUNCIONES ---
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const showToast = (text, type = 'success') => {
        const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text, duration: 3000, gravity: "bottom", position: "right", backgroundColor, stopOnFocus: true }).showToast();
    };

    // --- LÓGICA DE INICIALIZACIÓN ---
    const init = async () => {
        yearSelect.value = new Date().getFullYear();
        try {
            const res = await fetch('/api/employees', { headers: authHeaders });
            const employees = await res.json();
            if (employees.length === 0) {
                employeeSelect.innerHTML = '<option value="">No hay empleados</option>';
                calculateSacBtn.disabled = true;
            } else {
                employeeSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.nombre_empleado}</option>`).join('');
                const urlParams = new URLSearchParams(window.location.search);
                const employeeId = urlParams.get('employee_id');
                if (employeeId) {
                    employeeSelect.value = employeeId;
                    const selectedEmployee = employees.find(e => e.id == employeeId);
                    if (selectedEmployee) {
                        mainHeader.innerHTML = `<div class="header-content"><div><h1 class="app-title">Gestionando a: ${selectedEmployee.nombre_empleado}</h1><a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cambiar de Empleado</a></div></div>`;
                    }
                }
            }
        } catch (error) {
            console.error("Error loading employees:", error);
            employeeSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    // --- MANEJO DE EVENTOS ---
    calculateSacBtn.addEventListener('click', async () => {
        const employee_id = employeeSelect.value;
        const year = yearSelect.value;
        const semester = semesterSelect.value;
        if (!employee_id) { alert('Por favor, seleccione un empleado.'); return; }

        resultsContainer.classList.remove('hidden');
        resultsTitle.textContent = 'Calculando...';
        resultsBody.innerHTML = '';
        calculateSacBtn.disabled = true;

        try {
            const res = await fetch(`/api/generate-sac?year=${year}&semester=${semester}&employee_id=${employee_id}`, { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            lastSacResult = { employee_id, year, semester, bestSalary: data.bestSalary, finalSac: data.finalSac, isProportional: data.isProportional, details: data };
            resultsTitle.textContent = `Resultado del SAC - ${semester}º Semestre ${year}`;
            let proportionalHtml = data.isProportional ? `<div class="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm"><p><strong>Cálculo Proporcional:</strong> El empleado trabajó ${data.daysWorkedInSemester} de ${data.daysInSemester} días en el semestre.</p></div>` : '';
            resultsBody.innerHTML = `
                <div class="flex justify-between items-center"><span>Mejor Remuneración del Semestre:</span><span class="font-mono">${formatCurrency(data.bestSalary)}</span></div>
                <div class="flex justify-between items-center"><span>SAC Base (50%):</span><span class="font-mono">${formatCurrency(data.baseSac)}</span></div>
                ${proportionalHtml}
                <div class="flex justify-between items-center text-xl font-bold mt-4 border-t pt-4"><span>TOTAL SAC A PAGAR:</span><span class="font-mono text-green-700">${formatCurrency(data.finalSac)}</span></div>
                <div class="mt-6"><button id="saveSacBtn" class="btn btn-primary font-bold py-2 px-4 rounded-md">Guardar Liquidación de SAC</button></div>`;
        } catch (error) {
            resultsTitle.textContent = 'Error';
            resultsBody.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        } finally {
            calculateSacBtn.disabled = false;
        }
    });

    resultsBody.addEventListener('click', async (e) => {
        if (e.target.id === 'saveSacBtn') {
            if (!lastSacResult) return;
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Guardando...';
            try {
                const res = await fetch('http://localhost:3000/api/sac', { method: 'POST', headers: authHeaders, body: JSON.stringify(lastSacResult) });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showToast(result.message);
                btn.textContent = 'Guardado';
                btn.classList.remove('btn-primary');
                btn.classList.add('bg-gray-400');
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
                btn.disabled = false;
                btn.textContent = 'Guardar Liquidación de SAC';
            }
        }
    });

    init();
});

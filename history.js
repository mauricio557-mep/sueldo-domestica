document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const mainHeader = document.getElementById('mainHeader');
    const loadingDiv = document.getElementById('loading');
    const historyContainer = document.getElementById('historyContainer');
    const emptyStateDiv = document.getElementById('emptyState');
    const tabs = document.getElementById('historyTabs');

    // --- AUTENTICACIÓN Y PARÁMETROS ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employee_id');
    if (!employeeId) {
        loadingDiv.innerHTML = '<p class="text-red-600">Error: No se ha especificado un empleado.</p>';
        return;
    }

    // --- FUNCIONES ---
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    const renderPayrolls = (payrolls) => {
        historyContainer.innerHTML = '';
        if (payrolls.length === 0) {
            emptyStateDiv.classList.remove('hidden');
            emptyStateDiv.innerHTML = '<p>No hay liquidaciones mensuales guardadas.</p>';
            return;
        }
        historyContainer.classList.remove('hidden');
        payrolls.forEach(payroll => {
            const details = JSON.parse(payroll.detalles);
            const monthName = new Date(details.anio, details.mes - 1).toLocaleDateString('es-ES', { month: 'long' });
            const item = document.createElement('div');
            item.className = 'card rounded-lg p-4';
            item.innerHTML = `
                <div class="flex justify-between items-center cursor-pointer" data-payroll-id="${payroll.id}">
                    <div>
                        <p class="font-bold text-lg text-primary">${monthName.replace(/^\w/, c => c.toUpperCase())} ${details.anio}</p>
                        <p class="text-sm text-gray-600">Monto Final: ${formatCurrency(payroll.monto_total_final)}</p>
                    </div>
                    <button class="details-btn text-sm text-blue-600 hover:underline" data-payroll-id="${payroll.id}">Ver Detalles</button>
                </div>
                <div class="details-content hidden mt-4 pt-4 border-t border-gray-200 text-sm space-y-2"></div>`;
            historyContainer.appendChild(item);
        });
    };

    const renderSacs = (sacs) => {
        historyContainer.innerHTML = '';
        if (sacs.length === 0) {
            emptyStateDiv.classList.remove('hidden');
            emptyStateDiv.innerHTML = '<p>No hay registros de SAC guardados.</p>';
            return;
        }
        historyContainer.classList.remove('hidden');
        sacs.forEach(sac => {
            const item = document.createElement('div');
            item.className = 'card rounded-lg p-4';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-lg text-primary">${sac.semestre}º Semestre ${sac.anio}</p>
                        <p class="text-sm text-gray-600">Monto Pagado: ${formatCurrency(sac.monto_sac)}</p>
                    </div>
                    <p class="text-sm text-gray-500">Guardado: ${new Date(sac.fecha_guardado).toLocaleDateString()}</p>
                </div>`;
            historyContainer.appendChild(item);
        });
    };

    const loadHistory = async (type = 'payrolls') => {
        loadingDiv.classList.remove('hidden');
        historyContainer.classList.add('hidden');
        emptyStateDiv.classList.add('hidden');
        try {
            let data = [];
            if (type === 'payrolls') {
                const res = await fetch(`/api/payrolls?employee_id=${employeeId}`, { headers: authHeaders });
                data = await res.json();
                renderPayrolls(data);
            } else if (type === 'sacs') {
                const res = await fetch(`/api/sac?employee_id=${employeeId}`, { headers: authHeaders });
                data = await res.json();
                renderSacs(data);
            }
        } catch (error) {
            emptyStateDiv.innerHTML = `<p class="text-red-500">Error al cargar el historial.</p>`;
            emptyStateDiv.classList.remove('hidden');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    };

    // --- INICIALIZACIÓN Y EVENTOS ---
    (async () => {
        try {
            const profileRes = await fetch(`/api/employee-profile/${employeeId}`, { headers: authHeaders });
            const employeeProfile = await profileRes.json();
            mainHeader.innerHTML = `<div class="header-content"><div><h1 class="app-title">Gestionando a: ${employeeProfile.nombre_empleado}</h1><a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cambiar de Empleado</a></div></div>`;
            await loadHistory();
        } catch (e) { 
            mainHeader.innerHTML = `<h1 class="app-title text-red-500">Error al cargar perfil</h1>`;
        }
    })();

    tabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            tabs.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            loadHistory(e.target.dataset.type);
        }
    });
    
    historyContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.details-btn');
        if (button) {
            const contentDiv = button.parentElement.nextElementSibling;
            const payrollId = button.dataset.payrollId;
            if (contentDiv.classList.contains('hidden')) {
                // Lógica para mostrar detalles de liquidación mensual
            } else {
                contentDiv.classList.add('hidden');
                contentDiv.innerHTML = '';
                button.textContent = 'Ver Detalles';
            }
        }
    });
});

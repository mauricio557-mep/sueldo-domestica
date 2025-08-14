document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const loadingDiv = document.getElementById('loading');
    const appContainer = document.getElementById('appContainer');
    const mainHeader = document.getElementById('mainHeader');
    const currentMonthYearEl = document.getElementById('currentMonthDisplay');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const valorHoraWidget = document.getElementById('valorHoraWidget');
    const totalHorasWidget = document.getElementById('totalHorasWidget');
    const importeAcumuladoWidget = document.getElementById('importeAcumuladoWidget');
    const gridBody = document.getElementById('trackerGridBody');
    const generatePayrollBtn = document.getElementById('generatePayrollBtn');

    // --- ESTADO DE LA APLICACIÓN ---
    let currentDate = new Date();
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employee_id');
    let employeeProfile = null;
    let valorHoraParaCalculo = null;
    let workEntriesMap = new Map();
    let unsavedChanges = false;

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    if (!employeeId) { 
        loadingDiv.innerHTML = '<p class="text-red-600">Error: No se ha especificado un empleado...</p>'; 
        return; 
    }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // --- FUNCIONES AUXILIARES ---
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const formatDateForAPI = (date) => date.toISOString().split('T')[0];
    const showToast = (text, type = 'success') => {
        const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text, duration: 3000, gravity: "bottom", position: "right", backgroundColor, stopOnFocus: true }).showToast();
    };

    // --- LÓGICA PRINCIPAL ---
    const init = async () => {
        try {
            loadingDiv.querySelector('p').textContent = 'Cargando perfil del empleado...';
            const profileRes = await fetch(`http://localhost:3000/api/employee-profile/${employeeId}`, { headers: authHeaders });
            if (!profileRes.ok) throw new Error('PROFILE_NOT_FOUND');
            employeeProfile = await profileRes.json();
            
            const pageTitleEl = document.getElementById('pageTitle');
            if (pageTitleEl) {
                pageTitleEl.textContent = `Gestionando a: ${employeeProfile.nombre_empleado}`;
            }

            loadingDiv.classList.add('hidden');
            appContainer.classList.remove('hidden');
            await changeMonth(0);
        } catch (error) {
            if (error.message === 'PROFILE_NOT_FOUND') {
                loadingDiv.innerHTML = `<p class="text-red-600 text-lg">Error: Perfil del empleado no encontrado.</p><p class="text-sm text-gray-500 mt-2">Por favor, <a href="employees.html" class="text-blue-600 hover:underline">seleccione un empleado válido</a>.</p>`;
            } else {
                loadingDiv.innerHTML = `<p class="text-red-600 text-lg">Ocurrió un error grave al cargar la aplicación.</p><p class="text-sm text-gray-500 mt-2">${error.message}</p>`;
            }
        }
    };

    const setupValorHoraWidget = async () => {
        let valorSugerido = 0;
        if (employeeProfile.valor_hora_personalizado) {
            valorSugerido = employeeProfile.valor_hora_personalizado;
        } else {
            try {
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const dateForScale = formatDateForAPI(firstDayOfMonth);
                const legislationRes = await fetch('http://localhost:3000/api/legislation', { headers: authHeaders });
                const legislation = await legislationRes.json();
                const latestScale = legislation
                    .filter(s => s.category_id === employeeProfile.category_id && new Date(s.fecha_vigencia_desde) <= new Date(dateForScale))
                    .sort((a, b) => new Date(b.fecha_vigencia_desde) - new Date(a.fecha_vigencia_desde))[0];
                if (latestScale) valorSugerido = latestScale.valor_hora;
            } catch (e) { console.error("No se encontró escala salarial para sugerir."); }
        }
        valorHoraParaCalculo = valorSugerido;
        valorHoraWidget.innerHTML = `
            <input type="number" id="valorHoraInput" step="0.01" class="w-32 p-1 text-2xl font-bold text-blue-800 text-center border rounded-md" value="${valorSugerido.toFixed(2)}">
            <button id="saveValorHoraBtn" class="btn text-xs bg-green-600 text-white py-1 px-2 rounded-md hover:bg-green-700">Guardar</button>`;
        
        document.getElementById('valorHoraInput').addEventListener('input', (e) => {
            valorHoraParaCalculo = parseFloat(e.target.value) || 0;
            unsavedChanges = true;
            recalculateTotals();
        });
        document.getElementById('saveValorHoraBtn').addEventListener('click', async () => {
            const btn = document.getElementById('saveValorHoraBtn');
            btn.disabled = true;
            try {
                const res = await fetch(`http://localhost:3000/api/employee-profile/${employeeId}/valor-hora`, {
                    method: 'PUT', headers: authHeaders,
                    body: JSON.stringify({ valor_hora_personalizado: valorHoraParaCalculo })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showToast('¡Valor hora guardado!');
                employeeProfile.valor_hora_personalizado = valorHoraParaCalculo;
                unsavedChanges = false;
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            } finally {
                btn.disabled = false;
            }
        });
    };

    const changeMonth = async (monthOffset) => {
        if (unsavedChanges && !confirm('Tienes cambios sin guardar en la grilla. ¿Estás seguro de que quieres cambiar de mes?')) return;
        unsavedChanges = false;
        currentDate.setMonth(currentDate.getMonth() + monthOffset);
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        currentMonthYearEl.textContent = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
        try {
            await setupValorHoraWidget();
            generateGrid(month, year);
            await fetchWorkEntries(month, year);
            recalculateTotals();
        } catch (error) {
            gridBody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-red-500">${error.message === 'PAY_SCALE_NOT_FOUND' ? 'No hay escala salarial definida para este período. <a href="legislation.html" class="text-blue-600 hover:underline">Cargar escala</a>' : 'Error.'}</td></tr>`;
            recalculateTotals();
        }
    };

    const generateGrid = (month, year) => {
        gridBody.innerHTML = '';
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const row = document.createElement('tr');
            row.dataset.date = formatDateForAPI(date);
            row.className = isWeekend ? 'bg-gray-50' : 'bg-white';
            row.innerHTML = `
                <td class="p-2 border-b border-gray-200">${dayName}, ${day}</td>
                <td class="p-2 border-b border-gray-200"><input type="number" class="table-input input-field rounded" name="horas_normales" min="0" step="0.5"></td>
                <td class="p-2 border-b border-gray-200"><input type="number" class="table-input input-field rounded" name="horas_extras_50" min="0" step="0.5"></td>
                <td class="p-2 border-b border-gray-200"><input type="number" class="table-input input-field rounded" name="horas_extras_100" min="0" step="0.5"></td>
                <td class="p-2 border-b border-gray-200"><input type="text" class="w-full p-1 input-field rounded" name="descripcion"></td>
                <td class="p-2 border-b border-gray-200 text-right font-mono"></td>
                <td class="p-2 border-b border-gray-200 text-center">
                    <button class="save-btn btn text-xs bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600">Guardar</button>
                    <button class="delete-btn btn text-xs bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 hidden">Borrar</button>
                </td>`;
            gridBody.appendChild(row);
        }
    };

    const fetchWorkEntries = async (month, year) => {
        try {
            const res = await fetch(`http://localhost:3000/api/work-entries?mes=${month}&anio=${year}&employee_id=${employeeId}`, { headers: authHeaders });
            const entries = await res.json();
            workEntriesMap.clear();
            entries.forEach(entry => workEntriesMap.set(entry.fecha, entry));
            gridBody.querySelectorAll('tr').forEach(row => {
                const entry = workEntriesMap.get(row.dataset.date);
                if (entry) {
                    row.dataset.id = entry.id;
                    row.querySelector('[name="horas_normales"]').value = entry.horas_normales || '';
                    row.querySelector('[name="horas_extras_50"]').value = entry.horas_extras_50 || '';
                    row.querySelector('[name="horas_extras_100"]').value = entry.horas_extras_100 || '';
                    row.querySelector('[name="descripcion"]').value = entry.descripcion || '';
                    row.querySelector('.save-btn').textContent = 'Actualizar';
                    row.querySelector('.delete-btn').classList.remove('hidden');
                }
            });
        } catch (error) { console.error("Error fetching work entries:", error); }
    };

    const recalculateTotals = () => {
        let totalHoras = 0, importeTotal = 0;
        if (valorHoraParaCalculo) {
            gridBody.querySelectorAll('tr').forEach(row => {
                const hNormales = parseFloat(row.querySelector('[name="horas_normales"]').value) || 0;
                const hExtras50 = parseFloat(row.querySelector('[name="horas_extras_50"]').value) || 0;
                const hExtras100 = parseFloat(row.querySelector('[name="horas_extras_100"]').value) || 0;
                totalHoras += hNormales + hExtras50 + hExtras100;
                const subtotal = (hNormales * valorHoraParaCalculo) + (hExtras50 * valorHoraParaCalculo * 1.5) + (hExtras100 * valorHoraParaCalculo * 2);
                importeTotal += subtotal;
                row.cells[5].textContent = subtotal > 0 ? formatCurrency(subtotal) : '';
            });
        }
        totalHorasWidget.textContent = totalHoras.toFixed(2);
        importeAcumuladoWidget.textContent = formatCurrency(importeTotal);
    };

    // --- MANEJO DE EVENTOS ---
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    gridBody.addEventListener('input', () => { unsavedChanges = true; recalculateTotals(); });

    gridBody.addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row || !valorHoraParaCalculo) return;
        const entryId = row.dataset.id;
        const data = {
            fecha: row.dataset.date,
            horas_normales: parseFloat(row.querySelector('[name="horas_normales"]').value) || 0,
            horas_extras_50: parseFloat(row.querySelector('[name="horas_extras_50"]').value) || 0,
            horas_extras_100: parseFloat(row.querySelector('[name="horas_extras_100"]').value) || 0,
            valor_hora_base_aplicado: valorHoraParaCalculo,
            descripcion: row.querySelector('[name="descripcion"]').value,
            employee_profile_id: employeeId
        };

        if (target.classList.contains('save-btn')) {
            target.disabled = true;
            const totalHours = data.horas_normales + data.horas_extras_50 + data.horas_extras_100;
            if (entryId) {
                if (totalHours > 0) {
                    try {
                        const res = await fetch(`http://localhost:3000/api/work-entries/${entryId}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(data) });
                        if (!res.ok) throw new Error((await res.json()).message);
                        unsavedChanges = false;
                        showToast('Registro actualizado');
                    } catch (error) { showToast(`Error al actualizar: ${error.message}`, 'error'); } 
                    finally { target.disabled = false; }
                } else {
                    try {
                        const res = await fetch(`http://localhost:3000/api/work-entries/${entryId}`, { method: 'DELETE', headers: authHeaders });
                        if (!res.ok) throw new Error((await res.json()).message);
                        row.removeAttribute('data-id');
                        row.querySelector('.save-btn').textContent = 'Guardar';
                        row.querySelector('.delete-btn').classList.add('hidden');
                        unsavedChanges = false;
                        showToast('Registro eliminado');
                        recalculateTotals();
                    } catch (error) { showToast(`Error al borrar: ${error.message}`, 'error'); } 
                    finally { target.disabled = false; }
                }
            } else {
                if (totalHours > 0) {
                    try {
                        const res = await fetch('http://localhost:3000/api/work-entries', { method: 'POST', headers: authHeaders, body: JSON.stringify(data) });
                        const result = await res.json();
                        if (!res.ok) throw new Error(result.message);
                        row.dataset.id = result.id;
                        target.textContent = 'Actualizar';
                        row.querySelector('.delete-btn').classList.remove('hidden');
                        unsavedChanges = false;
                        showToast('Registro guardado');
                    } catch (error) { showToast(`Error al guardar: ${error.message}`, 'error'); } 
                    finally { target.disabled = false; }
                } else {
                    target.disabled = false;
                }
            }
        }
        if (target.classList.contains('delete-btn')) {
            if (!entryId || !confirm(`¿Borrar el registro del día ${data.fecha}?`)) return;
            try {
                const res = await fetch(`http://localhost:3000/api/work-entries/${entryId}`, { method: 'DELETE', headers: authHeaders });
                if (!res.ok) throw new Error((await res.json()).message);
                row.removeAttribute('data-id');
                ['horas_normales', 'horas_extras_50', 'horas_extras_100', 'descripcion'].forEach(name => row.querySelector(`[name="${name}"]`).value = '');
                row.querySelector('.save-btn').textContent = 'Guardar';
                target.classList.add('hidden');
                unsavedChanges = false;
                showToast('Registro eliminado');
                recalculateTotals();
            } catch (error) { showToast(`Error al borrar: ${error.message}`, 'error'); }
        }
    });
    
    generatePayrollBtn.addEventListener('click', () => {
        if (unsavedChanges) {
            if (!confirm('Tienes cambios sin guardar. ¿Continuar a la liquidación de todos modos?')) return;
        }
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        window.location.href = `payroll.html?mes=${month}&anio=${year}&employee_id=${employeeId}`;
    });

    window.addEventListener('beforeunload', (e) => {
        if (unsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    init();
});
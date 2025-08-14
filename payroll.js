document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const loadingDiv = document.getElementById('loading');
    const payrollContainer = document.getElementById('payrollContainer');
    const messageDiv = document.getElementById('message');
    const conceptForm = document.getElementById('conceptForm');
    const conceptsList = document.getElementById('conceptsList');
    const finalTotalEl = document.getElementById('finalTotal');
    const confirmPayrollBtn = document.getElementById('confirmPayrollBtn');
    const antiquityBonusEl = document.getElementById('antiquityBonus');

    // --- AUTENTICACIÓN Y PARÁMETROS ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const urlParams = new URLSearchParams(window.location.search);
    const mes = urlParams.get('mes');
    const anio = urlParams.get('anio');
    const employeeId = urlParams.get('employee_id');
    if (!mes || !anio || !employeeId) {
        loadingDiv.innerHTML = '<p class="text-red-600">Error: Faltan parámetros en la URL.</p>';
        return;
    }

    // --- ESTADO ---
    let payrollData = null;
    let concepts = [];
    let baseRemunerativeTotal = 0;

    // --- FUNCIONES AUXILIARES ---
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const showToast = (text, type = 'success') => {
        const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text, duration: 3000, gravity: "bottom", position: "right", backgroundColor, stopOnFocus: true }).showToast();
    };

    // --- LÓGICA ---
    const updateTotal = () => {
        const remunerativeConceptsTotal = concepts
            .filter(c => !c.is_non_remunerative)
            .reduce((acc, c) => acc + (c.type === 'addition' ? c.amount : -c.amount), 0);
        
        const nonRemunerativeConceptsTotal = concepts
            .filter(c => c.is_non_remunerative)
            .reduce((acc, c) => acc + (c.type === 'addition' ? c.amount : -c.amount), 0);

        const newRemunerativeTotal = baseRemunerativeTotal + remunerativeConceptsTotal;
        const newAntiquityBonus = newRemunerativeTotal * (Math.floor(payrollData.antiquity.years) / 100);
        antiquityBonusEl.textContent = formatCurrency(newAntiquityBonus);

        const newFinalTotal = newRemunerativeTotal + newAntiquityBonus + nonRemunerativeConceptsTotal;
        finalTotalEl.textContent = formatCurrency(newFinalTotal);
        if(payrollData) payrollData.final_total_con_conceptos = newFinalTotal;
    };

    const renderConcepts = () => {
        conceptsList.innerHTML = '';
        if (concepts.length === 0) {
            conceptsList.innerHTML = '<p class="text-sm text-gray-500 text-center">No hay conceptos adicionales.</p>';
        }
        concepts.forEach(concept => {
            const isAddition = concept.type === 'addition';
            const textColor = isAddition ? 'text-green-600' : 'text-red-600';
            const sign = isAddition ? '+' : '-';
            const nonRemunText = concept.is_non_remunerative ? '<span class="text-xs text-gray-400">(No Remun.)</span>' : '';
            const conceptEl = document.createElement('div');
            conceptEl.className = 'flex justify-between items-center text-sm py-1';
            conceptEl.innerHTML = `
                <div><span>${concept.description}</span> ${nonRemunText}</div>
                <span class="font-mono ${textColor} flex items-center gap-2">
                    ${sign} ${formatCurrency(concept.amount)}
                    <button data-id="${concept.id}" class="delete-concept-btn text-xs bg-gray-200 text-gray-600 px-1 rounded hover:bg-red-500 hover:text-white">&times;</button>
                </span>`;
            conceptsList.appendChild(conceptEl);
        });
        updateTotal();
    };
    
    const displayPayroll = (data) => {
        baseRemunerativeTotal = data.subtotals.subtotal_horas_normales + data.subtotals.subtotal_horas_extras_50 + data.subtotals.subtotal_horas_extras_100;
        payrollData = data;
        const monthName = new Date(data.anio, data.mes - 1).toLocaleDateString('es-ES', { month: 'long' });
        document.getElementById('payrollPeriod').textContent = `${monthName.replace(/^\w/, c => c.toUpperCase())} ${data.anio}`;
        document.getElementById('employeeName').textContent = data.employeeProfile.nombre_empleado;
        document.getElementById('period').textContent = `${monthName.replace(/^\w/, c => c.toUpperCase())} ${data.anio}`;
        document.getElementById('totalNormalHours').textContent = data.totals.total_horas_normales.toFixed(2);
        document.getElementById('subtotalNormal').textContent = formatCurrency(data.subtotals.subtotal_horas_normales);
        document.getElementById('totalExtra50Hours').textContent = data.totals.total_horas_extras_50.toFixed(2);
        document.getElementById('subtotalExtra50').textContent = formatCurrency(data.subtotals.subtotal_horas_extras_50);
        document.getElementById('totalExtra100Hours').textContent = data.totals.total_horas_extras_100.toFixed(2);
        document.getElementById('subtotalExtra100').textContent = formatCurrency(data.subtotals.subtotal_horas_extras_100);
        document.getElementById('antiquityPercent').textContent = data.antiquity.percentage.toFixed(2);
        updateTotal();
    };

    (async () => {
        try {
            const response = await fetch(`/api/generate-payroll?mes=${mes}&anio=${anio}&employee_id=${employeeId}`, { headers: authHeaders });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            displayPayroll(data);
            loadingDiv.classList.add('hidden');
            payrollContainer.classList.remove('hidden');
        } catch (error) {
            loadingDiv.innerHTML = `<p class="text-red-600">Error al generar la liquidación: ${error.message}</p>`;
        }
    })();

    // --- MANEJO DE EVENTOS ---
    conceptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const description = document.getElementById('conceptDescription').value;
        const amount = parseFloat(document.getElementById('conceptAmount').value);
        const type = document.getElementById('conceptType').value;
        const is_non_remunerative = document.getElementById('isNonRemunerative').checked;
        if (!description || !amount || amount <= 0) {
            showToast('Por favor, complete la descripción y un monto válido.', 'error');
            return;
        }
        if (!payrollData.id) {
            showToast('Guarde la liquidación base antes de añadir conceptos.', 'error');
            return;
        }
        try {
            const res = await fetch(`/api/payrolls/${payrollData.id}/concepts`, {
                method: 'POST', headers: authHeaders,
                body: JSON.stringify({ description, amount, type, is_non_remunerative })
            });
            const newConcept = await res.json();
            if (!res.ok) throw new Error(newConcept.message);
            concepts.push({ id: newConcept.id, description, amount, type, is_non_remunerative });
            renderConcepts();
            conceptForm.reset();
            showToast('Concepto añadido.');
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    });

    conceptsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-concept-btn')) {
            const conceptId = e.target.dataset.id;
            if (!confirm('¿Seguro que quieres eliminar este concepto?')) return;
            try {
                const res = await fetch(`/api/payrolls/concepts/${conceptId}`, { method: 'DELETE', headers: authHeaders });
                if (!res.ok) throw new Error((await res.json()).message);
                concepts = concepts.filter(c => c.id != conceptId);
                renderConcepts();
                showToast('Concepto eliminado.');
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
            }
        }
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = `tracker.html?employee_id=${employeeId}`;
    });

    confirmPayrollBtn.addEventListener('click', async () => {
        if (!payrollData) return;
        confirmPayrollBtn.disabled = true;
        confirmPayrollBtn.textContent = 'Guardando...';
        try {
            payrollData.monto_total_final = payrollData.final_total_con_conceptos || baseTotal;
            const response = await fetch('http://localhost:3000/api/payrolls', {
                method: 'POST', headers: authHeaders, body: JSON.stringify(payrollData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            payrollData.id = result.id;
            showToast(result.message);
            confirmPayrollBtn.textContent = 'Liquidación Guardada';
            confirmPayrollBtn.classList.remove('btn-green');
            confirmPayrollBtn.classList.add('bg-gray-400');
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
            confirmPayrollBtn.disabled = false;
            confirmPayrollBtn.textContent = 'Confirmar y Guardar Liquidación';
        }
    });
});
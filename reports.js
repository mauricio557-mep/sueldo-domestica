document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DEL DOM ---
    const mainHeader = document.getElementById('mainHeader');
    const filterType = document.getElementById('filterType');
    const monthFilter = document.getElementById('monthFilter');
    const rangeFilter = document.getElementById('rangeFilter');
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const reportTitle = document.getElementById('reportTitle');
    const reportResults = document.getElementById('reportResults');
    const reportActions = document.getElementById('reportActions');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // --- AUTENTICACIÓN Y PARÁMETROS ---
    const token = localStorage.getItem('jwt_token');
    if (!token) { window.location.href = 'index.html'; return; }
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employee_id');
    if (!employeeId) {
        reportTitle.textContent = 'Error: No se ha especificado un empleado.';
        return;
    }

    // --- FUNCIONES ---
    const formatCurrency = (value) => (value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES');

    const setupFilters = () => {
        const now = new Date();
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthSelect.innerHTML = months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        monthSelect.value = now.getMonth() + 1;
        yearSelect.value = now.getFullYear();
    };

    const toggleFilters = () => {
        if (filterType.value === 'month') {
            monthFilter.classList.remove('hidden');
            rangeFilter.classList.add('hidden');
        } else {
            monthFilter.classList.add('hidden');
            rangeFilter.classList.remove('hidden');
        }
    };

    const fetchAndDisplayReport = async () => {
        let url = '/api/reports/work-entries?';
        let title = '';
        url += `employee_id=${employeeId}`;
        if (filterType.value === 'month') {
            const mes = monthSelect.value;
            const anio = yearSelect.value;
            url += `&startDate=${anio}-${String(mes).padStart(2, '0')}-01`;
            const lastDay = new Date(anio, mes, 0).getDate();
            url += `&endDate=${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            title = `Informe de Horas - ${monthSelect.options[monthSelect.selectedIndex].text} ${anio}`;
        } else {
            const start = startDate.value;
            const end = endDate.value;
            if (!start || !end) { alert('Por favor, seleccione un rango de fechas válido.'); return; }
            url += `&startDate=${start}&endDate=${end}`;
            title = `Informe de Horas - Desde ${formatDate(start)} hasta ${formatDate(end)}`;
        }
        reportTitle.textContent = 'Cargando...';
        reportResults.innerHTML = '';
        reportActions.classList.add('hidden');
        try {
            const response = await fetch(url, { headers: authHeaders });
            const entries = await response.json();
            if (!response.ok) throw new Error(entries.message);
            reportTitle.textContent = title;
            if (entries.length === 0) {
                reportResults.innerHTML = '<p class="text-center text-gray-500">No se encontraron registros para el período seleccionado.</p>';
                return;
            }
            let totalHorasNormales = 0, totalExtras50 = 0, totalExtras100 = 0, totalImporte = 0;
            const tableRows = entries.map(entry => {
                const subtotal = (entry.horas_normales * entry.valor_hora_base_aplicado) + (entry.horas_extras_50 * entry.valor_hora_base_aplicado * 1.5) + (entry.horas_extras_100 * entry.valor_hora_base_aplicado * 2);
                totalHorasNormales += entry.horas_normales;
                totalExtras50 += entry.horas_extras_50;
                totalExtras100 += entry.horas_extras_100;
                totalImporte += subtotal;
                return `<tr class="border-b"><td class="p-2">${formatDate(entry.fecha)}</td><td class="p-2 text-center">${entry.horas_normales.toFixed(2)}</td><td class="p-2 text-center">${entry.horas_extras_50.toFixed(2)}</td><td class="p-2 text-center">${entry.horas_extras_100.toFixed(2)}</td><td class="p-2 font-mono text-right">${formatCurrency(subtotal)}</td></tr>`;
            }).join('');
            reportResults.innerHTML = `<table class="min-w-full text-sm">
                    <thead class="bg-gray-100"><tr><th class="p-2 text-left font-medium">Fecha</th><th class="p-2 text-center font-medium">H. Normales</th><th class="p-2 text-center font-medium">H. Extras 50%</th><th class="p-2 text-center font-medium">H. Extras 100%</th><th class="p-2 text-right font-medium">Subtotal</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                    <tfoot class="font-bold bg-gray-50"><tr><td class="p-2">TOTALES</td><td class="p-2 text-center">${totalHorasNormales.toFixed(2)}</td><td class="p-2 text-center">${totalExtras50.toFixed(2)}</td><td class="p-2 text-center">${totalExtras100.toFixed(2)}</td><td class="p-2 font-mono text-right">${formatCurrency(totalImporte)}</td></tr></tfoot>
                </table>`;
            reportActions.classList.remove('hidden');
        } catch (error) {
            reportTitle.textContent = 'Error';
            reportResults.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        }
    };

    // --- LÓGICA DE INICIALIZACIÓN ---
    (async () => {
        try {
            const profileRes = await fetch(`/api/employee-profile/${employeeId}`, { headers: authHeaders });
            if (!profileRes.ok) throw new Error('PROFILE_NOT_FOUND');
            const employeeProfile = await profileRes.json();
            mainHeader.innerHTML = `
                <div class="header-content">
                    <div>
                        <h1 class="app-title">Gestionando a: ${employeeProfile.nombre_empleado}</h1>
                        <a href="/employees.html" class="text-sm text-blue-300 hover:underline">&larr; Cambiar de Empleado</a>
                    </div>
                </div>`;
            setupFilters();
            toggleFilters();
        } catch (error) {
            mainHeader.innerHTML = `<h1 class="app-title text-red-500">Error al cargar perfil</h1>`;
        }
    })();

    // --- MANEJO DE EVENTOS ---
    filterType.addEventListener('change', toggleFilters);
    applyFilterBtn.addEventListener('click', fetchAndDisplayReport);
    downloadPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const printableArea = document.getElementById('printableArea');
        html2canvas(printableArea, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
            pdf.save(`Informe-Horas-${new Date().toISOString().split('T')[0]}.pdf`);
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const userInfoContainer = document.getElementById('userInfo');
    const navContainer = document.getElementById('mainNav');
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('employee_id');
    const currentPage = window.location.pathname.split('/').pop();

    // --- Renderizar User Info ---
    if (userInfoContainer) {
        const userEmail = localStorage.getItem('userEmail') || 'Usuario';
        userInfoContainer.innerHTML = `
            <span>${userEmail}</span>
            <button id="logoutBtn" class="ml-4 text-sm font-semibold text-white hover:underline">Cerrar Sesión</button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'index.html';
            });
        }
    }

    // --- Renderizar Navegación específica del empleado ---
    if (navContainer && employeeId) {
        const navLinks = [
            { href: `tracker.html?employee_id=${employeeId}`, text: 'Registro de Horas', page: 'tracker.html' },
            { href: `sac.html?employee_id=${employeeId}`, text: 'Calcular SAC', page: 'sac.html' },
            { href: `vacations.html?employee_id=${employeeId}`, text: 'Calcular Vacaciones', page: 'vacations.html' },
            { href: `history.html?employee_id=${employeeId}`, text: 'Liquidaciones', page: 'history.html' },
            { href: `reports.html?employee_id=${employeeId}`, text: 'Informes', page: 'reports.html' },
            { href: `setup.html?employee_id=${employeeId}`, text: 'Editar Perfil', page: 'setup.html' }
        ];

        const linksHTML = navLinks.map(link => `
            <li class="nav-item">
                <a href="${link.href}" class="${link.page === currentPage ? 'active' : ''}">${link.text}</a>
            </li>
        `).join('');

        navContainer.innerHTML = `<ul class="nav-list">${linksHTML}</ul>`;
    }
});
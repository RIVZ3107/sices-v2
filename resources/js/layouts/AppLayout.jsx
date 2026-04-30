import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../authStore';
import { logout } from '../api/auth';
import { SidebarPro } from './SidebarPro';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';

function Icon({ name }) {
    const cls = 'h-4 w-4';
    if (name === 'menu') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    }
    if (name === 'bell') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}><path d="M15 18H9m9-2H6l1.2-1.2A2 2 0 0 0 8 13.4V11a4 4 0 1 1 8 0v2.4a2 2 0 0 0 .8 1.4L18 16Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
    }
    if (name === 'sun') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.2M12 19.8V22M4.2 12H2m20 0h-2.2M5.6 5.6 4 4m16 16-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" /></svg>;
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
}

function roleLabel(role) {
    const labels = {
        superadmin: 'Superadmin',
        admin: 'Administrador',
        control_escolar_escuela: 'Control Escolar',
        director_escuela: 'Director Escuela',
        educacion_superior: 'Educación Superior',
        sistemas: 'Sistemas',
        auditor: 'Auditor',
        consulta: 'Consulta',
    };
    return labels[role] ?? role ?? 'Sin rol';
}

export function AppLayout() {
    const user = getUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('sices_dark_mode') === '1');
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const currentRole = user?.roles?.[0] ?? 'sin-rol';
    const initials = (user?.name ?? 'US')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
    const breadcrumb = useMemo(() => {
        const path = location.pathname.replace('/app/', '');
        return path.split('/').filter(Boolean).map((part) => part.replaceAll('-', ' '));
    }, [location.pathname]);
    const currentSection = breadcrumb[breadcrumb.length - 1] ?? 'dashboard';

    useEffect(() => {
        document.body.classList.toggle('theme-dark', darkMode);
        window.localStorage.setItem('sices_dark_mode', darkMode ? '1' : '0');
    }, [darkMode]);

    async function onLogout() {
        try {
            await logout();
        } catch {
            // noop
        } finally {
            clearSession();
            navigate('/login');
        }
    }

    return (
        <div className="admin-layout">
            <SidebarPro
                user={user}
                open={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
                onLogout={onLogout}
                onEditProfile={() => navigate('/app/dashboard')}
            />

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button className="admin-icon-btn md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
                            <Icon name="menu" />
                        </button>
                        <div>
                            <p className="admin-topbar-title">SICES V2</p>
                            <p className="admin-topbar-subtitle">
                                {roleLabel(currentRole)} · {currentSection}
                            </p>
                        </div>
                    </div>

                    <div className="admin-topbar-actions">
                        <input className="admin-search" placeholder="Buscar módulo o documento..." />
                        <button
                            className="admin-icon-btn"
                            aria-label="Notificaciones"
                            onClick={() => setNotificationsOpen((prev) => !prev)}
                        >
                            <Icon name="bell" />
                        </button>
                        {notificationsOpen ? <NotificationDropdown items={['Bandeja sincronizada correctamente.', 'Sin alertas críticas.']} /> : null}
                        <button className="admin-icon-btn" onClick={() => setDarkMode((v) => !v)} aria-label="Cambiar tema">
                            <Icon name={darkMode ? 'sun' : 'moon'} />
                        </button>
                        <span className="admin-role-pill">{roleLabel(currentRole)}</span>
                        <div className="admin-userbox">
                            <span className="admin-user-avatar">{initials || 'US'}</span>
                            <p className="admin-user-name">{user?.name ?? 'Usuario'}</p>
                            <p className="admin-user-role">SICES V2</p>
                        </div>
                    </div>
                </header>

                <section className="admin-content">
                    <div className="admin-breadcrumb">
                        <span>Inicio</span>
                        {breadcrumb.map((part) => (
                            <span key={part}>/ {part}</span>
                        ))}
                    </div>
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

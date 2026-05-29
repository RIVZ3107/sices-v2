import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../authStore';
import { logout } from '../api/auth';
import { SidebarPro } from './SidebarPro';
import { NotificationDropdown } from '../components/ui/NotificationDropdown';
import { useSicesTheme } from '../theme/useSicesTheme';

function Icon({ name }) {
    const cls = 'h-4 w-4';
    if (name === 'bell') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}><path d="M15 18H9m9-2H6l1.2-1.2A2 2 0 0 0 8 13.4V11a4 4 0 1 1 8 0v2.4a2 2 0 0 0 .8 1.4L18 16Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
    }
    if (name === 'sun') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.2M12 19.8V22M4.2 12H2m20 0h-2.2M5.6 5.6 4 4m16 16-1.6-1.6M18.4 5.6 20 4M4 20l1.6-1.6" /></svg>;
    }
    if (name === 'moon') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5Z" /></svg>;
    }
    if (name === 'search') {
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
}

function roleLabel(role) {
    const labels = {
        superadmin: 'Superadmin',
        admin: 'Administrador',
        control_escolar_escuela: 'Control Escolar',
        director_escuela: 'Dirección de Escuela',
        educacion_superior: 'Educación Superior',
        responsable_admision: 'Responsable admisión',
        responsable_evaluacion: 'Responsable evaluación',
        responsable_certificacion_titulacion: 'Certificación / titulación',
        alumno_egresado: 'Alumno / egresado',
        aspirante_preinscrito: 'Aspirante',
        sistemas: 'Sistemas',
        auditor: 'Auditor',
        docente: 'Docente',
        coordinador_academico: 'Coordinador académico',
        consulta: 'Consulta',
    };
    return labels[role] ?? role ?? 'Sin rol';
}

const BREADCRUMB_LABELS = {
    certificacion: 'Certificación',
    dashboard: 'Dashboard',
    solicitudes: 'Solicitudes',
    'documentos-a-certificar': 'Documentos a certificar',
    'generacion-documentos': 'Generación de documentos',
    'firma-electronica': 'Firma electrónica',
    'entrega-seguimiento': 'Entrega y seguimiento',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    notificaciones: 'Notificaciones',
    revision: 'Revisión institucional',
    'educacion-superior': 'Educación Superior',
    normales: 'Escuelas Normales',
    upn: 'UPN',
    certificacion: 'Certificación',
    'upn-certificacion': 'Certificación UPN',
    titulos: 'Títulos',
    'grados-academicos': 'Grados académicos',
    constancias: 'Constancias',
    sistemas: 'Sistemas',
    'proceso-tecnico-certificacion': 'Incidencias técnicas',
    'documento-proceso-tecnico': 'Diagnóstico técnico',
    instituciones: 'Instituciones',
    sedes: 'Sedes',
    programas: 'Programas',
    planes: 'Planes',
    'validaciones-normativas': 'Validaciones normativas',
    'reportes-oficiales': 'Reportes oficiales',
};

function breadcrumbLabel(segment) {
    return BREADCRUMB_LABELS[segment] ?? segment.replaceAll('-', ' ');
}

export function AppLayout() {
    const { theme, refreshTheme } = useSicesTheme();
    const user = getUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('sices_dark_mode') === '1');
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const isControlEscolar = (user?.roles ?? []).includes('control_escolar_escuela');
    const isDirectorEscuela = (user?.roles ?? []).includes('director_escuela');
    const institutionalShell = isControlEscolar || isDirectorEscuela;
    const roles = user?.roles ?? [];
    const currentRole =
        roles.find((r) => ['director_escuela', 'control_escolar_escuela', 'educacion_superior', 'sistemas'].includes(r)) ?? roles[0] ?? 'consulta';
    const initials = (user?.name ?? 'US')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    const breadcrumb = useMemo(() => {
        const path = location.pathname.replace(/^\/app\/?/, '');
        return path.split('/').filter(Boolean);
    }, [location.pathname]);

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
            await refreshTheme();
            navigate('/login');
        }
    }

    return (
        <div className="admin-layout">
            <SidebarPro
                user={user}
                open={false}
                collapsed={sidebarCollapsed}
                onClose={() => {}}
                onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
                onLogout={onLogout}
                onEditProfile={() => navigate('/app/dashboard')}
            />

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <div>
                            <p className="admin-topbar-title">SICES v2</p>
                            <p className="admin-topbar-subtitle">Panel institucional</p>
                        </div>
                    </div>

                    <div className="admin-topbar-actions">
                        {institutionalShell ? (
                            <label className="hidden shrink-0 items-center gap-2 text-xs text-slate-600 lg:flex">
                                <span className="font-semibold">Ciclo escolar</span>
                                <select className="admin-ciclo-select" aria-label="Ciclo escolar">
                                    <option>2024 — 2025</option>
                                    <option>2023 — 2024</option>
                                </select>
                            </label>
                        ) : null}
                        <div className="relative flex min-w-0 flex-1 items-center">
                            <div className="absolute left-3 text-slate-400">
                                <Icon name="search" />
                            </div>
                            <input
                                className="admin-search pl-9"
                                style={{ paddingLeft: '35px' }}
                                placeholder={
                                    institutionalShell
                                        ? 'Buscar alumnos, expedientes, trámites, documentos…'
                                        : 'Buscar módulo o documento...'
                                }
                            />
                        </div>

                        <div className="relative shrink-0">
                            <button
                                className="admin-icon-btn"
                                aria-label="Notificaciones"
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                            >
                                <Icon name="bell" />
                            </button>
                            {institutionalShell ? (
                                <span className="admin-bell-badge">{isControlEscolar ? '8' : '5'}</span>
                            ) : null}
                            {notificationsOpen && (
                                <NotificationDropdown items={['Bandeja sincronizada correctamente.', 'Sin alertas críticas.']} />
                            )}
                        </div>

                        <button
                            className="admin-icon-btn"
                            onClick={() => setDarkMode((v) => !v)}
                            aria-label="Cambiar tema"
                        >
                            <Icon name={darkMode ? 'sun' : 'moon'} />
                        </button>

                        <div className="admin-userbox">
                            <span className="admin-user-avatar">{initials || 'US'}</span>
                            <div className="flex flex-col">
                                <p className="admin-user-name">{user?.name ?? 'Usuario'}</p>
                                <p className="admin-user-role">{roleLabel(currentRole)}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="admin-content">
                    <div className="admin-breadcrumb">
                        <span>Inicio</span>
                        {breadcrumb.map((part) => (
                            <span key={part}>/ {breadcrumbLabel(part)}</span>
                        ))}
                    </div>
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

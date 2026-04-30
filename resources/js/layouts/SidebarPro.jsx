import { NavLink } from 'react-router-dom';

const icon = (d) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
        {d}
    </svg>
);

const icons = {
    home: icon(<path d="M3 12h8V3H3v9Zm10 9h8v-7h-8v7Zm0-18v7h8V3h-8ZM3 21h8v-5H3v5Z" />),
    users: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>),
    settings: icon(<path d="m12 15.5 3.5-2-3.5-2-3.5 2 3.5 2Zm7-8.5-7-4-7 4v10l7 4 7-4V7Z" />),
    docs: icon(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></>),
    report: icon(<><path d="M3 3v18h18" /><path d="M7 15v-4m5 4V7m5 8v-2" /></>),
    audit: icon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
    status: icon(<path d="M4 12h4l2-5 4 10 2-5h4" />),
    profile: icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
    logout: icon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
    collapse: icon(<path d="m15 18-6-6 6-6" />),
    expand: icon(<path d="m9 18 6-6-6-6" />),
    close: icon(<path d="m18 6-12 12M6 6l12 12" />),
};

const i = (to, label, iconName) => ({ to, label, iconName });
const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'ADMINISTRACIÓN', links: [i('/app/superadmin/dashboard', 'Panel institucional', 'home'), i('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), i('/app/admin/catalogos', 'Catálogos', 'settings'), i('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas', 'Documentos académicos', 'docs'), i('/app/importaciones', 'Importaciones', 'docs'), i('/app/sistemas/listos-para-firma', 'Listos para firma', 'status'), i('/app/admin/reportes-basicos', 'Reportes básicos', 'report')] },
        { section: 'TÉCNICO', links: [i('/app/auditoria', 'Auditoría', 'audit'), i('/app/sistemas/configuracion', 'Integraciones', 'settings'), i('/app/sistemas/logs', 'Logs del sistema', 'docs'), i('/app/sistemas/dashboard', 'Estado del sistema', 'status')] },
    ],
    admin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'ADMINISTRACIÓN', links: [i('/app/admin/dashboard', 'Panel institucional', 'home'), i('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), i('/app/admin/catalogos', 'Catálogos', 'settings'), i('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas', 'Documentos académicos', 'docs'), i('/app/importaciones', 'Importaciones', 'docs'), i('/app/sistemas/listos-para-firma', 'Listos para firma', 'status'), i('/app/admin/reportes-basicos', 'Reportes básicos', 'report')] },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/nuevo', 'Documentos académicos', 'docs'), i('/app/documentos/bandejas/por-rol', 'Mis documentos', 'docs'), i('/app/alumnos', 'Alumnos', 'users'), i('/app/matriculas', 'Matrículas', 'docs'), i('/app/materias-cursadas', 'Materias / calificaciones', 'docs'), i('/app/trayectorias', 'Trayectoria', 'report'), i('/app/importaciones', 'Importaciones', 'docs')] },
    ],
    director_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas/por-rol', 'Documentos de escuela', 'docs'), i('/app/documentos/bandejas/en-revision', 'En revisión', 'status'), i('/app/documentos/bandejas/aprobados', 'Aprobados', 'report'), i('/app/documentos/bandejas/rechazados', 'Rechazados', 'audit')] },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas/pendientes-revision', 'Pendientes', 'docs'), i('/app/documentos/validacion', 'Validación académica', 'status'), i('/app/documentos/bandejas/aprobados', 'Aprobados', 'report'), i('/app/documentos/bandejas/rechazados', 'Observados', 'audit')] },
        { section: 'TÉCNICO', links: [i('/app/sistemas/listos-para-firma', 'Listos para firma', 'status')] },
    ],
    sistemas: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'TÉCNICO', links: [i('/app/sistemas/dashboard', 'Estado del sistema', 'status'), i('/app/sistemas/listos-para-firma', 'Listos para firma', 'status'), i('/app/sistemas/logs', 'Logs del sistema', 'docs'), i('/app/sistemas/configuracion', 'Integraciones', 'settings')] },
    ],
    auditor: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'TÉCNICO', links: [i('/app/auditoria', 'Auditoría', 'audit'), i('/app/sistemas/logs', 'Logs del sistema', 'docs')] },
        { section: 'CONSULTA', links: [i('/app/consulta/documentos', 'Consulta de documentos', 'docs'), i('/app/consulta/dashboard', 'Historial', 'report')] },
    ],
    consulta: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'CONSULTA', links: [i('/app/consulta/dashboard', 'Panel consulta', 'report'), i('/app/consulta/documentos', 'Consulta de documentos', 'docs'), i('/app/admin/reportes-basicos', 'Reportes lectura', 'report')] },
    ],
    docente: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'OPERACIÓN', links: [i('/app/docente/dashboard', 'Panel docente', 'users')] },
    ],
    coordinador_academico: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard', 'home')] },
        { section: 'OPERACIÓN', links: [i('/app/coordinador/dashboard', 'Panel coordinación', 'users')] },
    ],
};

export function SidebarPro({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
    const role = user?.roles?.[0] ?? 'admin';
    const groups = menuByRole[role] ?? menuByRole.admin;

    return (
        <aside className={`admin-sidebar ${collapsed ? 'is-collapsed' : ''} ${open ? 'is-open' : ''}`}>
            <div className="admin-sidebar-head">
                <div>
                    <p className="admin-logo">SICES V2</p>
                    {!collapsed ? <p className="admin-logo-sub">Panel institucional</p> : null}
                </div>
                <div className="flex items-center gap-1">
                    <button className="admin-icon-btn hidden md:inline-flex" onClick={onToggleCollapse} aria-label="Colapsar menú">{collapsed ? icons.expand : icons.collapse}</button>
                </div>
            </div>
            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed ? <p className="admin-menu-title">{group.section}</p> : null}
                        <div className="admin-menu-links">
                            {group.links.map((link) => (
                                <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}>
                                    <span className="admin-menu-icon">{icons[link.iconName]}</span>
                                    {!collapsed ? <span>{link.label}</span> : null}
                                </NavLink>
                            ))}
                        </div>
                    </section>
                ))}
            </nav>
            <div className="admin-sidebar-actions">
                <button className="admin-menu-link" type="button" onClick={onEditProfile}>
                    <span className="admin-menu-icon">{icons.profile}</span>
                    {!collapsed ? <span>Editar perfil</span> : null}
                </button>
                <button className="admin-menu-link" type="button" onClick={onLogout}>
                    <span className="admin-menu-icon">{icons.logout}</span>
                    {!collapsed ? <span>Cerrar sesión</span> : null}
                </button>
            </div>
        </aside>
    );
}

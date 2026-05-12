import { NavLink } from 'react-router-dom';

function Icon({ type }) {
    const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.9', className: 'h-4 w-4' };
    const icons = {
        home: <path d="M3 12h8V3H3v9Zm10 9h8v-7h-8v7Zm0-18v7h8V3h-8ZM3 21h8v-5H3v5Z" />,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
        settings: <path d="m12 15.5 3.5-2-3.5-2-3.5 2 3.5 2Zm7-8.5-7-4-7 4v10l7 4 7-4V7Z" />,
        docs: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></>,
        report: <><path d="M3 3v18h18" /><path d="M7 15v-4m5 4V7m5 8v-2" /></>,
        audit: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
        status: <path d="M4 12h4l2-5 4 10 2-5h4" />,
        profile: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
        logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
        collapse: <path d="m15 18-6-6 6-6" />,
        expand: <path d="m9 18 6-6-6-6" />,
        close: <path d="m18 6-12 12M6 6l12 12" />,
    };
    return <svg {...props}>{icons[type] ?? icons.home}</svg>;
}

const i = (to, label, icon) => ({ to, label, icon });

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
        { section: 'MAIN', links: [i('/app/dashboard', 'Inicio', 'home')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/expedientes', 'Expedientes', 'users'),
                i('/app/solicitudes-matricula', 'Solicitudes de matrícula', 'docs'),
                i('/app/importaciones', 'Importaciones', 'docs'),
                i('/app/observaciones', 'Observaciones', 'audit'),
                i('/app/admin/reportes-basicos', 'Reportes', 'report'),
            ],
        },
    ],
};

export function Sidebar({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
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
                    <button className="admin-icon-btn hidden md:inline-flex" onClick={onToggleCollapse} aria-label="Colapsar menú">
                        <Icon type={collapsed ? 'expand' : 'collapse'} />
                    </button>
                    <button className="admin-icon-btn md:hidden" onClick={onClose} aria-label="Cerrar menú">
                        <Icon type="close" />
                    </button>
                </div>
            </div>

            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed ? <p className="admin-menu-title">{group.section}</p> : null}
                        <div className="admin-menu-links">
                            {group.links.map((link) => (
                                <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}>
                                    <span className="admin-menu-icon"><Icon type={link.icon} /></span>
                                    {!collapsed ? <span>{link.label}</span> : null}
                                </NavLink>
                            ))}
                        </div>
                    </section>
                ))}
            </nav>

            <div className="admin-sidebar-actions">
                <button className="admin-menu-link" type="button" onClick={onEditProfile}>
                    <span className="admin-menu-icon"><Icon type="profile" /></span>
                    {!collapsed ? <span>Editar perfil</span> : null}
                </button>
                <button className="admin-menu-link" type="button" onClick={onLogout}>
                    <span className="admin-menu-icon"><Icon type="logout" /></span>
                    {!collapsed ? <span>Cerrar sesión</span> : null}
                </button>
            </div>
        </aside>
    );
}
import { NavLink } from 'react-router-dom';

export function Sidebar() {
    return <aside />;
}
import { NavLink } from 'react-router-dom';

function Icon({ name }) {
    const cls = 'h-4 w-4';
    const p = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.9', className: cls };
    if (name === 'dashboard') return <svg {...p}><path d="M3 12h8V3H3v9Zm10 9h8v-7h-8v7Zm0-18v7h8V3h-8ZM3 21h8v-5H3v5Z" /></svg>;
    if (name === 'institution') return <svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18" /></svg>;
    if (name === 'users') return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    if (name === 'catalog') return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
    if (name === 'settings') return <svg {...p}><path d="m12 15.5 3.5-2-3.5-2-3.5 2 3.5 2Z" /><path d="m19 7-7-4-7 4v10l7 4 7-4V7Z" /></svg>;
    if (name === 'docs') return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></svg>;
    if (name === 'import') return <svg {...p}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
    if (name === 'signature') return <svg {...p}><path d="M4 20h16" /><path d="M8 14c2 0 2-4 4-4s2 4 4 4" /><path d="M4 8c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" /></svg>;
    if (name === 'reports') return <svg {...p}><path d="M3 3v18h18" /><path d="M7 15v-4m5 4V7m5 8v-2" /></svg>;
    if (name === 'audit') return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    if (name === 'integrations') return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>;
    if (name === 'logs') return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    if (name === 'status') return <svg {...p}><path d="M4 12h4l2-5 4 10 2-5h4" /></svg>;
    if (name === 'search') return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    if (name === 'history') return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /><path d="M12 7v5l3 3" /></svg>;
    if (name === 'readonly') return <svg {...p}><path d="M18 2a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3" /><path d="M9 12h6" /></svg>;
    if (name === 'profile') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    if (name === 'logout') return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
    if (name === 'collapse') return <svg {...p}><path d="m15 18-6-6 6-6" /></svg>;
    if (name === 'expand') return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>;
    return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
}

function item(to, label, icon, disabled = false) {
    return { to, label, icon, disabled };
}

const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [item('/app/superadmin/dashboard', 'Panel institucional', 'institution'), item('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), item('/app/admin/catalogos', 'Catálogos', 'catalog'), item('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas', 'Documentos académicos', 'docs'), item('/app/importaciones', 'Importaciones', 'import'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature'), item('/app/admin/reportes-basicos', 'Reportes básicos', 'reports')] },
        { section: 'TÉCNICO', links: [item('/app/auditoria', 'Auditoría', 'audit'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/dashboard', 'Estado del sistema', 'status')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history'), item('/app/admin/reportes-basicos', 'Reportes de solo lectura', 'readonly')] },
    ],
    admin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [item('/app/admin/dashboard', 'Panel institucional', 'institution'), item('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), item('/app/admin/catalogos', 'Catálogos', 'catalog'), item('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas', 'Documentos académicos', 'docs'), item('/app/importaciones', 'Importaciones', 'import'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature'), item('/app/admin/reportes-basicos', 'Reportes básicos', 'reports')] },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Inicio', 'dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/expedientes', 'Expedientes', 'docs'),
                item('/app/expedientes?tab=ingreso', 'Aspirantes / Inscripciones', 'users'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', 'docs'),
                item('/app/materias-cursadas', 'Calificaciones', 'reports'),
                item('/app/trayectorias', 'Trayectoria / Kardex', 'reports'),
                item('/app/documentos/bandejas/por-rol', 'Documentos y constancias', 'docs'),
                item('/app/bajas-cambios', 'Bajas y cambios', 'audit'),
                item('/app/reinscripciones', 'Reinscripciones', 'reports'),
                item('/app/importaciones', 'Importaciones', 'import'),
                item('/app/observaciones', 'Observaciones', 'audit'),
                item('/app/admin/reportes-basicos', 'Reportes', 'reports'),
                item('/app/notificaciones', 'Notificaciones', 'status'),
            ],
        },
        { section: 'CONSULTA', links: [item('/app/alumnos', 'Alumnos (consulta)', 'users')] },
    ],
    director_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas/por-rol', 'Documentos académicos', 'docs'), item('/app/documentos/bandejas/en-revision', 'Validación', 'status')] },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/educacion-superior/instituciones', 'Instituciones', 'settings'),
                item('/app/educacion-superior/sedes', 'Sedes / Subsedes', 'settings'),
                item('/app/educacion-superior/programas', 'Programas académicos', 'panel'),
                item('/app/educacion-superior/planes', 'Planes de estudio', 'panel'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', 'reports'),
                item('/app/educacion-superior/validaciones-normativas', 'Validaciones normativas', 'status'),
                item('/app/educacion-superior/certificacion', 'Certificación', 'docs'),
                item('/app/educacion-superior/reportes-oficiales', 'Reportes oficiales', 'reports'),
                item('/app/consulta/documentos', 'Consulta pública', 'search'),
                item('/app/notificaciones', 'Notificaciones', 'status'),
            ],
        },
    ],
    sistemas: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'TÉCNICO', links: [item('/app/sistemas/dashboard', 'Estado del sistema', 'status'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature')] },
    ],
    auditor: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'TÉCNICO', links: [item('/app/auditoria', 'Auditoría', 'audit'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history')] },
    ],
    consulta: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history'), item('/app/admin/reportes-basicos', 'Reportes de solo lectura', 'readonly')] },
    ],
};

export function Sidebar({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
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
                    <button className="admin-icon-btn hidden md:inline-flex" onClick={onToggleCollapse} aria-label="Colapsar menú">
                        <Icon name={collapsed ? 'expand' : 'collapse'} />
                    </button>
                    <button className="admin-icon-btn md:hidden" onClick={onClose} aria-label="Cerrar menú">
                        <Icon name="collapse" />
                    </button>
                </div>
            </div>

            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed ? <p className="admin-menu-title">{group.section}</p> : null}
                        <div className="admin-menu-links">
                            {group.links.map((link) =>
                                link.disabled ? (
                                    <span key={link.label} className="admin-menu-link is-disabled" title="Pendiente de integración">
                                        <span className="admin-menu-icon"><Icon name={link.icon} /></span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </span>
                                ) : (
                                    <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}>
                                        <span className="admin-menu-icon"><Icon name={link.icon} /></span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </NavLink>
                                ),
                            )}
                        </div>
                    </section>
                ))}
            </nav>

            <div className="admin-sidebar-actions">
                <button className="admin-menu-link" onClick={onEditProfile} type="button">
                    <span className="admin-menu-icon"><Icon name="profile" /></span>
                    {!collapsed ? <span>Editar perfil</span> : null}
                </button>
                <button className="admin-menu-link" onClick={onLogout} type="button">
                    <span className="admin-menu-icon"><Icon name="logout" /></span>
                    {!collapsed ? <span>Cerrar sesión</span> : null}
                </button>
            </div>
        </aside>
    );
}
import { NavLink } from 'react-router-dom';

function Icon({ name }) {
    const cls = 'h-4 w-4';
    const p = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.9', className: cls };
    if (name === 'dashboard') return <svg {...p}><path d="M3 12h8V3H3v9Zm10 9h8v-7h-8v7Zm0-18v7h8V3h-8ZM3 21h8v-5H3v5Z" /></svg>;
    if (name === 'institution') return <svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18" /></svg>;
    if (name === 'users') return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    if (name === 'catalog') return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
    if (name === 'settings') return <svg {...p}><path d="m12 15.5 3.5-2-3.5-2-3.5 2 3.5 2Z" /><path d="m19 7-7-4-7 4v10l7 4 7-4V7Z" /></svg>;
    if (name === 'docs') return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /></svg>;
    if (name === 'import') return <svg {...p}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
    if (name === 'signature') return <svg {...p}><path d="M4 20h16" /><path d="M8 14c2 0 2-4 4-4s2 4 4 4" /><path d="M4 8c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3" /></svg>;
    if (name === 'reports') return <svg {...p}><path d="M3 3v18h18" /><path d="M7 15v-4m5 4V7m5 8v-2" /></svg>;
    if (name === 'audit') return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    if (name === 'integrations') return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>;
    if (name === 'logs') return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    if (name === 'status') return <svg {...p}><path d="M4 12h4l2-5 4 10 2-5h4" /></svg>;
    if (name === 'search') return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    if (name === 'history') return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /><path d="M12 7v5l3 3" /></svg>;
    if (name === 'readonly') return <svg {...p}><path d="M18 2a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3" /><path d="M9 12h6" /></svg>;
    if (name === 'profile') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    if (name === 'logout') return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
    if (name === 'collapse') return <svg {...p}><path d="m15 18-6-6 6-6" /></svg>;
    if (name === 'expand') return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>;
    return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
}

function item(to, label, icon, disabled = false) {
    return { to, label, icon, disabled };
}

const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [item('/app/superadmin/dashboard', 'Panel institucional', 'institution'), item('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), item('/app/admin/catalogos', 'Catálogos', 'catalog'), item('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas', 'Documentos académicos', 'docs'), item('/app/importaciones', 'Importaciones', 'import'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature'), item('/app/admin/reportes-basicos', 'Reportes básicos', 'reports')] },
        { section: 'TÉCNICO', links: [item('/app/auditoria', 'Auditoría', 'audit'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/dashboard', 'Estado del sistema', 'status')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history'), item('/app/admin/reportes-basicos', 'Reportes de solo lectura', 'readonly')] },
    ],
    admin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [item('/app/admin/dashboard', 'Panel institucional', 'institution'), item('/app/admin/usuarios-roles', 'Usuarios y roles', 'users'), item('/app/admin/catalogos', 'Catálogos', 'catalog'), item('/app/admin/parametros', 'Parámetros', 'settings')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas', 'Documentos académicos', 'docs'), item('/app/importaciones', 'Importaciones', 'import'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature'), item('/app/admin/reportes-basicos', 'Reportes básicos', 'reports')] },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Inicio', 'dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/expedientes', 'Expedientes', 'docs'),
                item('/app/expedientes?tab=ingreso', 'Aspirantes / Inscripciones', 'users'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', 'docs'),
                item('/app/materias-cursadas', 'Calificaciones', 'reports'),
                item('/app/trayectorias', 'Trayectoria / Kardex', 'reports'),
                item('/app/documentos/bandejas/por-rol', 'Documentos y constancias', 'docs'),
                item('/app/bajas-cambios', 'Bajas y cambios', 'audit'),
                item('/app/reinscripciones', 'Reinscripciones', 'reports'),
                item('/app/importaciones', 'Importaciones', 'import'),
                item('/app/observaciones', 'Observaciones', 'audit'),
                item('/app/admin/reportes-basicos', 'Reportes', 'reports'),
                item('/app/notificaciones', 'Notificaciones', 'status'),
            ],
        },
        { section: 'CONSULTA', links: [item('/app/alumnos', 'Alumnos (consulta)', 'users')] },
    ],
    director_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'OPERACIÓN', links: [item('/app/documentos/bandejas/por-rol', 'Documentos académicos', 'docs'), item('/app/documentos/bandejas/en-revision', 'Validación', 'status')] },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/educacion-superior/instituciones', 'Instituciones', 'settings'),
                item('/app/educacion-superior/sedes', 'Sedes / Subsedes', 'settings'),
                item('/app/educacion-superior/programas', 'Programas académicos', 'panel'),
                item('/app/educacion-superior/planes', 'Planes de estudio', 'panel'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', 'reports'),
                item('/app/educacion-superior/validaciones-normativas', 'Validaciones normativas', 'status'),
                item('/app/educacion-superior/certificacion', 'Certificación', 'docs'),
                item('/app/educacion-superior/reportes-oficiales', 'Reportes oficiales', 'reports'),
                item('/app/consulta/documentos', 'Consulta pública', 'search'),
                item('/app/notificaciones', 'Notificaciones', 'status'),
            ],
        },
    ],
    sistemas: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'TÉCNICO', links: [item('/app/sistemas/dashboard', 'Estado del sistema', 'status'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/listos-para-firma', 'Listos para firma', 'signature')] },
    ],
    auditor: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'TÉCNICO', links: [item('/app/auditoria', 'Auditoría', 'audit'), item('/app/sistemas/logs', 'Logs del sistema', 'logs'), item('/app/sistemas/configuracion', 'Integraciones', 'integrations')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history')] },
    ],
    consulta: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', 'dashboard')] },
        { section: 'CONSULTA', links: [item('/app/consulta/documentos', 'Consulta de documentos', 'search'), item('/app/consulta/dashboard', 'Historial', 'history'), item('/app/admin/reportes-basicos', 'Reportes de solo lectura', 'readonly')] },
    ],
};

export function Sidebar({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
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
                    <button className="admin-icon-btn hidden md:inline-flex" onClick={onToggleCollapse} aria-label="Colapsar menú">
                        <Icon name={collapsed ? 'expand' : 'collapse'} />
                    </button>
                    <button className="admin-icon-btn md:hidden" onClick={onClose} aria-label="Cerrar menú">
                        <Icon name="collapse" />
                    </button>
                </div>
            </div>

            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed ? <p className="admin-menu-title">{group.section}</p> : null}
                        <div className="admin-menu-links">
                            {group.links.map((link) =>
                                link.disabled ? (
                                    <span key={link.label} className="admin-menu-link is-disabled" title="Pendiente de integración">
                                        <span className="admin-menu-icon"><Icon name={link.icon} /></span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </span>
                                ) : (
                                    <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}>
                                        <span className="admin-menu-icon"><Icon name={link.icon} /></span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </NavLink>
                                ),
                            )}
                        </div>
                    </section>
                ))}
            </nav>

            <div className="admin-sidebar-actions">
                <button className="admin-menu-link" onClick={onEditProfile} type="button">
                    <span className="admin-menu-icon"><Icon name="profile" /></span>
                    {!collapsed ? <span>Editar perfil</span> : null}
                </button>
                <button className="admin-menu-link" onClick={onLogout} type="button">
                    <span className="admin-menu-icon"><Icon name="logout" /></span>
                    {!collapsed ? <span>Cerrar sesión</span> : null}
                </button>
            </div>
        </aside>
    );
}
import { NavLink } from 'react-router-dom';

function item(to, label, icon = '•', disabled = false) {
    return { to, label, icon, disabled };
}

const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'ADMINISTRACIÓN',
            links: [
                item('/app/superadmin/dashboard', 'Panel institucional', '🧭'),
                item('/app/admin/usuarios-roles', 'Usuarios y roles', '👥'),
                item('/app/admin/catalogos', 'Catálogos', '📚'),
                item('/app/admin/parametros', 'Parámetros', '⚙️'),
            ],
        },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/documentos/bandejas', 'Documentos académicos', '📄'),
                item('/app/importaciones', 'Importaciones', '⬆️'),
                item('/app/sistemas/listos-para-firma', 'Listos para firma', '✍️'),
                item('/app/admin/reportes-basicos', 'Reportes básicos', '📊'),
            ],
        },
        {
            section: 'TÉCNICO',
            links: [
                item('/app/auditoria', 'Auditoría', '🕵️'),
                item('/app/sistemas/configuracion', 'Integraciones', '🔌'),
                item('/app/sistemas/logs', 'Logs del sistema', '🧾'),
                item('/app/sistemas/dashboard', 'Estado del sistema', '🖥️'),
            ],
        },
        {
            section: 'CONSULTA',
            links: [
                item('/app/consulta/documentos', 'Consulta de documentos', '🔎'),
                item('/app/consulta/dashboard', 'Historial', '🗂️'),
                item('/app/admin/reportes-basicos', 'Reportes de solo lectura', '📑'),
            ],
        },
    ],
    admin: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'ADMINISTRACIÓN',
            links: [
                item('/app/admin/dashboard', 'Panel institucional', '🧭'),
                item('/app/admin/usuarios-roles', 'Usuarios y roles', '👥'),
                item('/app/admin/catalogos', 'Catálogos', '📚'),
                item('/app/admin/parametros', 'Parámetros', '⚙️'),
            ],
        },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/documentos/bandejas', 'Documentos académicos', '📄'),
                item('/app/importaciones', 'Importaciones', '⬆️'),
                item('/app/sistemas/listos-para-firma', 'Listos para firma', '✍️'),
                item('/app/admin/reportes-basicos', 'Reportes básicos', '📊'),
            ],
        },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Inicio', 'dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/expedientes', 'Expedientes', 'docs'),
                item('/app/expedientes?tab=ingreso', 'Aspirantes / Inscripciones', 'users'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', '📄'),
                item('/app/materias-cursadas', 'Calificaciones', '📊'),
                item('/app/trayectorias', 'Trayectoria / Kardex', '📊'),
                item('/app/documentos/bandejas/por-rol', 'Documentos y constancias', '📄'),
                item('/app/bajas-cambios', 'Bajas y cambios', '🔔'),
                item('/app/reinscripciones', 'Reinscripciones', '📊'),
                item('/app/importaciones', 'Importaciones', '⬆️'),
                item('/app/observaciones', 'Observaciones', '📬'),
                item('/app/admin/reportes-basicos', 'Reportes', '📊'),
                item('/app/notificaciones', 'Notificaciones', '🔔'),
            ],
        },
        { section: 'CONSULTA', links: [item('/app/alumnos', 'Alumnos (consulta)', '👥')] },
    ],
    director_escuela: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/documentos/bandejas/por-rol', 'Documentos académicos', '📄'),
                item('/app/documentos/bandejas/en-revision', 'Validación', '✅'),
            ],
        },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'OPERACIÓN',
            links: [
                item('/app/educacion-superior/instituciones', 'Instituciones', '🏫'),
                item('/app/educacion-superior/sedes', 'Sedes / Subsedes', '📍'),
                item('/app/educacion-superior/programas', 'Programas académicos', '📚'),
                item('/app/educacion-superior/planes', 'Planes de estudio', '📋'),
                item('/app/solicitudes-matricula', 'Solicitudes de matrícula', '📝'),
                item('/app/educacion-superior/validaciones-normativas', 'Validaciones normativas', '✅'),
                item('/app/educacion-superior/certificacion', 'Certificación', '📄'),
                item('/app/educacion-superior/reportes-oficiales', 'Reportes oficiales', '📊'),
                item('/app/consulta/documentos', 'Consulta pública', '🔎'),
                item('/app/notificaciones', 'Notificaciones', '🔔'),
            ],
        },
    ],
    sistemas: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'TÉCNICO',
            links: [
                item('/app/sistemas/dashboard', 'Estado del sistema', '🖥️'),
                item('/app/sistemas/configuracion', 'Integraciones', '🔌'),
                item('/app/sistemas/logs', 'Logs del sistema', '🧾'),
                item('/app/sistemas/listos-para-firma', 'Listos para firma', '✍️'),
            ],
        },
    ],
    auditor: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'TÉCNICO',
            links: [
                item('/app/auditoria', 'Auditoría', '🕵️'),
                item('/app/sistemas/logs', 'Logs del sistema', '🧾'),
                item('/app/sistemas/configuracion', 'Integraciones', '🔌'),
            ],
        },
        {
            section: 'CONSULTA',
            links: [
                item('/app/consulta/documentos', 'Consulta de documentos', '🔎'),
                item('/app/consulta/dashboard', 'Historial', '🗂️'),
            ],
        },
    ],
    consulta: [
        { section: 'MAIN', links: [item('/app/dashboard', 'Dashboard', '🏠')] },
        {
            section: 'CONSULTA',
            links: [
                item('/app/consulta/documentos', 'Consulta de documentos', '🔎'),
                item('/app/consulta/dashboard', 'Historial', '🗂️'),
                item('/app/admin/reportes-basicos', 'Reportes de solo lectura', '📑'),
            ],
        },
    ],
};

export function Sidebar({ user, open = false, collapsed = false, onClose, onToggleCollapse }) {
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
                    <button className="admin-icon-btn hidden md:inline-flex" onClick={onToggleCollapse} aria-label="Colapsar menú">
                        {collapsed ? '»' : '«'}
                    </button>
                    <button className="admin-icon-btn md:hidden" onClick={onClose} aria-label="Cerrar menú">
                        ✕
                    </button>
                </div>
            </div>

            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed ? <p className="admin-menu-title">{group.section}</p> : null}
                        <div className="admin-menu-links">
                            {group.links.map((link) =>
                                link.disabled ? (
                                    <span key={link.label} className="admin-menu-link is-disabled" title="Pendiente de integración">
                                        <span className="admin-menu-icon">{link.icon}</span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </span>
                                ) : (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={onClose}
                                        className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}
                                    >
                                        <span className="admin-menu-icon">{link.icon}</span>
                                        {!collapsed ? <span>{link.label}</span> : null}
                                    </NavLink>
                                ),
                            )}
                        </div>
                    </section>
                ))}
            </nav>
        </aside>
    );
}

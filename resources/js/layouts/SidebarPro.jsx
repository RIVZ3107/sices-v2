import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const icon = (children) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
        {children}
    </svg>
);

const icons = {
    home:        icon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
    users:       icon(<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>),
    settings:    icon(<><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>),
    docs:        icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></>),
    mydocs:      icon(<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></>),
    matriculas:  icon(<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6"/><path d="M9 12h6M9 16h4"/></>),
    materias:    icon(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></>),
    trayectoria: icon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),
    import:      icon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
    report:      icon(<><path d="M3 3v18h18"/><path d="M7 15v-4m5 4V7m5 8v-2"/></>),
    audit:       icon(<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
    status:      icon(<path d="M4 12h4l2-5 4 10 2-5h4"/>),
    validate:    icon(<><path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z"/></>),
    panel:       icon(<><rect x="3" y="3" width="8" height="5" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="3" y="11" width="8" height="10" rx="1"/><rect x="13" y="11" width="8" height="10" rx="1"/></>),
    logs:        icon(<><path d="M4 6h16M4 10h16M4 14h10M4 18h7"/></>),
    integrations:icon(<><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3"/><path d="M6 9V6"/></>),
    history:     icon(<><path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 16v-5h5"/></>),
    profile:     icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
    logout:      icon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
    collapse:    icon(<path d="m15 18-6-6 6-6"/>),
    expand:      icon(<path d="m9 18 6-6-6-6"/>),
    close:       icon(<path d="m18 6-12 12M6 6l12 12"/>),
};

const routeIconMap = {
    '/app/dashboard':                          'home',
    '/app/superadmin/dashboard':               'panel',
    '/app/admin/dashboard':                    'panel',
    '/app/admin/usuarios-roles':               'users',
    '/app/admin/catalogos':                    'settings',
    '/app/admin/parametros':                   'settings',
    '/app/documentos/bandejas':                'docs',
    '/app/documentos':                         'docs',
    '/app/documentos/nuevo':                   'docs',
    '/app/documentos/bandejas/por-rol':        'mydocs',
    '/app/documentos/bandejas/en-revision':    'status',
    '/app/documentos/bandejas/aprobados':      'validate',
    '/app/documentos/bandejas/firmados':       'validate',
    '/app/documentos/bandejas/rechazados':     'audit',
    '/app/documentos/bandejas/pendientes-revision': 'status',
    '/app/documentos/validacion':              'validate',
    '/app/documentos/observaciones':           'audit',
    '/app/importaciones':                      'import',
    '/app/expedientes':                       'users',
    '/app/observaciones':                     'audit',
    '/app/importaciones/legacy-normativa':   'validate',
    '/app/alumnos/captura-guiado':             'users',
    '/app/certificacion/solicitud':            'validate',
    '/app/sistemas/listos-para-firma':         'validate',
    '/app/admin/reportes-basicos':             'report',
    '/app/auditoria':                          'audit',
    '/app/sistemas/configuracion':             'integrations',
    '/app/sistemas/logs':                      'logs',
    '/app/sistemas/dashboard':                 'status',
    '/app/alumnos':                            'users',
    '/app/expedientes':                        'users',
    '/app/observaciones':                      'audit',
    '/app/matriculas':                         'matriculas',
    '/app/materias-cursadas':                  'materias',
    '/app/trayectorias':                       'trayectoria',
    '/app/consulta/dashboard':                 'history',
    '/app/consulta/documentos':                'docs',
    '/app/docente/dashboard':                  'panel',
    '/app/coordinador/dashboard':              'panel',
};

const i = (to, label) => ({ to, label });

const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [i('/app/superadmin/dashboard', 'Panel institucional'), i('/app/admin/usuarios-roles', 'Usuarios y roles'), i('/app/admin/catalogos', 'Catálogos'), i('/app/admin/parametros', 'Parámetros')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas', 'Documentos académicos'), i('/app/importaciones', 'Importaciones'), i('/app/importaciones/legacy-normativa', 'Validación legacy (normativa)'), i('/app/sistemas/listos-para-firma', 'Listos para firma'), i('/app/admin/reportes-basicos', 'Reportes básicos')] },
        { section: 'TÉCNICO', links: [i('/app/auditoria', 'Auditoría'), i('/app/sistemas/configuracion', 'Integraciones'), i('/app/sistemas/logs', 'Logs del sistema'), i('/app/sistemas/dashboard', 'Estado del sistema')] },
    ],
    admin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'ADMINISTRACIÓN', links: [i('/app/admin/dashboard', 'Panel institucional'), i('/app/admin/usuarios-roles', 'Usuarios y roles'), i('/app/admin/catalogos', 'Catálogos'), i('/app/admin/parametros', 'Parámetros')] },
        { section: 'OPERACIÓN', links: [i('/app/documentos/bandejas', 'Documentos académicos'), i('/app/importaciones', 'Importaciones'), i('/app/sistemas/listos-para-firma', 'Listos para firma'), i('/app/admin/reportes-basicos', 'Reportes básicos')] },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Inicio')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/expedientes', 'Expedientes'),
                i('/app/importaciones', 'Importaciones'),
                i('/app/observaciones', 'Observaciones'),
                i('/app/documentos', 'Documentos'),
            ],
        },
    ],
    director_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/documentos/bandejas/pendientes-revision', 'Pendientes'),
                i('/app/documentos/bandejas/en-revision', 'En revisión'),
                i('/app/documentos/bandejas/aprobados', 'Aprobados'),
                i('/app/documentos/bandejas/rechazados', 'Rechazados'),
                i('/app/documentos/bandejas/firmados', 'Firmados'),
            ],
        },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/documentos/bandejas/pendientes-revision', 'Pendientes'),
                i('/app/documentos/validacion', 'Validación académica'),
                i('/app/importaciones/legacy-normativa', 'Importaciones legacy pendientes'),
                i('/app/documentos/bandejas/aprobados', 'Documentos liberados'),
                i('/app/documentos/bandejas/rechazados', 'Rechazados normativamente'),
                i('/app/admin/reportes-basicos', 'Reportes'),
            ],
        },
    ],
    sistemas: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'TÉCNICO', links: [i('/app/sistemas/dashboard', 'Procesos técnicos'), i('/app/sistemas/listos-para-firma', 'Firma / SEP'), i('/app/sistemas/logs', 'Errores técnicos'), i('/app/sistemas/configuracion', 'Cadena / XML / PDF / QR')] },
    ],
    auditor: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'CONSULTA', links: [i('/app/consulta/documentos', 'Consulta documental'), i('/app/consulta/dashboard', 'Historial'), i('/app/auditoria', 'Auditoría'), i('/app/admin/reportes-basicos', 'Exportaciones')] },
    ],
    consulta: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'CONSULTA', links: [i('/app/consulta/dashboard', 'Panel consulta'), i('/app/consulta/documentos', 'Consulta de documentos'), i('/app/admin/reportes-basicos', 'Reportes lectura')] },
    ],
    docente: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'OPERACIÓN', links: [i('/app/docente/dashboard', 'Panel docente')] },
    ],
    coordinador_academico: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        { section: 'OPERACIÓN', links: [i('/app/coordinador/dashboard', 'Panel coordinación')] },
    ],
};

export function SidebarPro({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
    const role = user?.roles?.[0] ?? 'admin';
    const groups = menuByRole[role] ?? menuByRole.admin;
    const [logoutHover, setLogoutHover] = useState(false);

    return (
        <aside className={`admin-sidebar ${collapsed ? 'is-collapsed' : ''} ${open ? 'is-open' : ''}`}>
            <div className="admin-sidebar-head">
                <div>
                    <p className="admin-logo">SICES V2</p>
                    {!collapsed && <p className="admin-logo-sub">Panel institucional</p>}
                </div>
                <button
                    className="admin-icon-btn hidden md:inline-flex"
                    onClick={onToggleCollapse}
                    aria-label="Colapsar menú"
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                    }}
                >
                    {collapsed ? icons.expand : icons.collapse}
                </button>
            </div>

            <nav className="admin-menu">
                {groups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed && <p className="admin-menu-title">{group.section}</p>}
                        <div className="admin-menu-links">
                            {group.links.map((link) => {
                                const iconName = routeIconMap[link.to] ?? 'docs';
                                return (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={onClose}
                                        className={({ isActive }) => `admin-menu-link ${isActive ? 'is-active' : ''}`}
                                    >
                                        <span className="admin-menu-icon">{icons[iconName]}</span>
                                        {!collapsed && <span>{link.label}</span>}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </nav>

            <div className="admin-sidebar-actions">
                <button className="admin-menu-link" type="button" onClick={onEditProfile}>
                    <span className="admin-menu-icon">{icons.profile}</span>
                    {!collapsed && <span>Editar perfil</span>}
                </button>
                <button
                    className="admin-menu-link"
                    type="button"
                    onClick={onLogout}
                    onMouseEnter={() => setLogoutHover(true)}
                    onMouseLeave={() => setLogoutHover(false)}
                    style={{
                        color: logoutHover ? '#ff3b3b' : undefined,
                        background: logoutHover ? 'rgba(255,59,59,0.08)' : undefined,
                        transition: 'color 0.15s, background 0.15s',
                    }}
                >
                    <span className="admin-menu-icon">{icons.logout}</span>
                    {!collapsed && <span>Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}

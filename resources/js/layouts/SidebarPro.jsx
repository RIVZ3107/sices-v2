import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchMyMenus } from '../api/menus';
import { useSicesTheme } from '../theme/useSicesTheme';

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
    '/app/admin/menus':                        'panel',
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
    '/app/expedientes':                        'users',
    '/app/observaciones':                      'audit',
    '/app/importaciones/legacy-normativa':     'validate',
    '/app/alumnos/captura-guiado':             'users',
    '/app/certificacion/solicitud':            'validate',
    '/app/certificacion/dashboard':            'panel',
    '/app/certificacion/solicitudes':          'status',
    '/app/certificacion/documentos-a-certificar': 'docs',
    '/app/certificacion/generacion-documentos': 'docs',
    '/app/certificacion/firma-electronica':     'validate',
    '/app/certificacion/entrega-seguimiento':  'docs',
    '/app/certificacion/reportes':             'report',
    '/app/certificacion/configuracion':        'settings',
    '/app/certificacion/notificaciones':       'status',
    '/app/certificacion/revision':             'validate',
    '/app/sistemas/listos-para-firma':         'validate',
    '/app/admin/reportes-basicos':             'report',
    '/app/auditoria':                          'audit',
    '/app/sistemas/configuracion':             'integrations',
    '/app/sistemas/logs':                      'logs',
    '/app/sistemas/dashboard':                 'status',
    '/app/sistema/apariencia':                 'settings',
    '/app/alumnos':                            'users',
    '/app/solicitudes-matricula':              'matriculas',
    '/app/bajas-cambios':                      'audit',
    '/app/reinscripciones':                    'matriculas',
    '/app/notificaciones':                     'status',
    '/app/direccion/indicadores':             'report',
    '/app/direccion/alumnos':                  'users',
    '/app/direccion/inscripciones':            'matriculas',
    '/app/direccion/reinscripciones':          'matriculas',
    '/app/direccion/calificaciones':           'materias',
    '/app/direccion/egreso-titulacion':        'docs',
    '/app/direccion/documentos':               'docs',
    '/app/direccion/autorizaciones-observaciones': 'audit',
    '/app/direccion/reportes': 'report',
    '/app/direccion/notificaciones': 'status',
    '/app/materias-cursadas':                  'materias',
    '/app/trayectorias':                       'trayectoria',
    '/app/consulta/dashboard':                 'history',
    '/app/consulta/documentos':                'docs',
    '/app/docente/dashboard':                  'panel',
    '/app/coordinador/dashboard':             'panel',
    '/app/educacion-superior/instituciones':  'settings',
    '/app/educacion-superior/sedes':          'settings',
    '/app/educacion-superior/programas':      'panel',
    '/app/educacion-superior/planes':         'panel',
    '/app/educacion-superior/validaciones-normativas': 'validate',
    '/app/educacion-superior/certificacion':  'docs',
    '/app/educacion-superior/reportes-oficiales': 'report',
    '/app/control-escolar/alumnos': 'users',
    '/app/control-escolar/expedientes': 'docs',
    '/app/control-escolar/inscripciones': 'matriculas',
    '/app/control-escolar/reinscripciones': 'matriculas',
    '/app/control-escolar/trayectoria': 'trayectoria',
    '/app/control-escolar/calificaciones': 'materias',
    '/app/control-escolar/documentos': 'docs',
    '/app/control-escolar/bajas-cambios': 'audit',
    '/app/control-escolar/solicitudes': 'matriculas',
    '/app/control-escolar/importaciones': 'import',
    '/app/control-escolar/observaciones': 'audit',
    '/app/control-escolar/reportes': 'report',
    '/app/control-escolar/notificaciones': 'status',
};

const i = (to, label) => ({ to, label });

/** Fallback mínimo si falla la API de menús (solo emergencia). */
const menuByRole = {
    superadmin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
    ],
    admin: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
    ],
    control_escolar_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/control-escolar/alumnos', 'Alumnos'),
                i('/app/control-escolar/expedientes', 'Expedientes'),
                i('/app/control-escolar/inscripciones', 'Inscripciones'),
                i('/app/control-escolar/reinscripciones', 'Reinscripciones'),
                i('/app/control-escolar/trayectoria', 'Trayectoria académica'),
                i('/app/control-escolar/calificaciones', 'Calificaciones'),
                i('/app/control-escolar/documentos', 'Documentos'),
                i('/app/control-escolar/bajas-cambios', 'Bajas y cambios'),
                i('/app/control-escolar/solicitudes', 'Solicitudes'),
                i('/app/control-escolar/importaciones', 'Importaciones'),
                i('/app/control-escolar/observaciones', 'Observaciones'),
                i('/app/control-escolar/reportes', 'Reportes'),
                i('/app/control-escolar/notificaciones', 'Notificaciones'),
            ],
        },
    ],
    director_escuela: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        {
            section: 'SUPERVISIÓN',
            links: [
                i('/app/direccion/indicadores', 'Indicadores'),
                i('/app/direccion/alumnos', 'Alumnos'),
                i('/app/direccion/inscripciones', 'Inscripciones'),
                i('/app/direccion/reinscripciones', 'Reinscripciones'),
                i('/app/direccion/calificaciones', 'Calificaciones'),
                i('/app/direccion/egreso-titulacion', 'Egreso y titulación'),
                i('/app/direccion/reportes', 'Reportes'),
                i('/app/direccion/documentos', 'Documentos'),
                i('/app/direccion/notificaciones', 'Notificaciones'),
                i('/app/expedientes', 'Expedientes'),
                i('/app/direccion/autorizaciones-observaciones', 'Autorizaciones / Observaciones'),
            ],
        },
    ],
    educacion_superior: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
        {
            section: 'OPERACIÓN',
            links: [
                i('/app/educacion-superior/instituciones', 'Instituciones'),
                i('/app/educacion-superior/sedes', 'Sedes / Subsedes'),
                i('/app/educacion-superior/programas', 'Programas académicos'),
                i('/app/educacion-superior/planes', 'Planes de estudio'),
                i('/app/solicitudes-matricula', 'Solicitudes de matrícula'),
                i('/app/educacion-superior/validaciones-normativas', 'Validaciones normativas'),
                i('/app/educacion-superior/certificacion', 'Certificación'),
                i('/app/educacion-superior/reportes-oficiales', 'Reportes oficiales'),
                i('/app/consulta/documentos', 'Consulta pública'),
                i('/app/notificaciones', 'Notificaciones'),
            ],
        },
    ],
    sistemas: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
    ],
    auditor: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
    ],
    consulta: [
        { section: 'MAIN', links: [i('/app/dashboard', 'Dashboard')] },
    ],
    docente: [
        { section: 'MAIN', links: [i('/app/docente/dashboard', 'Panel docente')] },
    ],
    coordinador_academico: [
        { section: 'MAIN', links: [i('/app/coordinador/dashboard', 'Panel coordinación')] },
    ],
};

/**
 * Convierte árbol de GET /me/menus en grupos { section, links } para el sidebar.
 */
function menuTreeToGroups(tree) {
    const flat = [];
    const walk = (nodes) => {
        for (const n of nodes) {
            if (n.route && n.route !== '#') {
                flat.push({
                    section: n.section || 'MAIN',
                    to: n.route,
                    label: n.label,
                    icon: n.icon || 'docs',
                });
            }
            if (n.children?.length) {
                walk(n.children);
            }
        }
    };
    walk(tree);

    const order = [];
    const bySection = new Map();
    for (const item of flat) {
        if (!bySection.has(item.section)) {
            bySection.set(item.section, []);
            order.push(item.section);
        }
        bySection.get(item.section).push({ to: item.to, label: item.label, icon: item.icon });
    }

    return order.map((section) => ({ section, links: bySection.get(section) }));
}

export function SidebarPro({ user, open = false, collapsed = false, onClose, onToggleCollapse, onLogout, onEditProfile }) {
    const { theme } = useSicesTheme();
    const role = user?.roles?.[0] ?? 'admin';
    const [groups, setGroups] = useState(() => menuByRole[role] ?? menuByRole.admin);
    const [logoutHover, setLogoutHover] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetchMyMenus();
                const tree = res?.data ?? [];
                const next = menuTreeToGroups(tree);
                if (!cancelled && next.length > 0) {
                    setGroups(next);
                }
            } catch {
                if (!cancelled) {
                    setGroups(menuByRole[role] ?? menuByRole.admin);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [role]);

    const resolvedGroups = useMemo(() => groups, [groups]);

    return (
        <aside className={`admin-sidebar ${collapsed ? 'is-collapsed' : ''} ${open ? 'is-open' : ''}`}>
            <div className="admin-sidebar-head">
                <div className="min-w-0">
                    {theme?.logo_url ? (
                        <img src={theme.logo_url} alt="" className="mb-2 h-9 w-auto max-w-[180px] object-contain" />
                    ) : (
                        <p className="admin-logo">{theme?.app_name ?? 'SICES v2'}</p>
                    )}
                    {!collapsed && (
                        <p className="admin-logo-sub">
                            {role === 'control_escolar_escuela'
                                ? 'Control Escolar de Escuela'
                                : role === 'director_escuela'
                                  ? 'Dirección de Escuela'
                                  : (theme?.app_subtitle ?? 'Panel institucional')}
                        </p>
                    )}
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
                {resolvedGroups.map((group) => (
                    <section key={group.section} className="admin-menu-section">
                        {!collapsed && <p className="admin-menu-title">{group.section}</p>}
                        <div className="admin-menu-links">
                            {group.links.map((link) => {
                                const iconName = link.icon && icons[link.icon] ? link.icon : (routeIconMap[link.to] ?? 'docs');
                                return (
                                    <NavLink
                                        key={`${group.section}-${link.to}`}
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

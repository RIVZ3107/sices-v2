import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { fetchMyMenus } from '../api/menus';
import { useSicesTheme } from '../theme/useSicesTheme';

const icon = (children) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width="16"
        height="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const icons = {
    home: icon(
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    users: icon(
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </>
    ),
    settings: icon(
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </>
    ),
    docs: icon(
        <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6M9 17h4" />
        </>
    ),
    mydocs: icon(
        <>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12l2 2 4-4" />
        </>
    ),
    matriculas: icon(
        <>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" />
            <path d="M9 12h6M9 16h4" />
        </>
    ),
    materias: icon(
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
        </>
    ),
    trayectoria: icon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
    import: icon(
        <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </>
    ),
    report: icon(
        <>
            <path d="M3 3v18h18" />
            <path d="M7 15v-4m5 4V7m5 8v-2" />
        </>
    ),
    audit: icon(
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </>
    ),
    status: icon(<path d="M4 12h4l2-5 4 10 2-5h4" />),
    validate: icon(
        <>
            <path d="M9 12l2 2 4-4" />
            <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z" />
        </>
    ),
    panel: icon(
        <>
            <rect x="3" y="3" width="8" height="5" rx="1" />
            <rect x="13" y="3" width="8" height="5" rx="1" />
            <rect x="3" y="11" width="8" height="10" rx="1" />
            <rect x="13" y="11" width="8" height="10" rx="1" />
        </>
    ),
    logs: icon(
        <>
            <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
        </>
    ),
    integrations: icon(
        <>
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M6 9a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3" />
            <path d="M6 9V6" />
        </>
    ),
    history: icon(
        <>
            <path d="M12 8v4l3 3" />
            <path d="M3.05 11a9 9 0 1 1 .5 4M3 16v-5h5" />
        </>
    ),
    profile: icon(
        <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </>
    ),
    logout: icon(
        <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </>
    ),
    collapse: icon(<path d="m15 18-6-6 6-6" />),
    expand: icon(<path d="m9 18 6-6-6-6" />),
    chevron: icon(<path d="m9 18 6-6-6-6" />),
    close: icon(<path d="m18 6-12 12M6 6l12 12" />),
};

const routeIconMap = {
    '/app/dashboard': 'home',
    '/app/superadmin/dashboard': 'panel',
    '/app/admin/dashboard': 'panel',
    '/app/admin/usuarios-roles': 'users',
    '/app/admin/catalogos': 'settings',
    '/app/admin/parametros': 'settings',
    '/app/admin/menus': 'panel',
    '/app/catalogos-academicos': 'panel',
    '/app/catalogos/ciclos-periodos': 'panel',
    '/app/catalogos/subsistemas-instituciones': 'settings',
    '/app/catalogos/sedes': 'settings',
    '/app/catalogos/municipios': 'settings',
    '/app/catalogos/programas-ofertas': 'panel',

    '/app/documentos': 'docs',
    '/app/documentos/nuevo': 'docs',
    '/app/documentos/bandejas': 'docs',
    '/app/documentos/bandejas/por-rol': 'mydocs',
    '/app/documentos/bandejas/en-revision': 'status',
    '/app/documentos/bandejas/aprobados': 'validate',
    '/app/documentos/bandejas/firmados': 'validate',
    '/app/documentos/bandejas/rechazados': 'audit',
    '/app/documentos/bandejas/pendientes-revision': 'status',

    '/app/certificacion/dashboard': 'panel',
    '/app/certificacion/solicitud': 'validate',
    '/app/certificacion/solicitudes': 'status',
    '/app/certificacion/documentos-a-certificar': 'docs',
    '/app/certificacion/generacion-documentos': 'docs',
    '/app/certificacion/firma-electronica': 'validate',
    '/app/certificacion/entrega-seguimiento': 'docs',
    '/app/certificacion/reportes': 'report',
    '/app/certificacion/configuracion': 'settings',
    '/app/certificacion/notificaciones': 'status',
    '/app/certificacion/revision': 'validate',

    '/app/sistemas/proceso-tecnico-certificacion': 'validate',
    '/app/sistemas/documento-proceso-tecnico': 'validate',
    '/app/sistemas/listos-para-firma': 'validate',
    '/app/sistemas/configuracion': 'integrations',
    '/app/sistemas/logs': 'logs',
    '/app/sistemas/dashboard': 'status',

    '/app/auditoria': 'audit',
    '/app/importaciones': 'import',
    '/app/expedientes': 'users',
    '/app/observaciones': 'audit',
    '/app/importaciones/legacy-normativa': 'validate',

    '/app/alumnos': 'users',
    '/app/alumnos/captura-guiado': 'users',
    '/app/materias-cursadas': 'materias',
    '/app/trayectorias': 'trayectoria',
    '/app/solicitudes-matricula': 'matriculas',
    '/app/bajas-cambios': 'audit',
    '/app/reinscripciones': 'matriculas',
    '/app/notificaciones': 'status',

    '/app/direccion/indicadores': 'report',
    '/app/direccion/alumnos': 'users',
    '/app/direccion/inscripciones': 'matriculas',
    '/app/direccion/reinscripciones': 'matriculas',
    '/app/direccion/calificaciones': 'materias',
    '/app/direccion/egreso-titulacion': 'docs',
    '/app/direccion/documentos': 'docs',
    '/app/direccion/autorizaciones-observaciones': 'audit',
    '/app/direccion/reportes': 'report',
    '/app/direccion/notificaciones': 'status',

    '/app/consulta/dashboard': 'history',
    '/app/consulta/documentos': 'docs',
    '/app/docente/dashboard': 'panel',
    '/app/coordinador/dashboard': 'panel',

    '/app/educacion-superior/instituciones': 'settings',
    '/app/educacion-superior/sedes': 'settings',
    '/app/educacion-superior/programas': 'panel',
    '/app/educacion-superior/planes': 'panel',
    '/app/educacion-superior/validaciones-normativas': 'validate',
    '/app/educacion-superior/normales/certificacion': 'docs',
    '/app/educacion-superior/upn/certificacion': 'docs',
    '/app/educacion-superior/certificacion': 'docs',
    '/app/educacion-superior/upn-certificacion': 'docs',
    '/app/educacion-superior/reportes-oficiales': 'report',

    '/app/control-escolar/alumnos': 'users',
    '/app/control-escolar/expedientes': 'docs',
    '/app/control-escolar/inscripciones': 'matriculas',
    '/app/control-escolar/reinscripciones': 'matriculas',
    '/app/control-escolar/catalogos': 'panel',
    '/app/control-escolar/trayectoria': 'trayectoria',
    '/app/control-escolar/calificaciones': 'materias',
    '/app/control-escolar/documentos': 'docs',
    '/app/control-escolar/bajas-cambios': 'audit',
    '/app/control-escolar/solicitudes': 'matriculas',
    '/app/control-escolar/importaciones': 'import',
    '/app/control-escolar/observaciones': 'audit',
    '/app/control-escolar/reportes': 'report',
    '/app/control-escolar/notificaciones': 'status',

    '/app/sistema/apariencia': 'settings',
};

const SECTION_ORDER = [
    'MAIN',
    'INICIO',
    'ESTRUCTURA',
    'CATÁLOGOS ACADÉMICOS',
    'CATALOGOS ACADEMICOS',
    'CERTIFICACIÓN',
    'CERTIFICACION',
    'CONTROL ESCOLAR',
    'OPERACIÓN',
    'OPERACION',
    'SUPERVISIÓN',
    'SUPERVISION',
    'ADMIN',
    'REPORTES',
    'CONSULTA',
    'SISTEMA',
    'TECNICO',
];

const SECTION_LABELS = {
    MAIN: 'Inicio',
    INICIO: 'Inicio',
    ESTRUCTURA: 'Estructura académica',
    'CATÁLOGOS ACADÉMICOS': 'Catálogos académicos',
    'CATALOGOS ACADEMICOS': 'Catálogos académicos',
    CERTIFICACIÓN: 'Certificación',
    CERTIFICACION: 'Certificación',
    'CONTROL ESCOLAR': 'Control Escolar',
    OPERACIÓN: 'Operación',
    OPERACION: 'Operación',
    SUPERVISIÓN: 'Supervisión',
    SUPERVISION: 'Supervisión',
    ADMIN: 'Administración',
    REPORTES: 'Reportes',
    CONSULTA: 'Consulta',
    SISTEMA: 'Sistema',
    TECNICO: 'Técnico',
};

const ROLE_LABELS = {
    superadmin: 'Superadministración',
    admin: 'Administración',
    sistemas: 'Sistemas / Técnico',
    educacion_superior: 'Educación Superior',
    control_escolar_escuela: 'Control Escolar',
    director_escuela: 'Dirección Escolar',
    certificador: 'Certificador',
    responsable_certificacion_titulacion: 'Certificación',
    auditor: 'Auditoría',
    consulta: 'Consulta pública',
    docente: 'Docente',
    coordinador_academico: 'Coordinación académica',
};

const fallbackMenuTreeByRole = {
    superadmin: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'ESTRUCTURA',
            label: 'Estructura académica',
            icon: 'panel',
            order: 2,
            children: [
                { label: 'Catálogos académicos', route: '/app/catalogos-academicos', icon: 'panel', order: 0 },
                { label: 'Subsistemas / Instituciones', route: '/app/catalogos/subsistemas-instituciones', icon: 'settings', order: 1 },
                { label: 'Sedes y subsedes', route: '/app/catalogos/sedes', icon: 'settings', order: 2 },
                { label: 'Ciclos y periodos', route: '/app/catalogos/ciclos-periodos', icon: 'panel', order: 3 },
                { label: 'Municipios', route: '/app/catalogos/municipios', icon: 'settings', order: 4 },
                { label: 'Programas y ofertas', route: '/app/catalogos/programas-ofertas', icon: 'panel', order: 5 },
            ],
        },
        {
            section: 'CONTROL ESCOLAR',
            label: 'Control escolar',
            icon: 'matriculas',
            order: 3,
            children: [
                { label: 'Configuración académica', route: '/app/control-escolar/catalogos', icon: 'settings', order: 8 },
            ],
        },
        {
            section: 'SISTEMA',
            label: 'Sistema',
            icon: 'settings',
            order: 4,
            children: [
                { label: 'Usuarios', route: '/app/admin/usuarios-roles', icon: 'users', order: 1 },
                { label: 'Roles y permisos', route: '/app/admin/usuarios-roles', icon: 'users', order: 2 },
                { label: 'Menús del sistema', route: '/app/admin/menus', icon: 'panel', order: 3 },
                { label: 'Configuración', route: '/app/admin/parametros', icon: 'settings', order: 4 },
                { label: 'Catálogos técnicos', route: '/app/admin/catalogos', icon: 'settings', order: 5 },
                { label: 'Auditoría', route: '/app/auditoria', icon: 'audit', order: 6 },
            ],
        },
    ],

    admin: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'ESTRUCTURA',
            label: 'Estructura académica',
            icon: 'panel',
            order: 2,
            children: [
                { label: 'Catálogos académicos', route: '/app/catalogos-academicos', icon: 'panel', order: 0 },
                { label: 'Subsistemas / Instituciones', route: '/app/catalogos/subsistemas-instituciones', icon: 'settings', order: 1 },
                { label: 'Sedes y subsedes', route: '/app/catalogos/sedes', icon: 'settings', order: 2 },
                { label: 'Ciclos y periodos', route: '/app/catalogos/ciclos-periodos', icon: 'panel', order: 3 },
                { label: 'Municipios', route: '/app/catalogos/municipios', icon: 'settings', order: 4 },
                { label: 'Programas y ofertas', route: '/app/catalogos/programas-ofertas', icon: 'panel', order: 5 },
            ],
        },
        {
            section: 'CONTROL ESCOLAR',
            label: 'Control escolar',
            icon: 'matriculas',
            order: 3,
            children: [
                { label: 'Configuración académica', route: '/app/control-escolar/catalogos', icon: 'settings', order: 8 },
            ],
        },
        {
            section: 'SISTEMA',
            label: 'Sistema',
            icon: 'settings',
            order: 4,
            children: [
                { label: 'Usuarios', route: '/app/admin/usuarios-roles', icon: 'users', order: 1 },
                { label: 'Roles y permisos', route: '/app/admin/usuarios-roles', icon: 'users', order: 2 },
                { label: 'Menús del sistema', route: '/app/admin/menus', icon: 'panel', order: 3 },
                { label: 'Configuración', route: '/app/admin/parametros', icon: 'settings', order: 4 },
            ],
        },
    ],

    educacion_superior: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'CERTIFICACIÓN',
            label: 'Certificación institucional',
            icon: 'docs',
            order: 2,
            children: [
                {
                    label: 'Certificación Normales',
                    route: '/app/educacion-superior/normales/certificacion',
                    icon: 'docs',
                    order: 1,
                },
                {
                    label: 'Certificación UPN',
                    route: '/app/educacion-superior/upn/certificacion',
                    icon: 'docs',
                    order: 2,
                },
                {
                    label: 'Reportes oficiales',
                    route: '/app/educacion-superior/reportes-oficiales',
                    icon: 'report',
                    order: 3,
                },
            ],
        },
        {
            section: 'CATÁLOGOS ACADÉMICOS',
            label: 'Estructura académica',
            icon: 'panel',
            order: 3,
            children: [
                { label: 'Instituciones', route: '/app/educacion-superior/instituciones', icon: 'settings', order: 1 },
                { label: 'Sedes / Subsedes', route: '/app/educacion-superior/sedes', icon: 'settings', order: 2 },
                { label: 'Programas académicos', route: '/app/educacion-superior/programas', icon: 'panel', order: 3 },
                { label: 'Planes de estudio', route: '/app/educacion-superior/planes', icon: 'panel', order: 4 },
            ],
        },
    ],

    control_escolar_escuela: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'CONTROL ESCOLAR',
            label: 'Control escolar',
            icon: 'matriculas',
            order: 2,
            children: [
                { label: 'Alumnos', route: '/app/control-escolar/alumnos', icon: 'users', order: 1 },
                { label: 'Expedientes', route: '/app/control-escolar/expedientes', icon: 'docs', order: 2 },
                { label: 'Inscripciones', route: '/app/control-escolar/inscripciones', icon: 'matriculas', order: 3 },
                { label: 'Reinscripciones', route: '/app/control-escolar/reinscripciones', icon: 'matriculas', order: 4 },
                { label: 'Trayectoria', route: '/app/control-escolar/trayectoria', icon: 'trayectoria', order: 5 },
                { label: 'Calificaciones', route: '/app/control-escolar/calificaciones', icon: 'materias', order: 6 },
                { label: 'Documentos', route: '/app/control-escolar/documentos', icon: 'docs', order: 7 },
                { label: 'Configuración académica', route: '/app/control-escolar/catalogos', icon: 'settings', order: 8 },
            ],
        },
    ],

    director_escuela: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'SUPERVISIÓN',
            label: 'Dirección escolar',
            icon: 'report',
            order: 2,
            children: [
                { label: 'Indicadores', route: '/app/direccion/indicadores', icon: 'report', order: 1 },
                { label: 'Alumnos', route: '/app/direccion/alumnos', icon: 'users', order: 2 },
                { label: 'Inscripciones', route: '/app/direccion/inscripciones', icon: 'matriculas', order: 3 },
                { label: 'Calificaciones', route: '/app/direccion/calificaciones', icon: 'materias', order: 4 },
                { label: 'Egreso y titulación', route: '/app/direccion/egreso-titulacion', icon: 'docs', order: 5 },
                { label: 'Documentos', route: '/app/direccion/documentos', icon: 'docs', order: 6 },
                { label: 'Reportes', route: '/app/direccion/reportes', icon: 'report', order: 7 },
            ],
        },
    ],

    sistemas: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'ESTRUCTURA',
            label: 'Estructura académica',
            icon: 'panel',
            order: 2,
            children: [
                { label: 'Catálogos académicos', route: '/app/catalogos-academicos', icon: 'panel', order: 0 },
                { label: 'Subsistemas / Instituciones', route: '/app/catalogos/subsistemas-instituciones', icon: 'settings', order: 1 },
                { label: 'Sedes y subsedes', route: '/app/catalogos/sedes', icon: 'settings', order: 2 },
                { label: 'Ciclos y periodos', route: '/app/catalogos/ciclos-periodos', icon: 'panel', order: 3 },
                { label: 'Municipios', route: '/app/catalogos/municipios', icon: 'settings', order: 4 },
                { label: 'Programas y ofertas', route: '/app/catalogos/programas-ofertas', icon: 'panel', order: 5 },
            ],
        },
        {
            section: 'CONTROL ESCOLAR',
            label: 'Control escolar',
            icon: 'matriculas',
            order: 3,
            children: [
                { label: 'Configuración académica', route: '/app/control-escolar/catalogos', icon: 'settings', order: 1 },
            ],
        },
        {
            section: 'SISTEMA',
            label: 'Sistema',
            icon: 'settings',
            order: 4,
            children: [
                { label: 'Usuarios', route: '/app/admin/usuarios-roles', icon: 'users', order: 1 },
                { label: 'Roles y permisos', route: '/app/admin/usuarios-roles', icon: 'users', order: 2 },
                { label: 'Menús del sistema', route: '/app/admin/menus', icon: 'panel', order: 3 },
                { label: 'Configuración', route: '/app/admin/parametros', icon: 'settings', order: 4 },
                { label: 'Catálogos técnicos', route: '/app/admin/catalogos', icon: 'settings', order: 5 },
            ],
        },
        {
            section: 'TECNICO',
            label: 'Proceso técnico',
            icon: 'validate',
            order: 5,
            children: [
                {
                    label: 'Proceso técnico de certificación',
                    route: '/app/sistemas/proceso-tecnico-certificacion',
                    icon: 'validate',
                    badge_key: 'incidencias_firma',
                    order: 1,
                },
                { label: 'Configuración documental', route: '/app/admin/parametros', icon: 'settings', order: 2 },
                { label: 'Integraciones', route: '/app/sistemas/configuracion', icon: 'integrations', order: 3 },
                { label: 'Logs técnicos', route: '/app/sistemas/logs', icon: 'logs', order: 4 },
            ],
        },
    ],

    responsable_certificacion_titulacion: [
        {
            section: 'MAIN',
            label: 'Inicio',
            route: '/app/certificacion/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'CERTIFICACIÓN',
            label: 'Certificación',
            icon: 'docs',
            order: 2,
            children: [
                { label: 'Bandejas', route: '/app/documentos/bandejas/por-rol', icon: 'docs', order: 1 },
                { label: 'Documentos académicos', route: '/app/certificacion/documentos-a-certificar', icon: 'docs', order: 2 },
                { label: 'Folios y emisión', route: '/app/certificacion/generacion-documentos', icon: 'docs', order: 3 },
                { label: 'Firma y proceso documental', route: '/app/certificacion/firma-electronica', icon: 'validate', order: 4 },
                { label: 'Historial', route: '/app/certificacion/entrega-seguimiento', icon: 'history', order: 5 },
            ],
        },
    ],

    auditor: [
        {
            section: 'MAIN',
            label: 'Dashboard',
            route: '/app/dashboard',
            icon: 'home',
            order: 1,
        },
        {
            section: 'REPORTES',
            label: 'Auditoría',
            icon: 'audit',
            order: 2,
            children: [
                { label: 'Auditoría', route: '/app/auditoria', icon: 'audit', order: 1 },
                { label: 'Consulta documentos', route: '/app/consulta/documentos', icon: 'docs', order: 2 },
            ],
        },
    ],

    consulta: [
        {
            section: 'MAIN',
            label: 'Consulta pública',
            route: '/app/consulta/documentos',
            icon: 'history',
            order: 1,
        },
    ],

    docente: [
        {
            section: 'MAIN',
            label: 'Panel docente',
            route: '/app/docente/dashboard',
            icon: 'panel',
            order: 1,
        },
    ],

    coordinador_academico: [
        {
            section: 'MAIN',
            label: 'Panel coordinación',
            route: '/app/coordinador/dashboard',
            icon: 'panel',
            order: 1,
        },
    ],
};

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

function normalizeRole(role) {
    if (!role) return null;
    if (typeof role === 'string') return role;
    return role.name ?? role.slug ?? role.key ?? null;
}

function getPrimaryRole(user) {
    const roles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole).filter(Boolean) : [];

    return roles[0] ?? normalizeRole(user?.role) ?? normalizeRole(user?.rol) ?? 'admin';
}

function isVisible(value) {
    return ![false, 0, '0', 'false', 'no', 'NO', 'inactivo', 'INACTIVO'].includes(value);
}

function hasValidRoute(route) {
    return Boolean(route && route !== '#' && route !== 'javascript:void(0)');
}

function getSectionName(node, parentSection = 'MAIN') {
    const raw = node.section ?? node.modulo ?? node.module ?? node.group ?? parentSection ?? 'MAIN';

    return String(raw).trim().toUpperCase();
}

function getNodeRoute(node) {
    return node.route ?? node.ruta ?? node.to ?? node.path ?? '#';
}

function getNodeLabel(node) {
    return node.label ?? node.nombre ?? node.name ?? node.title ?? 'Sin nombre';
}

function getNodeOrder(node) {
    const value = node.order ?? node.orden ?? node.sort ?? node.position ?? 0;

    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getNodeIcon(node, route) {
    const rawIcon = node.icon ?? node.icono ?? routeIconMap[route] ?? 'docs';

    return icons[rawIcon] ? rawIcon : 'docs';
}

function sortMenuNodes(nodes) {
    return [...nodes].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return String(a.label).localeCompare(String(b.label), 'es');
    });
}

function sortSections(a, b) {
    const aIndex = SECTION_ORDER.indexOf(a);
    const bIndex = SECTION_ORDER.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, 'es');
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
}

function normalizeMenuNode(node, parentSection = 'MAIN') {
    if (!node) return null;

    if (!isVisible(node.visible) || !isVisible(node.activo) || !isVisible(node.active)) {
        return null;
    }

    const route = getNodeRoute(node);
    const section = getSectionName(node, parentSection);

    const children = Array.isArray(node.children)
        ? node.children.map((child) => normalizeMenuNode(child, section)).filter(Boolean)
        : [];

    if (!hasValidRoute(route) && children.length === 0) {
        return null;
    }

    const id = String(node.id ?? node.slug ?? node.key ?? route ?? getNodeLabel(node));

    return {
        id,
        label: getNodeLabel(node),
        to: hasValidRoute(route) ? route : null,
        section,
        order: getNodeOrder(node),
        icon: getNodeIcon(node, route),
        badgeKey: node.badge_key ?? node.badgeKey ?? null,
        children: sortMenuNodes(children),
    };
}

function menuTreeToSections(tree) {
    const source = Array.isArray(tree) ? tree : [];
    const normalizedNodes = source.map((node) => normalizeMenuNode(node)).filter(Boolean);
    const bySection = new Map();

    normalizedNodes.forEach((node) => {
        const section = node.section || 'MAIN';

        if (!bySection.has(section)) {
            bySection.set(section, []);
        }

        bySection.get(section).push(node);
    });

    return [...bySection.entries()]
        .sort(([sectionA], [sectionB]) => sortSections(sectionA, sectionB))
        .map(([section, links]) => ({
            section,
            label: SECTION_LABELS[section] ?? section,
            links: sortMenuNodes(links),
        }));
}

function buildFallbackSections(role) {
    const tree = fallbackMenuTreeByRole[role] ?? fallbackMenuTreeByRole.admin;

    return menuTreeToSections(tree);
}

function isRouteActive(pathname, route) {
    if (!route) return false;

    return pathname === route || pathname.startsWith(`${route}/`);
}

function isNodeActive(node, pathname) {
    return isRouteActive(pathname, node.to) || node.children?.some((child) => isNodeActive(child, pathname));
}

function collectOpenParents(sections, pathname) {
    const openMap = {};

    const walk = (node) => {
        const hasActiveChild = node.children?.some((child) => isNodeActive(child, pathname));

        if (hasActiveChild) {
            openMap[node.id] = true;
        }

        node.children?.forEach(walk);
    };

    sections.forEach((section) => {
        section.links.forEach(walk);
    });

    return openMap;
}

function extractMenuPayload(response) {
    return response?.data?.data ?? response?.data ?? response ?? [];
}

function SidebarMenuNode({
    node,
    collapsed,
    pathname,
    openNodes,
    onToggleNode,
    onNavigate,
    badges,
    depth = 0,
}) {
    const hasChildren = node.children.length > 0;
    const active = isNodeActive(node, pathname);
    const open = Boolean(openNodes[node.id]);
    const badgeValue = node.badgeKey ? badges?.[node.badgeKey] : null;
    const showBadge = Number(badgeValue) > 0;

    if (hasChildren) {
        return (
            <div className={classNames('admin-menu-node', active && 'is-active-parent')}>
                <button
                    type="button"
                    className={classNames(
                        'admin-menu-link',
                        'admin-menu-parent',
                        active && 'is-active',
                        collapsed && 'is-icon-only'
                    )}
                    onClick={() => onToggleNode(node.id)}
                    title={collapsed ? node.label : undefined}
                    aria-expanded={open}
                >
                    <span className="admin-menu-icon">{icons[node.icon] ?? icons.docs}</span>

                    {!collapsed && (
                        <>
                            <span className="admin-menu-label">{node.label}</span>

                            {showBadge && (
                                <span className="admin-menu-badge">
                                    {Number(badgeValue) > 99 ? '99+' : badgeValue}
                                </span>
                            )}

                            <span className={classNames('admin-menu-caret', open && 'is-open')}>
                                {icons.chevron}
                            </span>
                        </>
                    )}
                </button>

                {!collapsed && open && (
                    <div className="admin-submenu" style={{ '--depth': depth + 1 }}>
                        {node.children.map((child) => (
                            <SidebarMenuNode
                                key={`${node.id}-${child.id}`}
                                node={child}
                                collapsed={collapsed}
                                pathname={pathname}
                                openNodes={openNodes}
                                onToggleNode={onToggleNode}
                                onNavigate={onNavigate}
                                badges={badges}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={node.to}
            onClick={() => onNavigate?.()}
            title={collapsed ? node.label : undefined}
            className={({ isActive }) =>
                classNames(
                    'admin-menu-link',
                    (isActive || isRouteActive(pathname, node.to)) && 'is-active',
                    collapsed && 'is-icon-only'
                )
            }
        >
            <span className="admin-menu-icon">{icons[node.icon] ?? icons.docs}</span>

            {!collapsed && (
                <>
                    <span className="admin-menu-label">{node.label}</span>

                    {showBadge && (
                        <span className="admin-menu-badge">
                            {Number(badgeValue) > 99 ? '99+' : badgeValue}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}

export function SidebarPro({
    user,
    open = false,
    collapsed = false,
    badges = {},
    onClose,
    onToggleCollapse,
    onLogout,
    onEditProfile,
}) {
    const { theme } = useSicesTheme();
    const location = useLocation();
    const role = getPrimaryRole(user);

    const [sections, setSections] = useState(() => buildFallbackSections(role));
    const [openNodes, setOpenNodes] = useState({});
    const [menuStatus, setMenuStatus] = useState('idle');

    useEffect(() => {
        let cancelled = false;

        async function loadMenus() {
            setMenuStatus('loading');

            try {
                const response = await fetchMyMenus();
                const payload = extractMenuPayload(response);
                const nextSections = menuTreeToSections(payload);

                if (cancelled) return;

                if (nextSections.length > 0) {
                    setSections(nextSections);
                    setMenuStatus('ready');
                    return;
                }

                setSections(buildFallbackSections(role));
                setMenuStatus('fallback');
            } catch {
                if (!cancelled) {
                    setSections(buildFallbackSections(role));
                    setMenuStatus('fallback');
                }
            }
        }

        loadMenus();

        return () => {
            cancelled = true;
        };
    }, [role]);

    useEffect(() => {
        const activeParents = collectOpenParents(sections, location.pathname);

        if (Object.keys(activeParents).length > 0) {
            setOpenNodes((current) => ({
                ...current,
                ...activeParents,
            }));
        }
    }, [sections, location.pathname]);

    const appName = theme?.app_name ?? 'SICES v2';
    const logoUrl = theme?.logo_url;
    const subtitle = ROLE_LABELS[role] ?? theme?.app_subtitle ?? 'Panel institucional';

    const resolvedSections = useMemo(() => sections, [sections]);

    const handleToggleNode = (id) => {
        setOpenNodes((current) => ({
            ...current,
            [id]: !current[id],
        }));
    };

    return (
        <>
            {open && <button type="button" className="admin-sidebar-backdrop" onClick={onClose} aria-label="Cerrar menú" />}

            <aside className={classNames('admin-sidebar', collapsed && 'is-collapsed', open && 'is-open')}>
                <div className="admin-sidebar-head">
                    <div className="admin-brand">
                        {logoUrl ? (
                            <img src={logoUrl} alt={appName} className="admin-brand-logo" />
                        ) : (
                            <div className="admin-brand-mark">S</div>
                        )}

                        {!collapsed && (
                            <div className="admin-brand-text">
                                <p className="admin-logo">{appName}</p>
                                <p className="admin-logo-sub">{subtitle}</p>
                            </div>
                        )}
                    </div>

                    <div className="admin-sidebar-head-actions">
                        <button
                            className="admin-icon-btn admin-collapse-btn"
                            type="button"
                            onClick={onToggleCollapse}
                            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                        >
                            {collapsed ? icons.expand : icons.collapse}
                        </button>

                        <button
                            className="admin-icon-btn admin-close-btn"
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar menú"
                        >
                            {icons.close}
                        </button>
                    </div>
                </div>

                {!collapsed && menuStatus === 'fallback' && (
                    <div className="admin-menu-alert">
                        Menú temporal cargado.
                    </div>
                )}

                <nav className="admin-menu" aria-label="Menú principal">
                    {resolvedSections.map((section) => (
                        <section key={section.section} className="admin-menu-section">
                            {!collapsed && <p className="admin-menu-title">{section.label}</p>}

                            <div className="admin-menu-links">
                                {section.links.map((node) => (
                                    <SidebarMenuNode
                                        key={`${section.section}-${node.id}`}
                                        node={node}
                                        collapsed={collapsed}
                                        pathname={location.pathname}
                                        openNodes={openNodes}
                                        onToggleNode={handleToggleNode}
                                        onNavigate={onClose}
                                        badges={badges}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </nav>

                <div className="admin-sidebar-actions">
                    <button className="admin-menu-link" type="button" onClick={onEditProfile}>
                        <span className="admin-menu-icon">{icons.profile}</span>
                        {!collapsed && <span className="admin-menu-label">Editar perfil</span>}
                    </button>

                    <button className="admin-menu-link is-danger" type="button" onClick={onLogout}>
                        <span className="admin-menu-icon">{icons.logout}</span>
                        {!collapsed && <span className="admin-menu-label">Cerrar sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default SidebarPro;
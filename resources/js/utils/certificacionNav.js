import { CERT_PERM } from './certificacionPermissions';

/** Ítems del menú lateral Certificación — visibilidad por permissions[]. */
export const CERT_NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', to: '/app/certificacion/dashboard', icon: 'dashboard', permissions: CERT_PERM.dashboard },
    { key: 'solicitudes', label: 'Solicitudes', to: '/app/certificacion/solicitudes', icon: 'inbox', permissions: CERT_PERM.solicitudes },
    {
        key: 'documentos',
        label: 'Documentos a certificar',
        to: '/app/certificacion/documentos-a-certificar',
        icon: 'docs',
        permissions: CERT_PERM.documentosACertificar,
    },
    {
        key: 'generacion',
        label: 'Generación de documentos',
        to: '/app/certificacion/generacion-documentos',
        icon: 'file',
        permissions: CERT_PERM.generacion,
    },
    {
        key: 'revision',
        label: 'Revisión institucional',
        to: '/app/certificacion/revision',
        icon: 'validate',
        permissions: CERT_PERM.revision,
    },
    {
        key: 'firma',
        label: 'Firma electrónica',
        to: '/app/certificacion/firma-electronica',
        icon: 'signature',
        permissions: CERT_PERM.firmaElectronica,
    },
    {
        key: 'entrega',
        label: 'Entrega y seguimiento',
        to: '/app/certificacion/entrega-seguimiento',
        icon: 'truck',
        permissions: CERT_PERM.entrega,
    },
    { key: 'reportes', label: 'Reportes', to: '/app/certificacion/reportes', icon: 'chart', permissions: CERT_PERM.reportes },
    {
        key: 'configuracion',
        label: 'Configuración',
        to: '/app/certificacion/configuracion',
        icon: 'settings',
        permissions: CERT_PERM.configuracion,
    },
    {
        key: 'notificaciones',
        label: 'Notificaciones',
        to: '/app/certificacion/notificaciones',
        icon: 'bell',
        permissions: CERT_PERM.notificaciones,
    },
];

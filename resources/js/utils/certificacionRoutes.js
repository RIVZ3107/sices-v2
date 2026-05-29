import { getUser } from '../authStore';

/** Rutas canónicas — Escuelas Normales */
export const NORMALES_CERTIFICACION_PATH = '/app/educacion-superior/normales/certificacion';
export const NORMALES_TITULOS_PATH = '/app/educacion-superior/normales/titulos';
export const NORMALES_GRADOS_PATH = '/app/educacion-superior/normales/grados-academicos';
export const NORMALES_CONSTANCIAS_PATH = '/app/educacion-superior/normales/constancias';

/** Rutas canónicas — UPN */
export const UPN_CERTIFICACION_PATH = '/app/educacion-superior/upn/certificacion';
export const UPN_TITULOS_PATH = '/app/educacion-superior/upn/titulos';
export const UPN_GRADOS_PATH = '/app/educacion-superior/upn/grados-academicos';
export const UPN_CONSTANCIAS_PATH = '/app/educacion-superior/upn/constancias';

/** Legacy (redirección) — no usar en menús nuevos */
export const ES_CERTIFICACION_LEGACY_PATH = '/app/educacion-superior/certificacion';
export const UPN_CERTIFICACION_LEGACY_PATH = '/app/educacion-superior/upn-certificacion';

/** @deprecated Usar NORMALES_CERTIFICACION_PATH */
export const ES_CERTIFICACION_PATH = ES_CERTIFICACION_LEGACY_PATH;

export const CERTIFICACION_BASE = '/app/certificacion';
export const CERTIFICACION_DASHBOARD_PATH = '/app/certificacion/dashboard';
export const PROCESO_TECNICO_BANDEJA_PATH = '/app/sistemas/proceso-tecnico-certificacion';
export const DOCUMENTO_PROCESO_TECNICO_PATH = '/app/sistemas/documento-proceso-tecnico';

export function normalesCertificacionDetallePath(documentoId) {
    return `${NORMALES_CERTIFICACION_PATH}/${documentoId}`;
}

export function upnCertificacionDetallePath(documentoId) {
    return `${UPN_CERTIFICACION_PATH}/${documentoId}`;
}

export function documentoProcesoTecnicoDetallePath(documentoId) {
    return `${DOCUMENTO_PROCESO_TECNICO_PATH}/${documentoId}`;
}

/** Base de revisión institucional según rol (evita mezclar layout RC con ES). */
export function revisionInstitucionalBasePath() {
    const roles = getUser()?.roles ?? [];
    if (roles.includes('responsable_certificacion_titulacion')) {
        return '/app/certificacion/revision';
    }
    if (roles.includes('educacion_superior')) {
        return '/app/educacion-superior/revision';
    }
    return '/app/certificacion/revision';
}

export function revisionInstitucionalDetallePath(documentoId) {
    return `${revisionInstitucionalBasePath()}/${documentoId}`;
}

/** Educación Superior no debe usar el layout visual de Responsable Certificación. */
export function debeUsarLayoutCertificacionRc() {
    const roles = getUser()?.roles ?? [];
    if (roles.includes('superadmin') || roles.includes('admin')) {
        return true;
    }
    return roles.includes('responsable_certificacion_titulacion');
}

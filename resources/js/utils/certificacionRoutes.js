import { getUser } from '../authStore';

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

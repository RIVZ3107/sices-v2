import { userCanAny } from './userPermissions';
import { ES_CERT_FUNCIONAL } from './esCertificacionPermissions';
import { CERT_PERM } from './certificacionPermissions';

/** Permisos que indican acceso a diagnóstico técnico (Sistemas / superadmin técnico). */
export const UX_PERM_TECNICO = [
    'generar_cadena',
    'cadena_original.generar',
    'generar_xml',
    'xml.generar',
    'xml.validar',
    'firma.ejecutar',
    'firma.preflight',
    'logs.ver',
    'integraciones.ver',
    'sistemas.integraciones.ver',
    'menus.administrar',
    'catalogos.configurar',
    'configuracion.configurar',
];

export const UX_PERM_CONTROL_ESCOLAR = [
    'documentos.crear_borrador',
    'crear_documentos',
    'documentos.crear',
];

export const UX_PERM_CERTIFICADOR = [
    'certificacion.validar',
    'documentos.observar',
    'observaciones.crear',
    'validaciones_normativas.ver',
];

export const UX_COPY = {
    controlEscolar:
        'Control Escolar solo inicia solicitudes documentales con tipos autorizados. El folio, procesamiento, firma y resultado final corresponden a etapas posteriores.',
    certificador:
        'El Certificador revisa que la información académica sea correcta antes de continuar el proceso institucional.',
    educacionSuperior:
        'Educación Superior aprueba, procesa y obtiene el resultado final del documento académico.',
    sistemas:
        'Sistemas atiende incidencias técnicas, diagnóstico, integraciones y reintentos cuando el procesamiento falla.',
};

export function uxCanVerDetalleTecnico() {
    return userCanAny(UX_PERM_TECNICO);
}

export function uxEsControlEscolarOperativo() {
    return (
        userCanAny(UX_PERM_CONTROL_ESCOLAR)
        && !userCanAny(ES_CERT_FUNCIONAL.procesar)
        && !userCanAny(UX_PERM_TECNICO)
    );
}

export function uxEsCertificadorOperativo() {
    return userCanAny(UX_PERM_CERTIFICADOR) && !userCanAny(ES_CERT_FUNCIONAL.procesar);
}

export function uxEsEducacionSuperiorOperativo() {
    return userCanAny([
        ...ES_CERT_FUNCIONAL.procesar,
        ...ES_CERT_FUNCIONAL.firmar,
        'documentos.aprobar_institucionalmente',
        'certificacion.autorizar_emision',
    ]);
}

export function uxEsSistemasTecnico() {
    return userCanAny([...CERT_PERM.procesoTecnico, 'logs.ver', 'integraciones.ver']);
}

/** Texto de banner según permisos del usuario actual. */
export function uxBannerCopyForCurrentUser() {
    if (uxEsSistemasTecnico() && !uxEsEducacionSuperiorOperativo()) {
        return UX_COPY.sistemas;
    }
    if (uxEsEducacionSuperiorOperativo()) {
        return UX_COPY.educacionSuperior;
    }
    if (uxEsCertificadorOperativo() && !uxEsEducacionSuperiorOperativo()) {
        return UX_COPY.certificador;
    }
    if (uxEsControlEscolarOperativo()) {
        return UX_COPY.controlEscolar;
    }
    return UX_COPY.educacionSuperior;
}

export function uxPuedeProcesarCertificacion() {
    return userCanAny(ES_CERT_FUNCIONAL.procesar);
}

export function uxPuedeFirmarCertificacion() {
    return userCanAny(ES_CERT_FUNCIONAL.firmar);
}

export function uxPuedeAsignarFolioOficial() {
    return userCanAny(['folios.asignar', 'preparar_documento_firma']);
}

export function uxPuedeEmitirConsultaPublica() {
    return userCanAny(['consulta_publica.emitir_token', 'consulta_publica.configurar']);
}

export function uxLinkIncidenciaTecnica(documentoId) {
    return `/app/sistemas/documento-proceso-tecnico/${documentoId}`;
}

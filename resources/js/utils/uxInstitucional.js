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

/** Mensaje estándar cuando el usuario no tiene permiso para un módulo. */
export const MSG_ACCESO_DENEGADO = 'No tienes permisos para acceder a este módulo.';

export const MSG_CARGA_TABLERO =
    'No fue posible cargar la información del tablero. Intente actualizar la página o contacte al administrador del sistema.';

/** Empty states institucionales por rol (título + descripción). */
export const EMPTY_BY_ROLE = {
    control_escolar: {
        title: 'Todavía no hay alumnos o solicitudes en tu alcance.',
        description:
            'Cuando registres o recibas información académica de tu institución, aparecerá aquí para iniciar trámites.',
    },
    control_escolar_alumnos: {
        title: 'Todavía no hay alumnos registrados en tu alcance.',
        description:
            'Cuando existan alumnos asignados a tu institución, aparecerán aquí para iniciar trámites académicos.',
    },
    certificador: {
        title: 'No hay documentos pendientes de validación.',
        description: 'Cuando Control Escolar envíe solicitudes documentales, aparecerán aquí.',
    },
    educacion_superior: {
        title: 'No hay documentos listos para operación institucional.',
        description: 'Cuando el Certificador valide expedientes, aparecerán aquí.',
    },
    sistemas: {
        title: 'No hay incidencias técnicas abiertas.',
        description:
            'Cuando ocurra un error técnico durante el procesamiento, aparecerá aquí para diagnóstico.',
    },
    generico: {
        title: 'Sin registros en este momento.',
        description: 'No hay información para mostrar con los criterios actuales.',
    },
};

const TECHNICAL_PATTERNS = [
    /php\s+artisan/i,
    /db:seed/i,
    /seeder/i,
    /demoseeder/i,
    /@sices\.local/i,
    /laragon/i,
    /localhost/i,
    /stack\s*trace/i,
    /runtimeexception/i,
    /\.php\b/i,
    /namespace\s+/i,
    /hey\s+developer/i,
    /execute\s+seed/i,
    /entorno\s+local/i,
    /datos\s+demo/i,
];

/**
 * Oculta mensajes técnicos o de desarrollo; devuelve texto apto para UI institucional.
 * @param {unknown} raw
 * @param {string} [fallback]
 */
export function sanitizeInstitutionalMessage(raw, fallback = MSG_CARGA_TABLERO) {
    const text = String(raw ?? '').trim();
    if (!text) {
        return fallback;
    }
    if (TECHNICAL_PATTERNS.some((re) => re.test(text))) {
        return fallback;
    }
    if (text.length > 280) {
        return fallback;
    }
    return text;
}

/** Título del gráfico de distribución de alumnos (sin referencias a demo). */
export function institutionalDistribucionTitulo(tipo) {
    if (tipo === 'escenario_demo' || tipo === 'situacion_academica') {
        return 'Expedientes por situación académica';
    }
    return 'Alumnos por estatus';
}

/** Acciones rápidas sugeridas cuando el tablero CE está vacío. */
export const CE_DASHBOARD_EMPTY_ACTIONS = [
    { to: '/app/alumnos/crear', label: 'Registrar alumno' },
    { to: '/app/control-escolar/expedientes', label: 'Consultar expedientes' },
    { to: '/app/control-escolar/alumnos', label: 'Actualizar información' },
];

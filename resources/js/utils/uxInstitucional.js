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
    /legacy_controlado/i,
    /importación histórica legacy/i,
    /importacion historica legacy/i,
];

/** Patrones de etiquetas demo/sintéticas en datos locales (solo presentación). */
const DEMO_LABEL_PATTERNS = [
    /\bdemosynthetic\b/i,
    /\bdemo\s+synthetic\b/i,
    /\bciclo\s+demo\b/i,
    /\bplan\s+demo\b/i,
    /\bprograma\s+demo\b/i,
    /\bnormal\s+case\d+/i,
    /\btest\s+case\b/i,
    /\bprueba\s+institucional\b/i,
];

const LEGACY_OPERATIVE_PATTERNS = [
    /importación histórica legacy/i,
    /importacion historica legacy/i,
    /\blegacy\b/i,
    /legacy_controlado/i,
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
    if (LEGACY_OPERATIVE_PATTERNS.some((re) => re.test(text))) {
        return fallback;
    }
    if (text.length > 280) {
        return fallback;
    }
    return text;
}

/**
 * Limpia etiquetas visibles (programa, ciclo, nombre) sin alterar datos en BD.
 * @param {unknown} value
 * @param {string} [fallback]
 */
export function sanitizeInstitutionalLabel(value, fallback = '—') {
    const text = String(value ?? '').trim();
    if (!text) {
        return fallback;
    }

    if (TECHNICAL_PATTERNS.some((re) => re.test(text))) {
        return fallback;
    }

    if (/\bdemosynthetic\b/i.test(text)) {
        return 'Alumno de prueba institucional';
    }

    let out = text;

    const cicloDemo = out.match(/ciclo\s+demo\s+(.+)/i);
    if (cicloDemo) {
        const resto = cicloDemo[1].replace(/control\s+escolar/gi, '').trim();
        out = resto ? `Ciclo escolar ${resto}` : 'Ciclo escolar';
    }

    const planDemo = out.match(/plan\s+demo\s+(.+)/i);
    if (planDemo) {
        out = `Plan de estudios ${planDemo[1].trim()}`;
    }

    const programaDemo = out.match(/programa\s+demo\s+(.+)/i);
    if (programaDemo) {
        out = `Programa ${programaDemo[1].trim()}`;
    }

    if (DEMO_LABEL_PATTERNS.some((re) => re.test(out)) && out === text) {
        if (/ciclo/i.test(out)) return 'Ciclo escolar';
        if (/plan/i.test(out)) return 'Plan de estudios';
        if (/programa/i.test(out)) return 'Programa educativo';
        return fallback;
    }

    out = out.replace(/\bdemo\b/gi, '').replace(/\s+/g, ' ').trim();
    out = out.replace(/\blegacy\b/gi, '').replace(/\s+/g, ' ').trim();

    return out || fallback;
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

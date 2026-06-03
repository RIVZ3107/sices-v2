/**
 * Severidad y mensajes institucionales — carga histórica / validación normativa.
 * No expone "legacy" ni textos técnicos a Control Escolar.
 */

export const MSG_CARGA_HISTORICA_ADVERTENCIA =
    'La matrícula proviene de una carga histórica y será validada por Educación Superior antes del resultado final.';

export const MSG_CARGA_HISTORICA_BLOQUEO =
    'No es posible continuar porque la matrícula requiere validación normativa previa por Educación Superior.';

const ESTADO_RECHAZADO = 'rechazado_normativamente';
const ESTADO_PENDIENTE = 'pendiente_validacion_normativa';

/**
 * @param {object|null|undefined} legacy - contexto_legacy_normativo del API
 * @param {{ flujo?: 'solicitud'|'expediente' }} [opts]
 * @returns {{ bloquea: boolean, severidad: 'error'|'warning'|'info'|null, mensaje: string|null, mostrar: boolean }}
 */
export function interpretarLegacyNormativo(legacy, opts = {}) {
    const flujo = opts.flujo ?? 'solicitud';

    if (!legacy) {
        return { bloquea: false, severidad: null, mensaje: null, mostrar: false };
    }

    const codigo = String(legacy.estado_codigo ?? '').trim();
    const etiqueta = String(legacy.estado_legacy ?? '').toLowerCase();

    const esRechazado =
        codigo === ESTADO_RECHAZADO || etiqueta.includes('rechazado');
    const esPendiente =
        codigo === ESTADO_PENDIENTE
        || etiqueta.includes('pendiente')
        || etiqueta.includes('validación normativa pendiente');

    if (typeof legacy.bloquea === 'boolean' && legacy.bloquea) {
        return {
            bloquea: true,
            severidad: 'error',
            mensaje: MSG_CARGA_HISTORICA_BLOQUEO,
            mostrar: true,
        };
    }

    if (esRechazado) {
        return {
            bloquea: true,
            severidad: 'error',
            mensaje: MSG_CARGA_HISTORICA_BLOQUEO,
            mostrar: true,
        };
    }

    if (esPendiente || legacy.advertencia_carga_historica === true) {
        return {
            bloquea: false,
            severidad: 'warning',
            mensaje: MSG_CARGA_HISTORICA_ADVERTENCIA,
            mostrar: true,
        };
    }

    if (legacy.requiere_atencion) {
        return {
            bloquea: false,
            severidad: 'warning',
            mensaje: MSG_CARGA_HISTORICA_ADVERTENCIA,
            mostrar: true,
        };
    }

    return { bloquea: false, severidad: null, mensaje: null, mostrar: false };
}

/** @param {'error'|'warning'|'info'|'success'} severidad */
export function alertTypeFromSeveridad(severidad) {
    if (severidad === 'error') return 'danger';
    if (severidad === 'warning') return 'warning';
    if (severidad === 'success') return 'success';
    return 'info';
}

/**
 * Traducciones de estados técnicos de certificación (documento DEC / workflow SEP).
 */

export const LABEL_ESTADO_WORKFLOW = {
    borrador: 'Borrador',
    pendiente: 'Pendiente de revisión administrativa',
    en_revision: 'En revisión',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    cancelado: 'Cancelado',
};

export const LABEL_ESTADO_CADENA = {
    no_generada: 'Cadena original no generada',
    generada: 'Cadena generada',
    error_cadena: 'Error en cadena original',
};

export const LABEL_ESTADO_XML = {
    no_generado: 'XML no generado',
    generado: 'XML generado',
    validado: 'XML validado',
    sellado: 'XML sellado',
    timbrado: 'XML timbrado',
    error_xml: 'Error en XML',
};

export const LABEL_ESTADO_FIRMA = {
    no_firmado: 'Sin firma electrónica',
    firmando: 'Firma en proceso',
    firmado: 'Firmado',
    error_firma: 'Error de firma',
};

export const LABEL_ESTADO_SEP = {
    no_enviado: 'No enviado a SEP',
    pendiente_envio: 'Pendiente de envío SEP',
    enviado: 'Enviado a SEP',
    timbrado: 'Timbrado SEP',
    rechazado: 'Rechazado por SEP',
    error_sep: 'Error ante SEP',
};

export const LABEL_ESTADO_PDF = {
    no_generado: 'PDF no generado',
    generado: 'PDF generado',
    error_pdf: 'Error al generar PDF',
};

export const LABEL_ESTADO_NORMATIVA = {
    pendiente_validacion_normativa: 'Pendiente de validación normativa',
    validado_normativamente: 'Validado normativamente',
    rechazado_normativamente: 'Rechazado normativamente',
};

/** @returns {string} */
export function labelEstadoWorkflow(value) {
    if (value === null || value === undefined || value === '') return '—';
    return LABEL_ESTADO_WORKFLOW[String(value)] ?? String(value);
}

/** @returns {string} */
export function labelEstadoCadena(value) {
    if (value === null || value === undefined || value === '') return '—';
    return LABEL_ESTADO_CADENA[String(value)] ?? String(value);
}

/** @returns {string} */
export function labelEstadoXml(value) {
    if (value === null || value === undefined || value === '') return '—';
    return LABEL_ESTADO_XML[String(value)] ?? String(value);
}

/** @returns {string} */
export function labelEstadoFirma(value) {
    if (value === null || value === undefined || value === '') return '—';
    return LABEL_ESTADO_FIRMA[String(value)] ?? String(value);
}

/** @returns {string} */
export function labelEstadoSep(value) {
    if (value === null || value === undefined || value === '') return '—';
    const k = String(value);
    const fixed = k === 'pendiente_envío' ? 'pendiente_envio' : k;
    return LABEL_ESTADO_SEP[fixed] ?? k;
}

/** @returns {{ workflow: string, cadena: string, xml: string, firma: string, sep: string }} */
export function resumenCadenaFirmaHumano(doc) {
    const d = doc || {};
    return {
        workflow: labelEstadoWorkflow(d.estado_workflow),
        cadena: labelEstadoCadena(d.estado_cadena),
        xml: labelEstadoXml(d.estado_xml),
        firma: labelEstadoFirma(d.estado_firma),
        sep: labelEstadoSep(d.estado_sep),
    };
}

/** @returns {string} */
export function labelEstadoNormativa(value) {
    if (value === null || value === undefined || value === '') return '—';
    return LABEL_ESTADO_NORMATIVA[String(value)] ?? String(value);
}

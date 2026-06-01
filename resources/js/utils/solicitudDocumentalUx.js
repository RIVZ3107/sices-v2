/** Clasificación y textos UX — solicitud documental Control Escolar. */

export const DESCRIPCION_TIPO_INSTITUCIONAL = {
    certificado: 'Documento académico oficial que acredita estudios conforme al plan registrado.',
    certificado_terminal: 'Documento que acredita la terminación de estudios en el plan vigente.',
    certificacion: 'Certificación de estudios conforme a la normativa institucional.',
    certificacion_parcial: 'Certificación parcial de avance en el plan de estudios.',
    constancia: 'Constancia académica con datos del expediente vigente.',
    titulo: 'Trámite de título profesional conforme al programa autorizado.',
    grado_academico: 'Documento de grado académico según el programa.',
    otro: 'Otro documento académico autorizado para el subsistema.',
};

export function descripcionTipoInstitucional(tipo) {
    const key = String(tipo?.key ?? tipo ?? '');
    const raw = tipo?.descripcion ?? '';
    if (DESCRIPCION_TIPO_INSTITUCIONAL[key]) {
        return DESCRIPCION_TIPO_INSTITUCIONAL[key];
    }
    if (/xml|jasper|informix|pipeline|firma|timbrado|sep/i.test(raw)) {
        return DESCRIPCION_TIPO_INSTITUCIONAL[key] ?? 'Documento académico autorizado para este expediente.';
    }
    return raw || DESCRIPCION_TIPO_INSTITUCIONAL.otro;
}

/**
 * @param {Array<{ key: string, label: string, ok: boolean, blocking?: boolean }>} items
 */
export function clasificarValidaciones(items) {
    const completas = items.filter((i) => i.ok).length;
    const total = items.length;
    const bloqueantes = items.filter((i) => i.blocking !== false && !i.ok);
    const advertencias = items.filter((i) => i.blocking === false && !i.ok);

    return {
        completas,
        total,
        bloqueantes,
        advertencias,
        puedeEnviar: bloqueantes.length === 0,
        resumenLineas: items.filter((i) => ['duplicado', 'trayectoria', 'matricula'].includes(i.key) || i.ok),
    };
}

export function severidadItem(item) {
    if (item.ok) return 'ok';
    if (item.blocking === false) return 'warning';
    return 'blocking';
}

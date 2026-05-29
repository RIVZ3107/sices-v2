/** Estados visibles del flujo institucional de certificación (solo UI). */

export const ESTADOS_FLUJO = {
    captura: { key: 'captura', label: 'Captura', badge: 'gray' },
    pendiente_certificador: { key: 'pendiente_certificador', label: 'Pendiente validación certificador', badge: 'yellow' },
    validado_certificador: { key: 'validado_certificador', label: 'Validado por certificador', badge: 'blue' },
    observado_certificador: { key: 'observado_certificador', label: 'Observado por certificador', badge: 'orange' },
    aprobado_es: { key: 'aprobado_es', label: 'Aprobado por Educación Superior', badge: 'green' },
    folio_asignado: { key: 'folio_asignado', label: 'Folio asignado', badge: 'blue' },
    en_procesamiento: { key: 'en_procesamiento', label: 'En procesamiento', badge: 'purple' },
    pendiente_firma: { key: 'pendiente_firma', label: 'Pendiente de firma', badge: 'purple' },
    firmado: { key: 'firmado', label: 'Firmado / timbrado', badge: 'green' },
    finalizado: { key: 'finalizado', label: 'Finalizado', badge: 'green' },
    incidencia_tecnica: { key: 'incidencia_tecnica', label: 'Incidencia técnica', badge: 'red' },
    revision_sistemas: { key: 'revision_sistemas', label: 'En revisión por Sistemas', badge: 'orange' },
    reintentado: { key: 'reintentado', label: 'Reintentado', badge: 'blue' },
    rechazado: { key: 'rechazado', label: 'Rechazado', badge: 'red' },
    cancelado: { key: 'cancelado', label: 'Cancelado', badge: 'gray' },
};

export function resolverEstadoCertificador(doc) {
    const meta = doc?.metadata ?? {};
    if (
        meta.validacion_certificador === 'observado'
        || doc.tiene_observaciones_pendientes
        || doc.estado_workflow === 'rechazado'
    ) {
        return { label: 'Observado por certificador', badge: 'orange', key: 'observado_certificador' };
    }
    if (['en_revision', 'pendiente', 'borrador'].includes(doc?.estado_workflow)) {
        return { label: 'Pendiente validación certificador', badge: 'yellow', key: 'pendiente_certificador' };
    }
    return { label: 'Validado por certificador', badge: 'blue', key: 'validado_certificador' };
}

export function resolverEstadoProcesamiento(doc) {
    if (doc?.estado_workflow === 'cancelado') {
        return { label: ESTADOS_FLUJO.cancelado.label, badge: ESTADOS_FLUJO.cancelado.badge, key: 'cancelado' };
    }
    if (doc?.estado_workflow === 'rechazado' && doc?.estado_firma !== 'error_firma') {
        return { label: ESTADOS_FLUJO.rechazado.label, badge: ESTADOS_FLUJO.rechazado.badge, key: 'rechazado' };
    }
    if (doc?.estado_firma === 'error_firma') {
        return { label: ESTADOS_FLUJO.incidencia_tecnica.label, badge: ESTADOS_FLUJO.incidencia_tecnica.badge, key: 'incidencia_tecnica' };
    }
    if (doc?.estado_firma === 'firmado') {
        return { label: ESTADOS_FLUJO.finalizado.label, badge: ESTADOS_FLUJO.finalizado.badge, key: 'finalizado' };
    }
    if (doc?.estado_firma === 'firmando') {
        return { label: ESTADOS_FLUJO.en_procesamiento.label, badge: ESTADOS_FLUJO.en_procesamiento.badge, key: 'en_procesamiento' };
    }
    if (doc?.listo_para_firma) {
        const cadena = doc?.estado_cadena;
        const xml = doc?.estado_xml;
        if (cadena === 'generada' && xml === 'generado') {
            return { label: ESTADOS_FLUJO.pendiente_firma.label, badge: ESTADOS_FLUJO.pendiente_firma.badge, key: 'pendiente_firma' };
        }
        return { label: ESTADOS_FLUJO.en_procesamiento.label, badge: ESTADOS_FLUJO.en_procesamiento.badge, key: 'en_procesamiento' };
    }
    if (doc?.estado_workflow === 'aprobado' && doc?.folio_interno) {
        return { label: ESTADOS_FLUJO.folio_asignado.label, badge: ESTADOS_FLUJO.folio_asignado.badge, key: 'folio_asignado' };
    }
    if (doc?.estado_workflow === 'aprobado') {
        return { label: ESTADOS_FLUJO.aprobado_es.label, badge: ESTADOS_FLUJO.aprobado_es.badge, key: 'aprobado_es' };
    }
    if (['en_revision', 'pendiente'].includes(doc?.estado_workflow)) {
        return { label: ESTADOS_FLUJO.pendiente_certificador.label, badge: ESTADOS_FLUJO.pendiente_certificador.badge, key: 'pendiente_certificador' };
    }
    return { label: 'Captura', badge: 'gray', key: 'captura' };
}

export function resolverEstadoFirma(doc) {
    const map = {
        firmado: { label: 'Firmado', badge: 'green' },
        firmando: { label: 'Firmando', badge: 'purple' },
        error_firma: { label: 'Error de firma', badge: 'red' },
        pendiente: { label: 'Pendiente', badge: 'yellow' },
    };
    const e = doc?.estado_firma ?? 'pendiente';
    return map[e] ?? { label: String(e), badge: 'gray' };
}

export function etapaFalloTecnico(doc) {
    if (doc?.estado_firma === 'error_firma') return 'Firma / timbrado';
    if (doc?.estado_xml === 'error') return 'XML DEC';
    if (doc?.estado_cadena === 'error') return 'Cadena original';
    if (doc?.metadata?.legacy_shadow?.last_error) return 'Exportación legacy';
    return 'Procesamiento técnico';
}

export function derivarKpisInstitucionales(rows) {
    const pendientesValidacion = rows.filter((r) =>
        ['pendiente_certificador', 'captura'].includes(r.estadoProcesamiento?.key),
    ).length;
    const validadosCertificador = rows.filter((r) => r.estadoCertificador?.key === 'validado_certificador').length;
    const pendientesFolio = rows.filter((r) => r.estadoProcesamiento?.key === 'aprobado_es').length;
    const enProcesamiento = rows.filter((r) =>
        ['en_procesamiento', 'pendiente_firma', 'folio_asignado'].includes(r.estadoProcesamiento?.key),
    ).length;
    const firmados = rows.filter((r) => ['firmado', 'finalizado'].includes(r.estadoProcesamiento?.key)).length;
    const incidencias = rows.filter((r) =>
        ['incidencia_tecnica', 'revision_sistemas'].includes(r.estadoProcesamiento?.key),
    ).length;

    return {
        pendientesValidacion,
        validadosCertificador,
        pendientesFolio,
        enProcesamiento,
        firmados,
        incidencias,
    };
}

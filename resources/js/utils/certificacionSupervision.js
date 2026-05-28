const TIPO_DOC_LABELS = {
    certificado: 'Certificado',
    titulo: 'Título',
    constancia: 'Constancia',
    kardex: 'Kardex',
};

export const FASES = {
    en_revision: { key: 'en_revision', label: 'En revisión', badge: 'blue' },
    aprobado: { key: 'aprobado', label: 'Aprobado', badge: 'green' },
    pendiente_folio: { key: 'pendiente_folio', label: 'Pendiente de folio', badge: 'orange' },
    listo_proceso_tecnico: { key: 'listo_proceso_tecnico', label: 'Listo para proceso técnico', badge: 'purple' },
    firmado: { key: 'firmado', label: 'Firmado', badge: 'green' },
    incidencia: { key: 'incidencia', label: 'Con incidencia', badge: 'red' },
};

/**
 * Placeholder explícito — solo si en el futuro no hay bandejas (no mezclar con datos reales).
 */
export function buildCertificationSupervisionMock() {
    return {
        kpis: {},
        rows: [],
        distribucion: [],
        prioridades: [],
        rezago: [],
        _placeholder: true,
    };
}

export function labelTipoDocumento(tipo) {
    if (!tipo) return '—';
    return TIPO_DOC_LABELS[tipo] ?? String(tipo).replace(/_/g, ' ');
}

export function diasEnEspera(doc) {
    const ref = doc.updated_at ?? doc.created_at ?? doc.fecha_solicitud;
    if (!ref) return 0;
    const ms = Date.now() - new Date(ref).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function resolverFase(doc) {
    if (doc.estado_firma === 'firmado' || doc.estado_firma === 'firmando') {
        return FASES.firmado;
    }
    if (doc.estado_firma === 'error_firma') {
        return FASES.incidencia;
    }
    if (doc.listo_para_firma) {
        return FASES.listo_proceso_tecnico;
    }
    if (doc.estado_workflow === 'aprobado' && !doc.folio_interno) {
        return FASES.pendiente_folio;
    }
    if (doc.estado_workflow === 'aprobado') {
        return FASES.aprobado;
    }
    if (doc.estado_workflow === 'rechazado' || doc.estado_workflow === 'cancelado') {
        return FASES.incidencia;
    }
    if (['en_revision', 'pendiente'].includes(doc.estado_workflow)) {
        return FASES.en_revision;
    }
    return FASES.en_revision;
}

export function resolverEstatus(doc) {
    const fase = resolverFase(doc);
    if (fase.key === FASES.incidencia.key) {
        if (doc.estado_workflow === 'cancelado') {
            return { label: 'Cancelado', badge: 'gray' };
        }
        if (doc.estado_workflow === 'rechazado' || doc.tiene_observaciones_pendientes) {
            return { label: 'Observado', badge: 'yellow' };
        }
        if (doc.estado_firma === 'error_firma') {
            return { label: 'Error firma', badge: 'red' };
        }
        return { label: 'Rechazado', badge: 'red' };
    }
    return { label: fase.label, badge: fase.badge };
}

export function resolverPrioridad(doc) {
    const dias = diasEnEspera(doc);
    if (
        doc.tiene_observaciones_pendientes
        || doc.estado_workflow === 'rechazado'
        || doc.estado_firma === 'error_firma'
        || dias >= 30
    ) {
        return { label: 'Alta', badge: 'red' };
    }
    if (
        resolverFase(doc).key === FASES.pendiente_folio.key
        || resolverFase(doc).key === FASES.en_revision.key
        || dias >= 14
    ) {
        return { label: 'Media', badge: 'orange' };
    }
    return { label: 'Baja', badge: 'blue' };
}

export function mapDocumentoSupervisionRow(doc) {
    const fase = resolverFase(doc);
    const estatus = resolverEstatus(doc);
    const prioridad = resolverPrioridad(doc);
    const nombrePartes = [doc.alumno?.nombre, doc.alumno?.primer_apellido, doc.alumno?.segundo_apellido]
        .filter(Boolean)
        .join(' ');
    const alumnoNombre = doc.alumno?.nombre_completo ?? (nombrePartes || '—');

    return {
        id: doc.id,
        folio: doc.folio_interno || `DOC-${doc.id}`,
        alumno: alumnoNombre,
        alumnoId: doc.alumno?.id ?? doc.alumno_id,
        curp: doc.alumno?.curp ?? '',
        matricula: doc.matricula?.matricula ?? '',
        institucion: doc.institucion?.nombre ?? '—',
        institucionId: doc.institucion_id,
        programa: doc.programa?.nombre ?? '—',
        tipoDocumento: labelTipoDocumento(doc.tipo_documento),
        tipoDocumentoRaw: doc.tipo_documento,
        ciclo: doc.ciclo_escolar?.nombre ?? '',
        fase,
        estatus,
        prioridad,
        diasEspera: diasEnEspera(doc),
        raw: doc,
        puedeAsignarFolio:
            doc.estado_workflow === 'aprobado' && !doc.folio_interno && !doc.listo_para_firma,
        puedeLiberar:
            doc.estado_workflow === 'aprobado'
            && doc.folio_interno
            && !doc.listo_para_firma
            && !doc.tiene_observaciones_pendientes
            && doc.estado_firma !== 'firmado',
        puedeValidar: ['en_revision', 'pendiente'].includes(doc.estado_workflow),
        updated_at: doc.updated_at ?? doc.created_at,
    };
}

export function mergeDocumentosBandejas(listas) {
    const porId = new Map();
    listas.flat().forEach((d) => {
        if (d?.id) porId.set(d.id, d);
    });
    return [...porId.values()];
}

export function derivarKpis(resumen, rows) {
    const candidatos = Number(
        resumen.egresados_candidatos
        ?? resumen.candidatos_certificacion
        ?? resumen.pendientes_revision
        ?? 0,
    );
    const aprobados = Number(resumen.aprobados ?? 0);
    const listos = Number(resumen.listos_para_firma ?? 0);
    const firmados = Number(resumen.firmados ?? 0);
    const rechazados = Number(resumen.rechazados ?? 0);
    const cancelados = Number(resumen.cancelados ?? 0);
    const erroresFirma = Number(resumen.errores_firma ?? resumen.error_firma ?? 0);

    const pendientesFolio = rows.filter((r) => r.fase.key === FASES.pendiente_folio.key).length;
    const incidencias = rows.filter((r) => r.fase.key === FASES.incidencia.key).length
        || rechazados + cancelados + erroresFirma;

    return {
        candidatos,
        aprobados,
        pendientesFolio: pendientesFolio || Math.max(0, aprobados - listos),
        listosProcesoTecnico: listos,
        firmados,
        incidencias,
    };
}

export function derivarDistribucion(rows) {
    const counts = {
        [FASES.en_revision.key]: 0,
        [FASES.aprobado.key]: 0,
        [FASES.pendiente_folio.key]: 0,
        [FASES.listo_proceso_tecnico.key]: 0,
        [FASES.firmado.key]: 0,
        [FASES.incidencia.key]: 0,
    };
    rows.forEach((r) => {
        counts[r.fase.key] = (counts[r.fase.key] ?? 0) + 1;
    });
    return [
        { label: FASES.en_revision.label, value: counts.en_revision, color: '#185FA5' },
        { label: FASES.aprobado.label, value: counts.aprobado, color: '#0F6E56' },
        { label: FASES.pendiente_folio.label, value: counts.pendiente_folio, color: '#BA7517' },
        { label: FASES.listo_proceso_tecnico.label, value: counts.listo_proceso_tecnico, color: '#534AB7' },
        { label: FASES.firmado.label, value: counts.firmado, color: '#059669' },
        { label: FASES.incidencia.label, value: counts.incidencia, color: '#DC2626' },
    ];
}

export function derivarRezagoInstituciones(rows, limit = 5) {
    const map = new Map();
    rows.forEach((r) => {
        if (r.fase.key === FASES.firmado.key) return;
        const nombre = r.institucion;
        map.set(nombre, (map.get(nombre) ?? 0) + 1);
    });
    return [...map.entries()]
        .map(([institucion, total]) => ({ institucion, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

export function aplicarFiltrosSupervision(rows, filters) {
    let out = [...rows];
    const q = (filters.q ?? '').trim().toLowerCase();
    if (q) {
        out = out.filter(
            (r) =>
                r.folio.toLowerCase().includes(q)
                || r.alumno.toLowerCase().includes(q)
                || r.curp.toLowerCase().includes(q)
                || r.matricula.toLowerCase().includes(q)
                || r.institucion.toLowerCase().includes(q),
        );
    }
    if (filters.institucion_id) {
        out = out.filter((r) => String(r.institucionId) === String(filters.institucion_id));
    }
    if (filters.tipo_documento) {
        out = out.filter((r) => r.tipoDocumentoRaw === filters.tipo_documento);
    }
    if (filters.fase) {
        out = out.filter((r) => r.fase.key === filters.fase);
    }
    if (filters.estatus) {
        out = out.filter((r) => r.estatus.label === filters.estatus);
    }
    if (filters.prioridad) {
        out = out.filter((r) => r.prioridad.label === filters.prioridad);
    }
    if (filters.ciclo_escolar_id) {
        out = out.filter((r) => String(r.raw.ciclo_escolar_id) === String(filters.ciclo_escolar_id));
    }
    return out;
}

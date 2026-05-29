import {
    derivarKpisInstitucionales,
    resolverEstadoCertificador,
    resolverEstadoFirma,
    resolverEstadoProcesamiento,
} from './certificacionEstadosInstitucionales';

/** Certificación UPN — mapeo de estados y filas de bandeja. */

import { UPN_CERTIFICACION_PATH, upnCertificacionDetallePath as detallePath } from './certificacionRoutes';

/** @deprecated Usar UPN_CERTIFICACION_PATH */
export const UPN_CERTIFICACION_BASE = UPN_CERTIFICACION_PATH;

export function upnCertificacionDetallePath(documentoId) {
    return detallePath(documentoId);
}

export const UPN_SUBSISTEMA_CLAVE = 'UPN';

export const UPN_ESTATUS_OPCIONES = [
    { value: '', label: 'Todos los estatus' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' },
    { value: 'firmado', label: 'Firmado' },
    { value: 'listo_proceso_tecnico', label: 'Listo para proceso técnico' },
    { value: 'error_firma', label: 'Error de firma' },
    { value: 'cancelado', label: 'Cancelado' },
];

/** @type {Record<string, string[]>} */
export const UPN_ESTATUS_BANDEJAS = {
    pendiente: ['en-validacion-certificador'],
    aprobado: ['aprobado-educacion-superior', 'validado-por-certificador'],
    rechazado: ['rechazados'],
    firmado: ['firmado-timbrado', 'finalizado'],
    listo_proceso_tecnico: ['pendiente-firma', 'en-procesamiento', 'folio-asignado'],
    error_firma: ['incidencia-tecnica'],
    cancelado: ['cancelados'],
};

/** Bandejas iniciales (evita 8 peticiones paralelas que dejan la UI en loading). */
export const UPN_BANDEJAS_DEFAULT = [
    'validado-por-certificador',
    'aprobado-educacion-superior',
    'folio-asignado',
    'en-procesamiento',
    'pendiente-firma',
    'firmado-timbrado',
];

export const UPN_BANDEJAS_EXTRA = ['finalizado', 'incidencia-tecnica', 'rechazados', 'cancelados'];

/**
 * @param {object} row
 * @returns {{ key: string, label: string, badge: string }}
 */
export function resolverEstatusUpn(row) {
    if (row?.estado_workflow === 'cancelado') {
        return { key: 'cancelado', label: 'Cancelado', badge: 'gray' };
    }
    if (row?.estado_firma === 'firmado') {
        return { key: 'firmado', label: 'Firmado', badge: 'green' };
    }
    if (row?.estado_firma === 'error_firma') {
        return { key: 'error_firma', label: 'Error de firma', badge: 'red' };
    }
    if (row?.listo_para_firma && row?.estado_workflow === 'aprobado') {
        return { key: 'listo_proceso_tecnico', label: 'Listo para proceso técnico', badge: 'purple' };
    }
    if (row?.estado_workflow === 'aprobado') {
        return { key: 'aprobado', label: 'Aprobado', badge: 'green' };
    }
    if (row?.estado_workflow === 'rechazado') {
        return { key: 'rechazado', label: 'Rechazado', badge: 'red' };
    }
    if (['en_revision', 'pendiente'].includes(row?.estado_workflow)) {
        return { key: 'pendiente', label: 'Pendiente', badge: 'yellow' };
    }
    return { key: 'pendiente', label: 'Pendiente', badge: 'yellow' };
}

/**
 * @param {object} row
 * @param {number} index
 */
/** KPIs institucionales UPN. */
export function computeUpnKpis(rows = []) {
    return derivarKpisInstitucionales(rows);
}

export function mapFilaUpn(row, index = 0) {
    const estatus = resolverEstatusUpn(row);
    const estadoCertificador = resolverEstadoCertificador(row);
    const estadoProcesamiento = resolverEstadoProcesamiento(row);
    const estadoFirma = resolverEstadoFirma(row);
    const meta = row?.metadata ?? {};
    const trayectoria = meta?.trayectoria_resumen ?? meta?.trayectoria ?? {};
    const wr = row?.workflow_resumen ?? {};
    const acciones = (wr.acciones_permitidas ?? []).map((a) => a.accion);

    return {
        id: row.id,
        indice: index + 1,
        nombre: row.alumno?.nombre_completo ?? '—',
        curp: row.alumno?.curp ?? '—',
        matricula: row.matricula?.matricula ?? '—',
        cct: row.sede?.clave ?? row.sede?.nombre ?? '—',
        folio: row.folio_interno ?? `DOC-${row.id}`,
        carrera: row.programa?.nombre ?? row.tipo_certificacion ?? '—',
        tipoCertificado: row.tipo_documento ?? row.tipo_certificacion ?? '—',
        subsistema: row.subsistema?.clave ?? 'UPN',
        etapaLabel: wr.etapa_label,
        siguienteAccion: wr.siguiente_accion_principal?.label,
        promedio: trayectoria?.promedio ?? meta?.promedio ?? meta?.promedio_aprovechamiento ?? '—',
        fechaExpedicion: row.fecha_aprobacion ?? row.fecha_solicitud ?? null,
        estatus,
        estadoCertificador,
        estadoProcesamiento,
        estadoFirma,
        workflowResumen: wr,
        raw: row,
        alumnoId: row.alumno?.id,
        puedeProcesar: acciones.includes('procesar_certificacion'),
        puedeFirmar: acciones.includes('firmar_certificado'),
        puedeAprobar: acciones.includes('aprobar_expediente'),
        tieneIncidencia:
            wr.etapa === 'incidencia_tecnica'
            || row.estado_firma === 'error_firma'
            || Boolean(meta?.firma_servicio_34?.last_error),
    };
}

/**
 * @param {object} filters
 * @returns {object}
 */
export function buildBandejaApiParams(filters, subsistemaId) {
    const params = {
        per_page: 50,
        subsistema: UPN_SUBSISTEMA_CLAVE,
    };
    if (subsistemaId) {
        params.subsistema_id = subsistemaId;
    }
    if (filters.institucion_id) params.institucion_id = filters.institucion_id;
    if (filters.sede_id) params.sede_id = filters.sede_id;
    if (filters.ciclo_escolar_id) params.ciclo_escolar_id = filters.ciclo_escolar_id;
    if (filters.tipo_documento) params.tipo_documento = filters.tipo_documento;
    if (filters.tipo_certificacion) params.tipo_certificacion = filters.tipo_certificacion;
    if (filters.folio) params.folio_interno = filters.folio;
    if (filters.curp) params.curp = filters.curp;
    if (filters.fecha_expedicion_desde) params.fecha_desde = filters.fecha_expedicion_desde;
    if (filters.fecha_expedicion_hasta) params.fecha_hasta = filters.fecha_expedicion_hasta;
    if (filters.q?.trim()) params.q = filters.q.trim();
    if (filters.matricula?.trim()) {
        params.q = [params.q, filters.matricula.trim()].filter(Boolean).join(' ');
    }
    return params;
}

/**
 * @param {object} row
 * @param {object} filters
 */
export function pasaFiltrosClienteUpn(row, filters) {
    if (filters.nombre?.trim()) {
        const n = filters.nombre.trim().toLowerCase();
        if (!String(row.nombre ?? '').toLowerCase().includes(n)) return false;
    }
    if (filters.estatus) {
        if (row.estatus?.key !== filters.estatus) return false;
    }
    if (filters.programa_nombre) {
        const carrera = String(row.carrera ?? '').toLowerCase();
        const needle = String(filters.programa_nombre).toLowerCase();
        if (!carrera.includes(needle)) return false;
    }
    return true;
}

export function formatFechaMx(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('es-MX');
    } catch {
        return '—';
    }
}

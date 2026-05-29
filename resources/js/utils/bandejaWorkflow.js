import { documentosAcademicosApi } from '../api/documentosAcademicos';

import { EMPTY_BY_ROLE } from './uxInstitucional';

export const EMPTY_BANDEJA = {
    control_escolar: EMPTY_BY_ROLE.control_escolar.title,
    certificador: EMPTY_BY_ROLE.certificador.title,
    educacion_superior: EMPTY_BY_ROLE.educacion_superior.title,
    sistemas: EMPTY_BY_ROLE.sistemas.title,
    default: EMPTY_BY_ROLE.generico.title,
};

export function bandejaEtapaLabel(row) {
    return row?.workflow_resumen?.etapa_label ?? row?.etapa_institucional ?? '—';
}

export function bandejaSiguienteAccion(row) {
    return row?.workflow_resumen?.siguiente_accion_principal?.label ?? '—';
}

export function bandejaAcciones(row) {
    return row?.workflow_resumen?.acciones_permitidas ?? [];
}

export function bandejaTieneAccion(row, accion) {
    return bandejaAcciones(row).some((a) => a.accion === accion);
}

export function fmtUltimoMovimiento(row) {
    const v = row?.ultimo_movimiento ?? row?.updated_at;
    if (!v) return '—';
    try {
        return new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

export function institucionCct(row) {
    const ins = row?.institucion;
    if (!ins) return '—';
    return ins.clave ? `${ins.nombre ?? ''} (${ins.clave})` : ins.nombre ?? '—';
}

/**
 * Columnas estándar para tablas de bandeja institucional.
 */
export function columnasBandejaInstitucional() {
    return [
        {
            key: 'alumno',
            label: 'Alumno',
            render: (r) => r.alumno?.nombre_completo ?? '—',
        },
        {
            key: 'curp',
            label: 'CURP',
            render: (r) => r.alumno?.curp ?? '—',
        },
        {
            key: 'matricula',
            label: 'Matrícula',
            render: (r) => r.matricula?.matricula ?? '—',
        },
        {
            key: 'institucion',
            label: 'Institución / CCT',
            render: (r) => institucionCct(r),
        },
        {
            key: 'tipo',
            label: 'Tipo documental',
            render: (r) => r.tipo_documento ?? '—',
        },
        {
            key: 'subsistema',
            label: 'Subsistema',
            render: (r) => r.subsistema?.clave ?? r.subsistema?.nombre ?? '—',
        },
        {
            key: 'etapa',
            label: 'Etapa institucional',
            render: (r) => bandejaEtapaLabel(r),
        },
        {
            key: 'siguiente',
            label: 'Siguiente acción',
            render: (r) => bandejaSiguienteAccion(r),
        },
        {
            key: 'movimiento',
            label: 'Último movimiento',
            render: (r) => fmtUltimoMovimiento(r),
        },
    ];
}

export async function ejecutarAccionBandeja(accion, documentoId, motivo = '') {
    const payload = motivo ? { motivo } : {};
    switch (accion) {
        case 'enviar_validacion':
            return documentosAcademicosApi.enviarRevision(documentoId, payload);
        case 'validar_informacion':
            return documentosAcademicosApi.validarInformacion(documentoId, payload);
        case 'devolver_observaciones':
            return documentosAcademicosApi.rechazar(documentoId, { motivo: motivo || 'Devolución con observaciones.' });
        case 'aprobar_expediente':
            return documentosAcademicosApi.aprobar(documentoId, payload);
        case 'procesar_certificacion':
            return documentosAcademicosApi.transicionWorkflow(documentoId, {
                accion: 'procesar_certificacion',
                motivo: motivo || 'Procesar certificación.',
            });
        case 'firmar_certificado':
            return documentosAcademicosApi.transicionWorkflow(documentoId, {
                accion: 'firmar_certificado',
                motivo: motivo || 'Registro institucional de firma.',
            });
        case 'asignar_folio':
            return documentosAcademicosApi.transicionWorkflow(documentoId, { accion: 'asignar_folio' });
        case 'tomar_incidencia':
            return documentosAcademicosApi.transicionWorkflow(documentoId, {
                accion: 'tomar_incidencia',
                motivo: motivo || 'Incidencia tomada por Sistemas.',
            });
        case 'reintentar_proceso':
            return documentosAcademicosApi.transicionWorkflow(documentoId, {
                accion: 'reintentar_proceso',
                motivo: motivo || 'Reintento de proceso.',
            });
        default:
            return null;
    }
}

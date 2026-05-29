import { etapaFalloTecnico } from './certificacionEstadosInstitucionales';

export const BANDEJAS_INCIDENCIAS = {
    abiertas: { key: 'abiertas', label: 'Incidencias abiertas', api: 'errores-firma' },
    revision: { key: 'revision', label: 'En revisión', api: 'pendientes-tecnicos' },
    corregidas: { key: 'corregidas', label: 'Corregidas / reintentables', api: 'listos-para-firma' },
    errores_firma: { key: 'errores_firma', label: 'Errores de firma', api: 'errores-firma' },
    historial: { key: 'historial', label: 'Historial técnico', api: 'firmados' },
};

export function mapFilaIncidencia(row) {
    const meta = row?.metadata ?? {};
    const firmaMeta = meta?.firma_servicio_34 ?? {};
    const alumno = row.alumno?.nombre_completo ?? row.alumno?.nombre ?? '—';

    return {
        id: row.id,
        folio: row.folio_interno ?? `DOC-${row.id}`,
        alumno,
        curp: row.alumno?.curp ?? '—',
        institucion: row.institucion?.nombre ?? '—',
        etapa: etapaFalloTecnico(row),
        tipoError: firmaMeta.last_error ?? row.estado_firma ?? row.estado_workflow ?? '—',
        ultimoIntento: firmaMeta.last_attempt_at ?? row.updated_at ?? null,
        responsable: meta?.incidencia_responsable ?? '—',
        raw: row,
    };
}

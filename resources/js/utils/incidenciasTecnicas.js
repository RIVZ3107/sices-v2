import { etapaFalloTecnico } from './certificacionEstadosInstitucionales';

export const BANDEJAS_INCIDENCIAS = {
    abiertas: { key: 'abiertas', label: 'Incidencias abiertas', api: 'incidencia-tecnica' },
    revision: { key: 'revision', label: 'En revisión Sistemas', api: 'en-revision-sistemas' },
    corregidas: { key: 'corregidas', label: 'Reintentadas', api: 'reintentado' },
    errores_firma: { key: 'errores_firma', label: 'Errores de firma', api: 'incidencia-tecnica' },
    historial: { key: 'historial', label: 'Resueltas', api: 'firmado-timbrado' },
};

export function mapFilaIncidencia(row) {
    const meta = row?.metadata ?? {};
    const alumno = row.alumno?.nombre_completo ?? row.alumno?.nombre ?? '—';
    const wr = row.workflow_resumen ?? {};

    return {
        id: row.id,
        folio: row.folio_interno ?? `DOC-${row.id}`,
        alumno,
        curp: row.alumno?.curp ?? '—',
        institucion: row.institucion?.nombre ?? '—',
        etapa: wr.etapa_label ?? etapaFalloTecnico(row),
        tipoError: meta.incidencia_motivo ?? 'Incidencia técnica',
        ultimoIntento: row.ultimo_movimiento ?? row.updated_at ?? null,
        responsable: meta?.incidencia_responsable ?? '—',
        workflow_resumen: wr,
        raw: row,
    };
}

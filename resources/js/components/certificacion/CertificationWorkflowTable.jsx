import { Link } from 'react-router-dom';
import { EsTable, esColors, esTheme } from '../educacionSuperior';
import { CertificacionWorkflowBadge } from './CertificacionStatusBadge';
import { InstitutionalBandejaActions } from '../bandeja/InstitutionalBandejaActions';
import { fmtUltimoMovimiento } from '../../utils/bandejaWorkflow';
import { revisionInstitucionalDetallePath } from '../../utils/certificacionRoutes';
import { uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

const HEADERS = [
    'Alumno',
    'CURP',
    'Matrícula',
    'Institución / CCT',
    'Tipo documental',
    'Subsistema',
    'Etapa institucional',
    'Siguiente acción',
    'Último movimiento',
    'Acciones',
];

function fmtFecha(v) {
    if (!v) return '—';
    try {
        return new Date(v).toLocaleDateString('es-MX');
    } catch {
        return '—';
    }
}

function bandejaRowFromItem(item) {
    const raw = item.raw ?? item;
    return {
        id: item.id,
        workflow_resumen: item.workflowResumen ?? raw.workflow_resumen,
        updated_at: raw.updated_at ?? item.updated_at,
        ultimo_movimiento: raw.ultimo_movimiento ?? item.updated_at,
    };
}

export function CertificationWorkflowTable({
    rows,
    onAccion,
    busyId,
    detallePath = revisionInstitucionalDetallePath,
    emptyMessage = 'No hay documentos listos para operación institucional.',
}) {
    if (!rows?.length) {
        return (
            <EsTable headers={HEADERS} emptyColSpan={HEADERS.length} emptyMessage={emptyMessage} />
        );
    }

    return (
        <EsTable headers={HEADERS} emptyColSpan={HEADERS.length} emptyMessage={null}>
            {rows.map((item) => {
                const wr = item.workflowResumen ?? item.raw?.workflow_resumen ?? {};
                const etapaLabel = wr.etapa_label ?? item.etapaLabel ?? item.estadoProcesamiento?.label ?? '—';
                const siguiente = wr.siguiente_accion_principal?.label ?? item.siguienteAccionLabel ?? '—';
                const bandejaRow = bandejaRowFromItem(item);

                return (
                    <tr key={item.id} style={esTheme.tr}>
                        <td style={{ ...esTheme.td, fontWeight: 500 }}>{item.alumno}</td>
                        <td style={{ ...esTheme.td, fontFamily: 'monospace', fontSize: 12 }}>{item.curp || '—'}</td>
                        <td style={esTheme.td}>{item.matricula || '—'}</td>
                        <td style={{ ...esTheme.td, color: esColors.muted, maxWidth: 160 }}>{item.institucion}</td>
                        <td style={esTheme.td}>
                            {item.tipoDocumento}
                            {item.tipoCertificacion ? (
                                <span style={{ display: 'block', fontSize: 11, color: esColors.muted }}>
                                    {item.tipoCertificacion}
                                </span>
                            ) : null}
                        </td>
                        <td style={esTheme.td}>{item.subsistemaLabel ?? item.raw?.subsistema?.clave ?? '—'}</td>
                        <td style={esTheme.td}>
                            <CertificacionWorkflowBadge
                                etapa={wr.etapa ?? item.etapaInstitucional}
                                label={etapaLabel}
                            />
                        </td>
                        <td style={{ ...esTheme.td, color: esColors.muted, fontSize: 12 }}>{siguiente}</td>
                        <td style={{ ...esTheme.td, fontSize: 12, color: esColors.muted }}>
                            {fmtUltimoMovimiento(bandejaRow)}
                        </td>
                        <td style={{ ...esTheme.td, whiteSpace: 'nowrap', maxWidth: 260 }}>
                            <InstitutionalBandejaActions
                                row={bandejaRow}
                                busy={busyId === item.id}
                                onAccion={
                                    onAccion
                                        ? (a) => onAccion(a, item)
                                        : undefined
                                }
                            />
                            {item.tieneIncidencia ? (
                                <Link
                                    to={uxLinkIncidenciaTecnica(item.id)}
                                    style={{ fontSize: 12, fontWeight: 500, color: esColors.primary, marginLeft: 6 }}
                                >
                                    Ver incidencia
                                </Link>
                            ) : null}
                            <Link
                                to={detallePath(item.id)}
                                style={{ fontSize: 12, fontWeight: 500, color: esColors.muted, marginLeft: 6 }}
                            >
                                Expediente
                            </Link>
                        </td>
                    </tr>
                );
            })}
        </EsTable>
    );
}

export { fmtFecha };

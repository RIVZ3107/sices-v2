import { Link } from 'react-router-dom';
import { esTheme } from '../educacionSuperior';
import { InstitutionalBandejaActions } from '../bandeja/InstitutionalBandejaActions';
import { CertificacionWorkflowBadge } from '../certificacion/CertificacionStatusBadge';
import { fmtUltimoMovimiento } from '../../utils/bandejaWorkflow';
import { upnCertificacionDetallePath } from '../../utils/upnCertificacion';
import { uxLinkIncidenciaTecnica } from '../../utils/uxInstitucional';

export function UpnCertificacionTable({ rows, onAccion, busyId, emptyMessage }) {
    const th = {
        padding: '10px 12px',
        textAlign: 'left',
        fontSize: 11,
        fontWeight: 600,
        color: '#64748b',
        borderBottom: '1px solid #e2e8f0',
        whiteSpace: 'nowrap',
    };
    const td = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };

    if (!rows?.length) {
        return (
            <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14, margin: 0 }}>
                {emptyMessage ?? 'No hay documentos listos para operación institucional.'}
            </p>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1280 }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>Alumno</th>
                        <th style={th}>CURP</th>
                        <th style={th}>Matrícula</th>
                        <th style={th}>CCT</th>
                        <th style={th}>Tipo documental</th>
                        <th style={th}>Subsistema</th>
                        <th style={th}>Etapa institucional</th>
                        <th style={th}>Siguiente acción</th>
                        <th style={th}>Último movimiento</th>
                        <th style={th}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const wr = row.workflowResumen ?? row.raw?.workflow_resumen ?? {};
                        const bandejaRow = {
                            id: row.id,
                            workflow_resumen: wr,
                            ultimo_movimiento: row.raw?.ultimo_movimiento,
                            updated_at: row.raw?.updated_at,
                        };

                        return (
                            <tr key={row.id} style={{ opacity: busyId === row.id ? 0.5 : 1 }}>
                                <td style={td}>{row.nombre}</td>
                                <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{row.curp}</td>
                                <td style={td}>{row.matricula}</td>
                                <td style={td}>{row.cct}</td>
                                <td style={td}>{row.tipoCertificado}</td>
                                <td style={td}>{row.subsistema ?? 'UPN'}</td>
                                <td style={td}>
                                    <CertificacionWorkflowBadge
                                        etapa={wr.etapa}
                                        label={row.etapaLabel ?? wr.etapa_label}
                                    />
                                </td>
                                <td style={{ ...td, color: '#64748b', fontSize: 12 }}>
                                    {row.siguienteAccion ?? wr.siguiente_accion_principal?.label ?? '—'}
                                </td>
                                <td style={{ ...td, fontSize: 12, color: '#64748b' }}>
                                    {fmtUltimoMovimiento(bandejaRow)}
                                </td>
                                <td style={td}>
                                    <InstitutionalBandejaActions
                                        row={bandejaRow}
                                        busy={busyId === row.id}
                                        onAccion={onAccion ? (a) => onAccion(a, row) : undefined}
                                    />
                                    {row.tieneIncidencia ? (
                                        <Link
                                            to={uxLinkIncidenciaTecnica(row.id)}
                                            style={{ ...esTheme.linkAccent, marginLeft: 6 }}
                                        >
                                            Ver incidencia
                                        </Link>
                                    ) : null}
                                    <Link
                                        to={upnCertificacionDetallePath(row.id)}
                                        style={{ ...esTheme.linkAccent, marginLeft: 6 }}
                                    >
                                        Expediente
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

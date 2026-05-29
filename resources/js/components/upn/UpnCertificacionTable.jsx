import { Link } from 'react-router-dom';
import { esTheme } from '../educacionSuperior';
import { upnCertificacionDetallePath } from '../../utils/upnCertificacion';
import { upnCan } from '../../utils/upnCertificacionPermissions';
import { UpnCertificateStatusBadge } from './UpnCertificateStatusBadge';

function ActionBtn({ children, onClick, title, variant = 'ghost' }) {
    const styles =
        variant === 'primary'
            ? esTheme.btnPrimary
            : variant === 'danger'
              ? { ...esTheme.btnSecondary, color: '#DC2626', borderColor: '#FECACA' }
              : { ...esTheme.linkAccent, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: 12 };

    return (
        <button type="button" title={title} style={styles} onClick={onClick}>
            {children}
        </button>
    );
}

export function UpnCertificacionTable({
    rows,
    onAprobar,
    onRechazar,
    onProcesar,
    onFirmar,
    onVerError,
    onEnviarSistemas,
    busyId,
}) {
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

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>Alumno</th>
                        <th style={th}>CURP</th>
                        <th style={th}>CCT</th>
                        <th style={th}>Programa</th>
                        <th style={th}>Folio</th>
                        <th style={th}>Procesamiento</th>
                        <th style={th}>Firma</th>
                        <th style={th}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} style={{ opacity: busyId === row.id ? 0.5 : 1 }}>
                            <td style={td}>{row.nombre}</td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{row.curp}</td>
                            <td style={td}>{row.cct}</td>
                            <td style={td}>{row.carrera}</td>
                            <td style={td}>{row.folio}</td>
                            <td style={td}>
                                <UpnCertificateStatusBadge estatus={row.estadoProcesamiento ?? row.estatus} />
                            </td>
                            <td style={td}>
                                <UpnCertificateStatusBadge estatus={row.estadoFirma ?? { label: '—', badge: 'gray' }} />
                            </td>
                            <td style={td}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                    <Link to={upnCertificacionDetallePath(row.id)} style={esTheme.linkAccent}>
                                        Revisar
                                    </Link>
                                    {upnCan('aprobar') && row.estatus?.key === 'pendiente' ? (
                                        <ActionBtn title="Aprobar" variant="primary" onClick={() => onAprobar?.(row)}>
                                            Aprobar
                                        </ActionBtn>
                                    ) : null}
                                    {upnCan('procesar') && row.puedeProcesar ? (
                                        <ActionBtn title="Procesar certificación" variant="primary" onClick={() => onProcesar?.(row)}>
                                            Procesar
                                        </ActionBtn>
                                    ) : null}
                                    {upnCan('firmar') && row.puedeFirmar ? (
                                        <ActionBtn title="Firmar" onClick={() => onFirmar?.(row)}>
                                            Firmar
                                        </ActionBtn>
                                    ) : null}
                                    {row.tieneIncidencia && upnCan('enviarIncidenciaSistemas') ? (
                                        <>
                                            <ActionBtn title="Ver error técnico" onClick={() => onVerError?.(row)}>
                                                Error
                                            </ActionBtn>
                                            <ActionBtn title="Incidencia técnica" onClick={() => onEnviarSistemas?.(row)}>
                                                Sistemas
                                            </ActionBtn>
                                        </>
                                    ) : null}
                                    {row.estadoFirma?.label === 'Firmado' && upnCan('obtenerResultadoFinal') ? (
                                        <Link to={`/app/documentos/${row.id}`}>PDF final</Link>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

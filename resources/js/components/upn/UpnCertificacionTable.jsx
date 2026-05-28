import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { esTheme } from '../educacionSuperior';
import { formatFechaMx } from '../../utils/upnCertificacion';
import { upnCan, upnCanProcesoTecnico } from '../../utils/upnCertificacionPermissions';
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

export function UpnCertificacionTable({ rows, onAprobar, onRechazar, onLiberar, busyId }) {
    const navigate = useNavigate();
    const [menuId, setMenuId] = useState(null);

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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>#</th>
                        <th style={th}>Nombre</th>
                        <th style={th}>CURP</th>
                        <th style={th}>CCT</th>
                        <th style={th}>Folio</th>
                        <th style={th}>Carrera</th>
                        <th style={th}>Tipo certificado</th>
                        <th style={th}>Promedio</th>
                        <th style={th}>Fecha expedición</th>
                        <th style={th}>Estatus</th>
                        <th style={th}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} style={{ opacity: busyId === row.id ? 0.5 : 1 }}>
                            <td style={td}>{row.indice}</td>
                            <td style={td}>{row.nombre}</td>
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{row.curp}</td>
                            <td style={td}>{row.cct}</td>
                            <td style={td}>{row.folio}</td>
                            <td style={td}>{row.carrera}</td>
                            <td style={td}>{row.tipoCertificado}</td>
                            <td style={td}>{row.promedio}</td>
                            <td style={td}>{formatFechaMx(row.fechaExpedicion)}</td>
                            <td style={td}>
                                <UpnCertificateStatusBadge estatus={row.estatus} />
                            </td>
                            <td style={td}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                    {row.alumnoId && upnCan('expediente') ? (
                                        <Link
                                            to={`/app/alumnos/${row.alumnoId}/expediente`}
                                            style={esTheme.linkAccent}
                                        >
                                            Expediente
                                        </Link>
                                    ) : null}
                                    <Link
                                        to={`/app/educacion-superior/upn/certificacion/${row.id}`}
                                        style={esTheme.linkAccent}
                                    >
                                        Revisar
                                    </Link>
                                    {upnCan('aprobar') && row.estatus?.key === 'pendiente' ? (
                                        <ActionBtn
                                            title="Aprobar"
                                            variant="primary"
                                            onClick={() => onAprobar?.(row)}
                                        >
                                            Aprobar
                                        </ActionBtn>
                                    ) : null}
                                    {upnCan('observar') ? (
                                        <ActionBtn title="Observar" onClick={() => navigate(`/app/educacion-superior/upn/certificacion/${row.id}#observaciones`)}>
                                            Observar
                                        </ActionBtn>
                                    ) : null}
                                    {upnCan('rechazar') && ['pendiente', 'aprobado'].includes(row.estatus?.key) ? (
                                        <ActionBtn title="Rechazar" variant="danger" onClick={() => onRechazar?.(row)}>
                                            Rechazar
                                        </ActionBtn>
                                    ) : null}
                                    <ActionBtn title="Más acciones" onClick={() => setMenuId(menuId === row.id ? null : row.id)}>
                                        ⋮
                                    </ActionBtn>
                                </div>
                                {menuId === row.id ? (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            padding: 8,
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            display: 'grid',
                                            gap: 6,
                                            fontSize: 12,
                                        }}
                                    >
                                        <Link to={`/app/documentos/${row.id}`}>Ver documento</Link>
                                        {upnCan('pdf') ? (
                                            <Link to={`/app/documentos/${row.id}`}>Ver PDF (estado)</Link>
                                        ) : null}
                                        {upnCan('liberar') && row.estatus?.key === 'aprobado' ? (
                                            <button
                                                type="button"
                                                style={esTheme.linkAccent}
                                                onClick={() => {
                                                    setMenuId(null);
                                                    onLiberar?.(row);
                                                }}
                                            >
                                                Liberar a proceso técnico
                                            </button>
                                        ) : null}
                                        {upnCanProcesoTecnico() ? (
                                            <Link to={`/app/sistemas/proceso-tecnico-certificacion/${row.id}`}>
                                                Proceso técnico (Sistemas)
                                            </Link>
                                        ) : null}
                                        <Link to={`/app/educacion-superior/upn/certificacion/${row.id}#sep`}>
                                            Estado SEP/SICES
                                        </Link>
                                    </div>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

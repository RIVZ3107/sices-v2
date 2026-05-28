import { Link } from 'react-router-dom';
import { EmptyState } from '../EmptyState';
import { LoadingState } from '../LoadingState';
import { certColors } from './certTheme';
import { CertificacionWorkflowBadge } from './CertificacionStatusBadge';
import { alumnoNombre } from './certTheme';

export function CertificacionTable({
    rows = [],
    loading = false,
    error = '',
    columns,
    renderActions,
    emptyMessage = 'No hay registros con los filtros actuales.',
}) {
    if (loading && rows === null) {
        return <LoadingState text="Cargando documentos…" />;
    }

    if (error) {
        return (
            <div style={{ padding: 16, color: certColors.danger, fontSize: 13, background: '#FEF2F2', borderRadius: 10 }}>
                {error}
            </div>
        );
    }

    const data = Array.isArray(rows) ? rows : [];

    if (data.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    const cols = columns ?? [
        { key: 'folio', label: 'Folio', render: (r) => r.folio_interno ?? `#${r.id}` },
        { key: 'alumno', label: 'Alumno', render: (r) => alumnoNombre(r) },
        { key: 'tipo', label: 'Tipo', render: (r) => `${r.tipo_documento ?? '—'} · ${r.tipo_certificacion ?? ''}` },
        { key: 'estatus', label: 'Estatus', render: (r) => <CertificacionWorkflowBadge workflow={r.estado_workflow} estadoFirma={r.estado_firma} /> },
    ];

    return (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, border: `1px solid ${certColors.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        {cols.map((c) => (
                            <th
                                key={c.key}
                                style={{
                                    textAlign: 'left',
                                    padding: '12px 14px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: certColors.muted,
                                    background: '#F8FAFC',
                                    borderBottom: `1px solid ${certColors.border}`,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {c.label}
                            </th>
                        ))}
                        {renderActions ? (
                            <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 600, color: certColors.muted, background: '#F8FAFC', borderBottom: `1px solid ${certColors.border}` }}>
                                Acciones
                            </th>
                        ) : null}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id} style={{ borderBottom: `1px solid ${certColors.rowBorder}` }}>
                            {cols.map((c) => (
                                <td key={c.key} style={{ padding: '14px', verticalAlign: 'middle', color: certColors.text }}>
                                    {c.render(row)}
                                </td>
                            ))}
                            {renderActions ? (
                                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>{renderActions(row)}</td>
                            ) : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function CertTableLink({ to, children }) {
    return (
        <Link to={to} style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginRight: 10 }}>
            {children}
        </Link>
    );
}

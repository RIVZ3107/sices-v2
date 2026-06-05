import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';
import { EsStatusBadge, esColors } from '../educacionSuperior';

export function catalogoCellValue(row, col) {
    const raw = row[col.key];
    if (col.type === 'boolean') {
        return raw ? 'Sí' : 'No';
    }
    if (raw === null || raw === undefined || raw === '') {
        return '—';
    }
    if (typeof raw === 'string') {
        return sanitizeInstitutionalLabel(raw, '—');
    }
    return raw;
}

export function TrazabilidadBadge() {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 600,
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #E2E8F0',
                whiteSpace: 'nowrap',
            }}
        >
            Trazabilidad disponible
        </span>
    );
}

export function InformacionTecnicaPanel({ row }) {
    const metadata = row.informacion_tecnica;
    if (!metadata || Object.keys(metadata).length === 0) {
        return null;
    }

    return (
        <details style={{ marginTop: 6 }}>
            <summary style={{ cursor: 'pointer', fontSize: 11, color: esColors.muted, fontWeight: 600 }}>
                Información técnica
                {row.trazabilidad_disponible ? (
                    <span style={{ marginLeft: 8 }}>
                        <TrazabilidadBadge />
                    </span>
                ) : null}
            </summary>
            <pre
                style={{
                    margin: '8px 0 0',
                    padding: 10,
                    background: '#F8FAFC',
                    borderRadius: 8,
                    fontSize: 10,
                    overflow: 'auto',
                    maxHeight: 160,
                    border: `1px solid ${esColors.border}`,
                }}
            >
                {JSON.stringify(metadata, null, 2)}
            </pre>
        </details>
    );
}

export function renderCatalogoCell(row, col) {
    if (col.type === 'badge') {
        return <EsStatusBadge status={row[col.key]}>{row[col.key] ?? '—'}</EsStatusBadge>;
    }
    return catalogoCellValue(row, col);
}

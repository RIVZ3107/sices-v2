import { Link } from 'react-router-dom';
import { severidadItem } from '../../utils/solicitudDocumentalUx';

const STYLES = {
    ok: { border: '#bbf7d0', bg: '#f0fdf4', badge: '#166534', badgeText: 'Completo' },
    warning: { border: '#fde68a', bg: '#fffbeb', badge: '#92400e', badgeText: 'Atención' },
    blocking: { border: '#fecaca', bg: '#fef2f2', badge: '#991b1b', badgeText: 'Requerido' },
};

/**
 * @param {{ items: Array<{ key: string, label: string, ok: boolean, blocking?: boolean, hint?: string, where?: string, whereLabel?: string }>, compact?: boolean }} props
 */
export function SolicitudChecklistInstitucional({ items, compact = false }) {
    return (
        <ul
            className="grid gap-2"
            style={{ margin: 0, padding: 0, listStyle: 'none', gap: compact ? 6 : 10 }}
        >
            {items.map((item) => {
                const sev = severidadItem(item);
                const st = STYLES[sev];
                return (
                    <li
                        key={item.key}
                        style={{
                            padding: compact ? '8px 10px' : '10px 12px',
                            borderRadius: 8,
                            border: `1px solid ${st.border}`,
                            background: st.bg,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: st.badge, flexShrink: 0 }}>
                                {st.badgeText}
                            </span>
                            <span style={{ fontSize: 13, color: '#0f172a', flex: 1 }}>{item.label}</span>
                        </div>
                        {!item.ok && item.hint ? (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{item.hint}</p>
                        ) : null}
                        {!item.ok && item.where && sev !== 'ok' ? (
                            <Link
                                to={item.where}
                                style={{
                                    display: 'inline-block',
                                    marginTop: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#185FA5',
                                }}
                            >
                                {item.whereLabel ?? 'Ir a corregir'}
                            </Link>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}

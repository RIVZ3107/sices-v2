import { Link } from 'react-router-dom';

/**
 * Checklist institucional en lenguaje operativo (sin términos técnicos).
 *
 * @param {{ items: Array<{ key: string, label: string, ok: boolean, hint?: string, where?: string, whereLabel?: string }> }} props
 */
export function SolicitudChecklistInstitucional({ items }) {
    return (
        <ul className="grid gap-3" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((item) => (
                <li
                    key={item.key}
                    style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: `1px solid ${item.ok ? '#bbf7d0' : '#fde68a'}`,
                        background: item.ok ? '#f0fdf4' : '#fffbeb',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: item.ok ? '#166534' : '#92400e',
                            }}
                        >
                            {item.ok ? '✓ Listo' : '○ Pendiente por corregir'}
                        </span>
                        <span style={{ fontSize: 14, color: '#0f172a' }}>{item.label}</span>
                    </div>
                    {!item.ok && item.hint ? (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>{item.hint}</p>
                    ) : null}
                    {!item.ok && item.where ? (
                        <Link
                            to={item.where}
                            style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 600, color: '#185FA5' }}
                        >
                            {item.whereLabel ?? 'Ir a corregir'}
                        </Link>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}

/**
 * Empty state institucional (sin errores agresivos).
 */
export function InstitutionalEmptyState({ title, description, action }) {
    return (
        <div
            style={{
                padding: '32px 24px',
                textAlign: 'center',
                borderRadius: 12,
                border: '1px dashed #cbd5e1',
                background: '#f8fafc',
            }}
        >
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#334155' }}>{title}</p>
            {description ? (
                <p style={{ margin: '8px auto 0', fontSize: 13, color: '#64748b', maxWidth: 480, lineHeight: 1.5 }}>
                    {description}
                </p>
            ) : null}
            {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
        </div>
    );
}

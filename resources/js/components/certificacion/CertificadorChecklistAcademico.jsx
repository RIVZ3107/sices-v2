import { checklistAcademicoCertificador } from '../../utils/certificadorUx';

export function CertificadorChecklistAcademico({ data }) {
    const items = checklistAcademicoCertificador(data);
    const completas = items.filter((i) => i.ok).length;

    return (
        <div
            style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff',
            }}
        >
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                Checklist académico ({completas} de {items.length})
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {items.map((item) => (
                    <li
                        key={item.key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            padding: '6px 8px',
                            borderRadius: 6,
                            background: item.ok ? '#f0fdf4' : '#fffbeb',
                            color: item.ok ? '#166534' : '#92400e',
                        }}
                    >
                        <span aria-hidden>{item.ok ? '✓' : '○'}</span>
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

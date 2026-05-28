import { certColors, certTheme } from './certTheme';

export function CertificacionPageHeader({ title, subtitle, actions, breadcrumb = 'Certificación' }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: certColors.muted }}>
                    {breadcrumb}
                </p>
                <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: certColors.text }}>{title}</h1>
                {subtitle ? <p style={{ margin: '6px 0 0', fontSize: 14, color: certColors.muted, maxWidth: 720 }}>{subtitle}</p> : null}
            </div>
            {actions ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{actions}</div>
            ) : null}
        </div>
    );
}

export function CertificacionPlaceholder({ title, detail, type = 'info' }) {
    const bg = type === 'warn' ? '#FFFBEB' : '#F8FAFC';
    const border = type === 'warn' ? '#FDE68A' : certColors.border;
    return (
        <div style={{ ...certTheme.placeholder, background: bg, border: `1px dashed ${border}` }}>
            {title ? <p style={{ margin: 0, fontWeight: 600, color: certColors.text }}>{title}</p> : null}
            {detail ? <p style={{ margin: title ? '8px 0 0' : 0, fontSize: 13 }}>{detail}</p> : null}
        </div>
    );
}

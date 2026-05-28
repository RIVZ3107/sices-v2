import { Link } from 'react-router-dom';
import { certColors, certTheme, formatCertNum } from './certTheme';

export function CertificacionMetricCard({ title, value, icon, to, tone = 'primary', subtitle }) {
    const tones = {
        primary: { bg: '#EFF6FF', color: certColors.primary },
        success: { bg: '#ECFDF5', color: certColors.success },
        warn: { bg: '#FFFBEB', color: certColors.warn },
        danger: { bg: '#FEF2F2', color: certColors.danger },
    };
    const t = tones[tone] ?? tones.primary;

    const inner = (
        <div style={{ ...certTheme.card, padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {icon ? (
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: t.bg,
                        color: t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: certColors.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {title}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700, color: certColors.text, lineHeight: 1.1 }}>
                    {formatCertNum(value)}
                </p>
                {subtitle ? <p style={{ margin: '6px 0 0', fontSize: 12, color: certColors.muted }}>{subtitle}</p> : null}
                {to ? <p style={{ margin: '8px 0 0', fontSize: 12, ...certTheme.link }}>Ver detalle →</p> : null}
            </div>
        </div>
    );

    if (to) {
        return (
            <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
                {inner}
            </Link>
        );
    }

    return inner;
}

import { Link } from 'react-router-dom';
import { ceColors } from './ceTheme';
import { CeIcons } from './CeIcons';

export function CeQuickAction({ to, iconBg, iconColor, icon, label, sub }) {
    return (
        <Link
            to={to}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: `1px solid ${ceColors.rowBorder}`,
                textDecoration: 'none',
                color: 'inherit',
            }}
        >
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: ceColors.text, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: ceColors.muted, margin: '2px 0 0 0' }}>{sub}</p>
            </div>
            {CeIcons.chevronRight}
        </Link>
    );
}

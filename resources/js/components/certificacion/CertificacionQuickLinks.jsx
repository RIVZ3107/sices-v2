import { Link } from 'react-router-dom';
import { CERT_QUICK_LINKS } from '../../utils/certificacionNav';
import { userCanAny } from '../../utils/userPermissions';
import { CertIcons } from './CertIcons';
import { certColors, certTheme } from './certTheme';

/** Accesos rápidos horizontales (no sidebar). */
export function CertificacionQuickLinks() {
    const visible = CERT_QUICK_LINKS.filter((item) => userCanAny(item.permissions));

    if (!visible.length) {
        return null;
    }

    return (
        <div style={certTheme.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: certColors.text }}>
                Accesos rápidos
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {visible.map((item) => (
                    <Link
                        key={item.key}
                        to={item.to}
                        style={{
                            ...certTheme.btnSecondary,
                            textDecoration: 'none',
                            fontSize: 13,
                            padding: '8px 14px',
                        }}
                    >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {CertIcons[item.icon] ?? CertIcons.docs}
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

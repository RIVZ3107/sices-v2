import { uxBannerCopyForCurrentUser } from '../../utils/uxInstitucional';

/**
 * Aviso institucional breve según rol (sin detalles técnicos).
 */
export function InstitutionalRoleBanner({ message, type = 'info' }) {
    const text = message ?? uxBannerCopyForCurrentUser();
    const styles =
        type === 'warning'
            ? { background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400e' }
            : { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1e3a5f' };

    return (
        <div
            style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                ...styles,
            }}
        >
            {text}
        </div>
    );
}

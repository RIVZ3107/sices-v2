import { certColors, certTheme } from './certTheme';

export function CertificacionFilters({ children, onReset, onApply }) {
    return (
        <div style={{ ...certTheme.card, padding: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>{children}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${certColors.rowBorder}` }}>
                {onApply ? (
                    <button type="button" style={certTheme.btnPrimary} onClick={onApply}>
                        Aplicar filtros
                    </button>
                ) : null}
                {onReset ? (
                    <button type="button" style={certTheme.btnSecondary} onClick={onReset}>
                        Limpiar
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export function CertFilterField({ label, children, width = 180 }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: width, flex: '1 1 auto' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: certColors.muted, textTransform: 'uppercase' }}>{label}</span>
            {children}
        </label>
    );
}

export function certInputStyle() {
    return {
        width: '100%',
        padding: '8px 10px',
        fontSize: 13,
        border: `1px solid ${certColors.border}`,
        borderRadius: 8,
        background: '#fff',
    };
}

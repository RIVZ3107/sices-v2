import { esColors, esTheme } from '../educacionSuperior';

export function CatalogoEmptyState({ title = 'Sin resultados', message = 'No se encontraron registros con los filtros seleccionados.', action = null }) {
    return (
        <div style={{ ...esTheme.card, padding: '48px 24px', textAlign: 'center', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: esColors.text }}>{title}</p>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: esColors.muted }}>{message}</p>
            {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
        </div>
    );
}

export function CatalogoDetailPanel({ title = 'Detalle', children, actions = null, onClose = null }) {
    if (!children) {
        return null;
    }

    return (
        <div style={{ ...esTheme.card, padding: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: esColors.text }}>{title}</h3>
                {onClose ? (
                    <button type="button" onClick={onClose} style={esTheme.btnSecondary}>
                        Cerrar
                    </button>
                ) : null}
            </div>
            <div style={{ fontSize: 13, color: esColors.muted, lineHeight: 1.6 }}>{children}</div>
            {actions ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>{actions}</div>
            ) : null}
        </div>
    );
}

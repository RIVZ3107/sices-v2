import { esColors, esTheme } from '../educacionSuperior/esTheme';
import { EsIcons } from '../educacionSuperior';

export function UpnEmptyState({ onLimpiarFiltros }) {
    return (
        <div
            style={{
                padding: 48,
                textAlign: 'center',
                background: '#fff',
                borderRadius: 12,
                border: `1px solid ${esColors.border}`,
            }}
        >
            <div style={{ color: esColors.muted, marginBottom: 16 }}>{EsIcons.file}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: esColors.text }}>
                No hay certificados UPN para los filtros seleccionados.
            </h3>
            <p
                style={{
                    margin: '0 0 20px',
                    fontSize: 14,
                    color: esColors.muted,
                    maxWidth: 520,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            >
                Cuando existan certificados UPN enviados por las instituciones, aparecerán aquí para revisión y
                seguimiento.
            </p>
            {onLimpiarFiltros ? (
                <button type="button" style={esTheme.btnPrimary} onClick={onLimpiarFiltros}>
                    Limpiar filtros
                </button>
            ) : null}
        </div>
    );
}

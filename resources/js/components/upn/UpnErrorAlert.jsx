import { esTheme } from '../educacionSuperior/esTheme';

export function UpnErrorAlert({ message, onReintentar }) {
    return (
        <div
            role="alert"
            style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#991B1B',
            }}
        >
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
                {message ?? 'No se pudo cargar la certificación UPN.'}
            </p>
            {onReintentar ? (
                <button type="button" style={esTheme.btnPrimary} onClick={onReintentar}>
                    Reintentar
                </button>
            ) : null}
        </div>
    );
}

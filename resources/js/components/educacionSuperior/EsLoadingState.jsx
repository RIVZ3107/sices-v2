export function EsLoadingState({ text = 'Cargando...' }) {
    return (
        <div className="es-loading-card" role="status" aria-live="polite">
            <div className="es-loading-spinner" aria-hidden />
            <p className="es-loading-text">{text}</p>
        </div>
    );
}

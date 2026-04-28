export function LoadingState({ text = 'Cargando...' }) {
    return (
        <div className="inst-surface p-6 text-sm text-[var(--inst-muted)]">
            {text}
        </div>
    );
}

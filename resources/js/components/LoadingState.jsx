export function LoadingState({ text = 'Cargando...' }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {text}
        </div>
    );
}

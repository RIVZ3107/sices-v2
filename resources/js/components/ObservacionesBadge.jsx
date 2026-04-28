export function ObservacionesBadge({ pendientes = 0, total = 0 }) {
    const cls = pendientes > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
    return (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>
            Obs {pendientes}/{total}
        </span>
    );
}

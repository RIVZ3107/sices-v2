export function ObservacionesBadge({ pendientes = 0, total = 0 }) {
    const cls = pendientes > 0 ? 'inst-badge-danger' : total > 0 ? 'inst-badge-success' : 'inst-badge-neutral';
    return (
        <span className={`inst-badge ${cls}`}>
            Obs {pendientes}/{total}
        </span>
    );
}

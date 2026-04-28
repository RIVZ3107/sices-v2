const COLOR_BY_STATE = {
    borrador: 'inst-badge-neutral',
    pendiente: 'inst-badge-warning',
    en_revision: 'inst-badge-info',
    aprobado: 'inst-badge-success',
    rechazado: 'inst-badge-danger',
    cancelado: 'inst-badge-neutral',
    firmado: 'inst-badge-info',
};

export function EstadoBadge({ estado }) {
    const cls = COLOR_BY_STATE[estado] ?? 'inst-badge-neutral';
    return <span className={`inst-badge ${cls}`}>{estado ?? 'n/a'}</span>;
}

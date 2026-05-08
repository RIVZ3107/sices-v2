const COLOR_BY_STATE = {
    borrador: 'inst-badge-neutral',
    listo: 'inst-badge-success',
    pendiente: 'inst-badge-warning',
    en_revision: 'inst-badge-info',
    aprobado: 'inst-badge-success',
    validado: 'inst-badge-success',
    bloqueado: 'inst-badge-danger',
    con_observaciones: 'inst-badge-warning',
    rechazado: 'inst-badge-danger',
    cancelado: 'inst-badge-neutral',
    firmado: 'inst-badge-info',
};

export function EstadoBadge({ estado }) {
    const key = String(estado ?? '').toLowerCase();
    const cls = COLOR_BY_STATE[key] ?? 'inst-badge-neutral';
    const label =
        {
            borrador: 'Pendiente',
            listo: 'Listo',
            pendiente: 'Pendiente',
            en_revision: 'En revisión',
            aprobado: 'Validado',
            validado: 'Validado',
            bloqueado: 'Bloqueado',
            con_observaciones: 'Con observaciones',
            rechazado: 'Bloqueado',
            cancelado: 'Cancelado',
            firmado: 'Validado',
        }[key] ?? (estado ?? 'N/D');
    return <span className={`inst-badge ${cls}`}>{label}</span>;
}

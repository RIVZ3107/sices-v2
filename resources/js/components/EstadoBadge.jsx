const COLOR_BY_STATE = {
    borrador: 'bg-slate-100 text-slate-700',
    pendiente: 'bg-amber-100 text-amber-800',
    en_revision: 'bg-blue-100 text-blue-800',
    aprobado: 'bg-emerald-100 text-emerald-800',
    rechazado: 'bg-rose-100 text-rose-800',
    cancelado: 'bg-slate-200 text-slate-700',
    firmado: 'bg-indigo-100 text-indigo-800',
};

export function EstadoBadge({ estado }) {
    const cls = COLOR_BY_STATE[estado] ?? 'bg-slate-100 text-slate-700';
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{estado ?? 'n/a'}</span>;
}

export function LockedField({ label, value, reason = 'Proviene del plan de estudios o de la carga académica.' }) {
    return (
        <div className="grid gap-0.5 opacity-95">
            <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                {label}
                <span className="rounded-full bg-emerald-100 px-2 py-[1px] text-[10px] font-semibold lowercase normal-case tracking-normal text-emerald-800">
                    catálogo
                </span>
            </span>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900">
                {value === null || value === undefined || value === '' ? '—' : value}
            </div>
            <p className="text-[11px] text-emerald-800/90">{reason}</p>
        </div>
    );
}

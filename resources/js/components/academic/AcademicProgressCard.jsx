export function AcademicProgressCard({ titulo = 'Avance frente al plan', partes }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {partes?.map(({ label, value, hint }) => (
                    <div key={label} className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
                        <p className="text-[11px] text-slate-500">{label}</p>
                        <p className="text-lg font-semibold text-slate-900">{value ?? '—'}</p>
                        {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

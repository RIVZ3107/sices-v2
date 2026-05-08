export function ReadOnlyField({ label, value, helperText = '' }) {
    return (
        <div className="grid gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
            <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {value === null || value === undefined || value === '' ? '—' : value}
            </div>
            {helperText ? <p className="text-[11px] text-slate-500">{helperText}</p> : null}
        </div>
    );
}

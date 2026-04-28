export function SelectField({ label, value, onChange, options = [], error = '', disabled = false }) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--inst-muted-2)]">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="inst-select text-sm disabled:bg-slate-100"
            >
                <option value="">Selecciona...</option>
                {options.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error ? <span className="text-xs text-rose-700">{error}</span> : null}
        </label>
    );
}

export function FormField({
    label,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    error = '',
    required = false,
    disabled = false,
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-slate-600">
                {label} {required ? <span className="text-rose-600">*</span> : null}
            </span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
            {error ? <span className="text-xs text-rose-700">{error}</span> : null}
        </label>
    );
}

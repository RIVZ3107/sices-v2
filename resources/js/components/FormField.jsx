export function FormField({
    label,
    value,
    onChange,
    placeholder = '',
    type = 'text',
    error = '',
    required = false,
    disabled = false,
    autoComplete,
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--inst-muted-2)]">
                {label} {required ? <span className="text-rose-600">*</span> : null}
            </span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                className="inst-input text-sm disabled:bg-slate-100"
            />
            {error ? <span className="text-xs text-rose-700">{error}</span> : null}
        </label>
    );
}

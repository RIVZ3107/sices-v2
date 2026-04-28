export function Timeline({ steps = [], current = '' }) {
    return (
        <ol className="grid gap-2 md:grid-cols-6">
            {steps.map((step) => {
                const active = step.key === current;
                const done = Boolean(step.done);
                const cls = active
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500';

                return (
                    <li key={step.key} className={`rounded-lg border px-3 py-2 text-xs ${cls}`}>
                        {step.label}
                    </li>
                );
            })}
        </ol>
    );
}

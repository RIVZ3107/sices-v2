export function Stepper({ steps = [], currentStep = 0 }) {
    return (
        <ol className="grid gap-2 md:grid-cols-4">
            {steps.map((label, idx) => {
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;
                return (
                    <li
                        key={label}
                        className={`rounded-lg border px-3 py-2 text-xs ${
                            isActive
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : isDone
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-500'
                        }`}
                    >
                        {idx + 1}. {label}
                    </li>
                );
            })}
        </ol>
    );
}

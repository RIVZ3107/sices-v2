import { AlertBox } from '../ui/AlertBox';

export function ValidationSummary({ title = 'Resumen de validación', ok = false, errores = [], advertencias = [] }) {
    const errs = Array.isArray(errores) ? errores.filter(Boolean) : [];
    const adv = Array.isArray(advertencias) ? advertencias.filter(Boolean) : [];
    return (
        <div className="grid gap-2">
            {title ? (
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
            ) : null}
            {errs.length === 0 && adv.length === 0 ? (
                <AlertBox type="success" message={ok ? 'Sin bloqueos reportados para este paso.' : 'No hay mensajes pendientes.'} />
            ) : null}
            {errs.length ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <p className="font-medium">Corríjalo antes de continuar:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {errs.map((e, i) => (
                            <li key={`e-${i}`}>{e}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {adv.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Advertencias</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {adv.map((a, i) => (
                            <li key={`a-${i}`}>{a}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

import { Stepper } from '../ui/Stepper';
import { ValidationSummary } from './ValidationSummary';

/**
 * Wrapper de flujo guiado: pasos horizontales + bloque opcional de validación por debajo del título del paso.
 */
export function StepWizard({
    steps = [],
    currentStep = 0,
    children,
    errors = [],
    warnings = [],
    stepSubtitle = '',
}) {
    const safe = Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0));
    return (
        <div className="grid gap-4">
            <Stepper steps={steps} currentStep={safe} />
            {stepSubtitle ? <p className="text-xs text-slate-600">{stepSubtitle}</p> : null}
            {errors?.length || warnings?.length ? (
                <ValidationSummary ok={errors.length === 0} errores={errors} advertencias={warnings} title="" />
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
        </div>
    );
}

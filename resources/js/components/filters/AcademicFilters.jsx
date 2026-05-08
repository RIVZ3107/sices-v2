import { FormField } from '../FormField';

/**
 * Filtros academicos reutilizables.
 * Oculta selectores cuando solo hay una opcion para reducir ruido visual.
 */
export function AcademicFilters({
    value = {},
    onChange,
    options = {},
    show = {},
}) {
    const set = (key, v) => onChange?.({ ...value, [key]: v });
    const opt = (k) => (Array.isArray(options[k]) ? options[k] : []);
    const visible = (k) => (show[k] ?? true) && opt(k).length !== 1;

    return (
        <section className="grid gap-3 md:grid-cols-4">
            {visible('subsistema') ? (
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Subsistema</span>
                    <select className="inst-input text-sm" value={value.subsistema ?? ''} onChange={(e) => set('subsistema', e.target.value)}>
                        <option value="">Todos</option>
                        {opt('subsistema').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
            ) : null}
            {visible('institucion') ? (
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Institución</span>
                    <select className="inst-input text-sm" value={value.institucion ?? ''} onChange={(e) => set('institucion', e.target.value)}>
                        <option value="">Todas</option>
                        {opt('institucion').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
            ) : null}
            {visible('ciclo') ? (
                <label className="grid gap-1">
                    <span className="text-xs font-medium text-slate-600">Ciclo escolar</span>
                    <select className="inst-input text-sm" value={value.ciclo ?? ''} onChange={(e) => set('ciclo', e.target.value)}>
                        <option value="">Todos</option>
                        {opt('ciclo').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
            ) : null}
            {show.estadoDocumento !== false ? (
                <FormField label="Estado documento" value={value.estadoDocumento ?? ''} onChange={(v) => set('estadoDocumento', v)} placeholder="Ej. En revisión" />
            ) : null}
        </section>
    );
}


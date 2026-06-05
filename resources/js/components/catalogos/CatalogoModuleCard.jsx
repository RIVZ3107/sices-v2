import { Link } from 'react-router-dom';
import { formatEsNum } from '../educacionSuperior';

export function CatalogoModuleCard({
    title,
    description,
    to,
    metric,
    metricLabel,
    status = 'Disponible',
    icon = null,
}) {
    const hasMetric = metric != null && metric !== '' && metricLabel;

    return (
        <Link
            to={to}
            className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
            <div className="flex items-start justify-between gap-3">
                {icon ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition group-hover:bg-blue-100">
                        {icon}
                    </div>
                ) : null}
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {status}
                </span>
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-blue-800">
                {title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {description}
            </p>

            {hasMetric ? (
                <p className="mt-4 text-sm text-slate-700">
                    <span className="text-xl font-bold text-slate-900">{formatEsNum(metric)}</span>
                    {' '}
                    <span className="text-slate-500">{metricLabel}</span>
                </p>
            ) : null}

            <p className="mt-4 text-xs font-medium text-blue-700 group-hover:underline">
                Abrir módulo →
            </p>
        </Link>
    );
}

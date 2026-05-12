import { Link } from 'react-router-dom';
import { useDashboardResumen } from './useDashboardResumen';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';

export function AlumnoEgresadoDashboardPage() {
    const { resumen, error, extras } = useDashboardResumen();
    const loading = resumen === null && !error;

    if (loading) {
        return <LoadingState text="Cargando tu panel..." />;
    }

    const cards = extras?.cards ?? [];

    return (
        <section className="grid gap-4">
            <PageHeader title="Mi panel" subtitle="Expediente, calificaciones, kardex y trámites propios." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Vista personal: no se muestran datos de otros alumnos ni información técnica del sistema.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                {cards.map((c) => (
                    <article key={c.key} className="inst-surface p-4">
                        <p className="text-sm text-slate-600">{c.title}</p>
                        <p className="text-2xl font-semibold mt-1">{c.value}</p>
                        <Link to={c.href} className="inst-btn inst-btn-secondary text-xs mt-3 inline-block">
                            Ir
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

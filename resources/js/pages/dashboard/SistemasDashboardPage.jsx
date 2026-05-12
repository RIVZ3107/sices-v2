import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../api/dashboard';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';

export function SistemasDashboardPage() {
    const [payload, setPayload] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard()
            .then((body) => {
                setPayload(body?.data?.payload ?? null);
                setError('');
            })
            .catch((e) => {
                setPayload(null);
                setError(e?.message ?? 'Error al cargar el panel técnico.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState text="Cargando panel técnico..." />;
    }
    if (error && !payload) {
        return (
            <section className="grid gap-4">
                <PageHeader title="Panel de Sistemas" subtitle="Monitoreo técnico sin operación académica normativa." />
                <ErrorState message={error} />
            </section>
        );
    }

    const cards = Array.isArray(payload?.cards) ? payload.cards : [];
    const notas = Array.isArray(payload?.notas) ? payload.notas : [];

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Panel de Sistemas"
                subtitle="Colas, incidencias técnicas, integraciones y menús. No incluye asignación de matrícula ni captura de calificaciones."
            />
            {notas.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {notas.map((n) => (
                        <p key={n}>{n}</p>
                    ))}
                </div>
            ) : null}
            {error ? <ErrorState message={error} /> : null}
            <div className="grid gap-3 md:grid-cols-3">
                {cards.map((c) => (
                    <article key={c.key} className="inst-surface p-4">
                        <p className="text-xs uppercase text-slate-500">{c.title}</p>
                        <p className="text-3xl font-semibold text-slate-900 mt-1">{c.value}</p>
                        <Link to={c.href} className="inst-btn inst-btn-secondary text-xs mt-3 inline-block">
                            Ver
                        </Link>
                    </article>
                ))}
            </div>
            <div className="inst-surface p-4">
                <h3 className="font-semibold text-slate-900">Telemetría simulada (dataset)</h3>
                {Array.isArray(payload?.telemetria_visual?.recientes) && payload.telemetria_visual.recientes.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {payload.telemetria_visual.recientes.map((e) => (
                            <li key={e.id} className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{e.bucket}</span>
                                <span className="text-xs text-slate-500">{e.estado}</span>
                                <span>{e.summary}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-slate-500">Sin eventos de dataset; ejecute `php artisan sices:seed-dataset-visual-roles` en local.</p>
                )}
            </div>
            <div className="inst-surface p-4">
                <h3 className="font-semibold text-slate-900">Acciones técnicas</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                    <Link to="/app/sistemas/logs" className="inst-btn inst-btn-secondary text-sm">
                        Ver logs
                    </Link>
                    <Link to="/app/sistemas/dashboard" className="inst-btn inst-btn-secondary text-sm">
                        Estado de colas
                    </Link>
                    <Link to="/app/admin/menus" className="inst-btn inst-btn-primary text-sm">
                        Menús por rol
                    </Link>
                    <Link to="/app/sistemas/configuracion" className="inst-btn inst-btn-secondary text-sm">
                        Configuración / integraciones
                    </Link>
                </div>
            </div>
        </section>
    );
}

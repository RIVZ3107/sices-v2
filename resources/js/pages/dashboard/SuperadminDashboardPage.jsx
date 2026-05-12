import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../api/dashboard';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';

export function SuperadminDashboardPage() {
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
                setError(e?.message ?? 'Error al cargar el panel.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState text="Cargando panel institucional..." />;
    }
    if (error && !payload) {
        return (
            <section className="grid gap-4">
                <PageHeader title="Panel superadministrador" subtitle="Visión global y soporte operativo." />
                <ErrorState message={error} />
            </section>
        );
    }

    const cards = Array.isArray(payload?.cards) ? payload.cards : [];

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Panel superadministrador"
                subtitle="Indicadores globales, documentos y accesos de administración. Sin duplicar flujos por subsistema."
            />
            {error ? <ErrorState message={error} /> : null}
            <div className="grid gap-3 md:grid-cols-3">
                {cards.map((c) => (
                    <article key={c.key} className="inst-surface p-4">
                        <p className="text-xs uppercase text-slate-500">{c.title}</p>
                        <p className="text-3xl font-semibold text-slate-900 mt-1">{c.value}</p>
                        <Link to={c.href} className="inst-btn inst-btn-secondary text-xs mt-3 inline-block">
                            Abrir
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

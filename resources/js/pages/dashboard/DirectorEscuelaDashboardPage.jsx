import { Link } from 'react-router-dom';
import { CeInstSurface, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import {
    DE_AVANCE_PROCESOS_REF,
    DE_DASHBOARD_MATRICULA_POR_PROGRAMA,
    DE_DASHBOARD_METRICAS_TRENDS,
    DE_DECISIONES_RECientes,
    DE_PENDIENTES_CRITICOS,
    DE_REPORTES_FRECUENTES,
    deBuildDonutGradient,
    deTotalMatriculaPrograma,
} from '../../data/direccionEscuelaDemoData';
import { useDashboardResumen } from './useDashboardResumen';

const DONUT_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#64748b', '#0891b2'];

function matriculaSegmentsFromApi(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return DE_DASHBOARD_MATRICULA_POR_PROGRAMA;
    }
    const total = rows.reduce((s, r) => s + (Number(r.matricula_activa) || 0), 0) || 1;
    return rows.map((r, i) => {
        const count = Number(r.matricula_activa) || 0;
        return {
            key: `p-${i}`,
            label: String(r.programa ?? 'Programa'),
            color: DONUT_COLORS[i % DONUT_COLORS.length],
            count,
            pct: Math.round((count / total) * 1000) / 10,
        };
    });
}

export function DirectorEscuelaDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();
    const data = fullPayload;
    const loading = fullPayload === null && !error;

    if (loading) {
        return <LoadingState text="Cargando Dashboard Dirección..." />;
    }

    if (error && data === null) {
        return (
            <section className="grid gap-4">
                <h1 className="text-lg font-bold text-slate-900">Dashboard Dirección</h1>
                <ErrorState message={error} />
            </section>
        );
    }

    const m = data?.metricas ?? {};
    const escuela = data?.contexto?.institucion ?? 'Institución en alcance (Normal / UPN)';
    const matProgRaw = Array.isArray(data?.matricula_por_programa) ? data.matricula_por_programa : [];
    const donutSegs = matriculaSegmentsFromApi(matProgRaw);
    const totalDonut = donutSegs.reduce((s, r) => s + r.count, 0) || deTotalMatriculaPrograma();

    const avanceApi = Array.isArray(data?.avance_procesos) ? data.avance_procesos : [];
    const avanceRows = DE_AVANCE_PROCESOS_REF.map((ref, i) => {
        const api = avanceApi[i];
        if (api && typeof api.avance === 'number') {
            return { ...ref, etiqueta: api.etiqueta ?? ref.etiqueta, avance: api.avance };
        }
        return ref;
    });

    const criticosStr = Array.isArray(data?.pendientes_criticos_sugeridos) ? data.pendientes_criticos_sugeridos : [];
    const criticosPanel = DE_PENDIENTES_CRITICOS.map((row, idx) => ({
        ...row,
        hint: criticosStr[idx] ?? null,
    }));

    const decisionesApi = Array.isArray(data?.decisiones_recientes_direccion) ? data.decisiones_recientes_direccion : [];
    const decisiones =
        decisionesApi.length > 0
            ? decisionesApi.map((d) => ({
                  fecha: d.fecha ?? '—',
                  tipo: d.tipo ?? '—',
                  asunto: d.asunto ?? '—',
                  descripcion: d.descripcion ?? '—',
                  autor: d.autor ?? 'Dirección',
                  estatus: d.estatus ?? 'En proceso',
              }))
            : DE_DECISIONES_RECientes;

    const reportesApi = Array.isArray(data?.reportes_frecuentes) ? data.reportes_frecuentes : [];
    const reportes = reportesApi.length > 0 ? reportesApi : DE_REPORTES_FRECUENTES;

    const metrics = DE_DASHBOARD_METRICAS_TRENDS.map((row) => ({
        title: row.title,
        value: (m[row.key] ?? 0).toLocaleString('es-MX'),
        trend: row.trend,
        tone: row.tone,
    }));

    return (
        <CeShell
            title="Dashboard Dirección"
            subtitle={escuela}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
            metrics={metrics}
        >
            {error ? <ErrorState message={error} /> : null}

            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Matrícula por programa">
                    <div className="ce-donut-wrap">
                        <div className="ce-donut" style={{ background: deBuildDonutGradient(donutSegs) }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total">{totalDonut.toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                        <div className="ce-legend">
                            {donutSegs.map((r) => (
                                <div key={r.key} className="ce-legend-row">
                                    <span>
                                        <span style={{ color: r.color }}>●</span> {r.label}
                                    </span>
                                    <span>
                                        {r.count.toLocaleString('es-MX')} ({r.pct}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/direccion/indicadores" className="ce-link-more">
                        Ver detalle de matrícula &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Avance de procesos">
                    <ul className="space-y-4">
                        {avanceRows.map((a) => (
                            <li key={a.clave}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-sm text-slate-800">
                                    <span>{a.etiqueta}</span>
                                    <span className="font-bold">{a.avance}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-sky-600" style={{ width: `${a.avance}%` }} />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    {a.hecho.toLocaleString('es-MX')} / {a.total.toLocaleString('es-MX')}
                                </p>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/direccion/autorizaciones-observaciones" className="ce-link-more">
                        Ver todos los procesos &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Pendientes críticos">
                    <ul className="space-y-2">
                        {criticosPanel.map((c) => (
                            <li key={c.label} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                                <span className="text-slate-700">{c.hint ?? c.label}</span>
                                <span className="flex items-center gap-2">
                                    <span className="font-bold text-red-600">{c.n}</span>
                                    <Link to={c.to} className="text-slate-400 hover:text-sky-700" aria-label="Ir">
                                        ›
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/direccion/autorizaciones-observaciones" className="ce-link-more">
                        Ver todos los pendientes &gt;
                    </Link>
                </CeInstSurface>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                    <CeInstSurface title="Decisiones recientes de la dirección">
                        <div className="ce-table-wrap">
                            <table className="inst-table min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left">Fecha y hora</th>
                                        <th className="px-2 py-2 text-left">Tipo</th>
                                        <th className="px-2 py-2 text-left">Asunto</th>
                                        <th className="px-2 py-2 text-left">Descripción</th>
                                        <th className="px-2 py-2 text-left">Autor</th>
                                        <th className="px-2 py-2 text-left">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {decisiones.map((d, idx) => (
                                        <tr key={`${d.asunto}-${idx}`} className="border-t border-slate-100">
                                            <td className="px-2 py-2 text-slate-600">{d.fecha}</td>
                                            <td className="px-2 py-2 font-medium text-slate-800">{d.tipo}</td>
                                            <td className="px-2 py-2 text-slate-900">{d.asunto}</td>
                                            <td className="px-2 py-2 text-slate-600">{d.descripcion}</td>
                                            <td className="px-2 py-2">{d.autor}</td>
                                            <td className="px-2 py-2">
                                                <CeStatusBadge>{d.estatus}</CeStatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Link to="/app/direccion/autorizaciones-observaciones" className="ce-link-more">
                            Ver todas las decisiones &gt;
                        </Link>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-4">
                    <CeInstSurface title="Reportes frecuentes">
                        <ul className="space-y-3 text-sm">
                            {reportes.map((r) => (
                                <li key={r.titulo} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-800">{r.titulo}</span>
                                    <Link to={r.ruta} className="shrink-0 text-slate-400 hover:text-sky-700">
                                        ›
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <Link to="/app/direccion/reportes" className="ce-link-more">
                            Ver todos los reportes &gt;
                        </Link>
                    </CeInstSurface>
                </div>
            </div>
        </CeShell>
    );
}

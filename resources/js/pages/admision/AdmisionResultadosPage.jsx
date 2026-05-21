import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_ACTIVIDAD_RECIENTE, ADM_RESULTADOS, ADM_RESULTADOS_METRICS, ADM_RESULTADOS_POR_CONVOCATORIA } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionResultadosPage() {
    const total = ADM_RESULTADOS_POR_CONVOCATORIA.reduce((a, x) => a + x.n, 0) || 1;
    return (
        <CeShell
            title="Resultados"
            subtitle="Publicación de resultados — admitidos quedan pendientes de asignación de matrícula por Educación Superior (sin crear matrícula desde Admisión)."
            metrics={ADM_RESULTADOS_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Resumen por convocatoria">
                        <div
                            className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-slate-700"
                            style={{
                                background: `conic-gradient(${ADM_RESULTADOS_POR_CONVOCATORIA.map((s, i) => {
                                    const start = (ADM_RESULTADOS_POR_CONVOCATORIA.slice(0, i).reduce((a, x) => a + x.n, 0) / total) * 360;
                                    const span = (s.n / total) * 360;
                                    return `${s.color} ${start}deg ${start + span}deg`;
                                }).join(', ')})`,
                            }}
                        >
                            <span className="rounded-full bg-white px-2 py-3 text-center shadow-sm">{total.toLocaleString('es-MX')}</span>
                        </div>
                        <ul className="space-y-1 text-xs">
                            {ADM_RESULTADOS_POR_CONVOCATORIA.map((s) => (
                                <li key={s.nombre} className="flex justify-between text-slate-700">
                                    <span>{s.nombre}</span>
                                    <span>
                                        {s.n} ({s.pct}%)
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <div className="mb-2 flex gap-2 text-xs">
                            <span className="font-semibold text-sky-800">Publicaciones recientes</span>
                            <span className="text-slate-400">Comunicaciones enviadas</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                            {ADM_ACTIVIDAD_RECIENTE.map((a) => (
                                <li key={a.texto} className="border-b border-slate-100 pb-2">
                                    {a.texto}
                                    <br />
                                    <span className="text-[10px]">{a.usuario} · {a.hora}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-xs text-sky-700">Ver todas las actividades &gt;</p>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    Publicar resultados
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Generar listado
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar ▾
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Más opciones
                </button>
            </div>
            <CeInstSurface title="Resultados">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Aspirante</th>
                                <th className="px-2 py-2 text-left">Convocatoria</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Puntaje final</th>
                                <th className="px-2 py-2 text-left">Resultado</th>
                                <th className="px-2 py-2 text-left">Publicación</th>
                                <th className="px-2 py-2 text-left">Transición</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_RESULTADOS.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-sky-700">{r.folio}</td>
                                    <td className="px-2 py-2">{r.aspirante}</td>
                                    <td className="px-2 py-2">{r.convocatoria}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.programa}</td>
                                    <td className="px-2 py-2">{r.puntaje}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.resultado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2">{r.publicacion}</td>
                                    <td className="px-2 py-2 text-[10px] text-slate-500">{r.transicion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={1036} noun="resultados" />
            </CeInstSurface>
        </CeShell>
    );
}

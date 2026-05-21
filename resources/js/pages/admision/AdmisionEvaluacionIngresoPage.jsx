import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_EVAL_RESULTADOS_PROGRAMA, ADM_EVALUACIONES, ADM_EVALUACIONES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionEvaluacionIngresoPage() {
    const total = ADM_EVAL_RESULTADOS_PROGRAMA.reduce((a, x) => a + x.n, 0) || 1;
    return (
        <CeShell
            title="Evaluación de ingreso"
            subtitle="Gestiona y da seguimiento a las evaluaciones de ingreso."
            metrics={ADM_EVALUACIONES_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Calendario de evaluaciones">
                        <p className="mb-2 text-center text-sm font-semibold text-slate-800">Mayo 2025</p>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                            <span className="text-sky-600">●</span> Programadas · <span className="text-emerald-600">●</span> Realizadas ·{' '}
                            <span className="text-amber-600">●</span> Pendientes
                        </p>
                    </CeInstSurface>
                    <CeInstSurface title="Resultados por programa" className="mt-4">
                        <div
                            className="mx-auto mb-3 h-32 w-32 rounded-full border border-slate-200"
                            style={{
                                background: `conic-gradient(${ADM_EVAL_RESULTADOS_PROGRAMA.map((s, i) => {
                                    const start = (ADM_EVAL_RESULTADOS_PROGRAMA.slice(0, i).reduce((a, x) => a + x.n, 0) / total) * 360;
                                    const span = (s.n / total) * 360;
                                    return `${s.color} ${start}deg ${start + span}deg`;
                                }).join(', ')})`,
                            }}
                        />
                        <ul className="space-y-1 text-xs text-slate-700">
                            {ADM_EVAL_RESULTADOS_PROGRAMA.map((s) => (
                                <li key={s.nombre} className="flex justify-between">
                                    <span>{s.nombre}</span>
                                    <span className="text-slate-500">
                                        {s.n} ({s.pct}%)
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-xs text-sky-700">Ver reporte completo &gt;</p>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    + Programar evaluación
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Registrar calificación
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar ▾
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
            </div>
            <CeInstSurface title="Evaluaciones de ingreso">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Aspirante</th>
                                <th className="px-2 py-2 text-left">Convocatoria</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Puntaje</th>
                                <th className="px-2 py-2 text-left">Recomendación</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_EVALUACIONES.map((e) => (
                                <tr key={e.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-sky-700">{e.folio}</td>
                                    <td className="px-2 py-2">{e.aspirante}</td>
                                    <td className="px-2 py-2">{e.convocatoria}</td>
                                    <td className="px-2 py-2 text-slate-600">{e.programa}</td>
                                    <td className="px-2 py-2">{e.tipo}</td>
                                    <td className="px-2 py-2">{e.fecha}</td>
                                    <td className="px-2 py-2">{e.puntaje}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{e.recomendacion}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{e.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={612} noun="evaluaciones" />
            </CeInstSurface>
        </CeShell>
    );
}

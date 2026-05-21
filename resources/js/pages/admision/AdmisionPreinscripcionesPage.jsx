import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_FUNNEL_PREINSCRIPCION, ADM_PREINSCRIPCIONES, ADM_PREINSCRIPCIONES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

function FunnelBar({ label, n, pct, color }) {
    return (
        <div className="mb-2">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{label}</span>
                <span>
                    {n.toLocaleString('es-MX')} ({pct}%)
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

export function AdmisionPreinscripcionesPage() {
    return (
        <CeShell
            title="Preinscripciones"
            subtitle="Gestione y valide las preinscripciones de aspirantes (sin matrícula oficial)."
            metrics={ADM_PREINSCRIPCIONES_METRICS}
            footerNote={FOOT}
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    + Nueva preinscripción
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Validar
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar ▾
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
            </div>
            <CeInstSurface title="Listado de preinscripciones">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Aspirante</th>
                                <th className="px-2 py-2 text-left">Convocatoria</th>
                                <th className="px-2 py-2 text-left">Subsistema</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Sede</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Documentos</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_PREINSCRIPCIONES.map((p) => (
                                <tr key={p.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-sky-700">{p.folio}</td>
                                    <td className="px-2 py-2">{p.aspirante}</td>
                                    <td className="px-2 py-2">{p.convocatoria}</td>
                                    <td className="px-2 py-2">{p.subsistema}</td>
                                    <td className="px-2 py-2 text-slate-600">{p.programa}</td>
                                    <td className="px-2 py-2 text-slate-600">{p.sede}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{p.fecha}</td>
                                    <td className="px-2 py-2">
                                        <div className="mb-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-1.5 rounded-full ${p.docsPct >= 100 ? 'bg-emerald-500' : p.docsPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${p.docsPct}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                            {p.docsPct}% {p.docsLabel}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{p.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={2148} noun="preinscripciones" />
            </CeInstSurface>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <CeInstSurface title="Embudo de conversión">
                    {ADM_FUNNEL_PREINSCRIPCION.map((s) => (
                        <FunnelBar key={s.etapa} label={s.etapa} n={s.n} pct={s.pct} color={s.color} />
                    ))}
                    <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-900">
                        Tasa de conversión general: <strong>16,6%</strong>
                    </p>
                </CeInstSurface>
                <CeInstSurface title="Preinscripciones recientes">
                    <p className="mb-2 text-right text-xs text-sky-700">Ver todas &gt;</p>
                    <ul className="space-y-2 text-xs text-slate-700">
                        {ADM_PREINSCRIPCIONES.map((p) => (
                            <li key={p.folio} className="flex justify-between border-b border-slate-100 pb-2">
                                <span>
                                    <strong>{p.aspirante}</strong>
                                    <br />
                                    {p.programa}
                                </span>
                                <CeStatusBadge>{p.estatus}</CeStatusBadge>
                            </li>
                        ))}
                    </ul>
                </CeInstSurface>
            </div>
        </CeShell>
    );
}

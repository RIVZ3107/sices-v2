import { CeInstSurface, CeShell, CeTableCard } from '../../components/controlEscolar/CeShell';
import { ADM_EMBUDO_PASOS, ADM_REPORTES_CATALOGO, ADM_REPORTES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

const barrasPrograma = [
    { programa: 'Licenciatura en Educación Primaria', n: 312 },
    { programa: 'Licenciatura en Pedagogía', n: 268 },
    { programa: 'Maestría en Educación', n: 142 },
    { programa: 'Licenciatura en Inclusión Educativa', n: 118 },
    { programa: 'Licenciatura en Educación Física', n: 95 },
];

export function AdmisionReportesPage() {
    const maxN = Math.max(...barrasPrograma.map((b) => b.n), 1);
    return (
        <CeShell
            title="Reportes de admisión"
            subtitle="Centro de reportes operativos — exportación PDF / Excel."
            metrics={ADM_REPORTES_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Reportes recientes">
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span>Aspirantes por convocatoria.pdf</span>
                                <span className="text-sky-700">⬇</span>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-2">
                                <span>Conversión por programa.xlsx</span>
                                <span className="text-sky-700">⬇</span>
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad de exportación" className="mt-4">
                        <ul className="space-y-1 text-xs text-slate-600">
                            <li>✓ Completado — Admitidos por programa · 18/05</li>
                            <li>✓ Completado — Lista de espera · 17/05</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    + Generar reporte
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar PDF
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar Excel
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
            </div>
            <CeInstSurface title="Centro de reportes">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Reporte</th>
                                <th className="px-2 py-2 text-left">Descripción</th>
                                <th className="px-2 py-2 text-left">Última generación</th>
                                <th className="px-2 py-2 text-left">Formato</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_REPORTES_CATALOGO.map((r) => (
                                <tr key={r.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-800">{r.nombre}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.desc}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{r.ultima}</td>
                                    <td className="px-2 py-2">
                                        <span className="rounded bg-red-50 px-2 py-0.5 text-red-800">{r.formato}</span>
                                    </td>
                                    <td className="px-2 py-2">
                                        <button type="button" className="inst-btn inst-btn-primary px-2 py-1 text-[11px]">
                                            Generar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <CeInstSurface title="Embudo de admisión">
                    <ul className="mb-3 space-y-1 text-xs text-slate-700">
                        {ADM_EMBUDO_PASOS.slice(0, 5).map((p) => (
                            <li key={p.etapa} className="flex justify-between">
                                <span>{p.etapa}</span>
                                <span>
                                    {p.n.toLocaleString('es-MX')} ({p.pct}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-col items-center gap-1">
                        {ADM_EMBUDO_PASOS.slice(0, 5).map((p, i) => (
                            <div
                                key={p.etapa}
                                className="rounded-sm bg-sky-500/90"
                                style={{
                                    width: `${Math.max(28, 100 - i * 16)}%`,
                                    height: `${14 + i * 4}px`,
                                    backgroundColor: p.color,
                                }}
                            />
                        ))}
                    </div>
                </CeInstSurface>
                <CeInstSurface title="Aspirantes por programa">
                    <div className="flex h-48 items-end justify-between gap-2 px-2">
                        {barrasPrograma.map((b) => (
                            <div key={b.programa} className="flex flex-1 flex-col items-center gap-1">
                                <div
                                    className="w-full max-w-[40px] rounded-t bg-sky-600"
                                    style={{ height: `${(b.n / maxN) * 140}px` }}
                                />
                                <span className="text-center text-[9px] leading-tight text-slate-600">{b.n}</span>
                            </div>
                        ))}
                    </div>
                    <ul className="mt-2 space-y-1 text-[10px] text-slate-600">
                        {barrasPrograma.map((b) => (
                            <li key={b.programa}>{b.programa}</li>
                        ))}
                    </ul>
                </CeInstSurface>
            </div>
        </CeShell>
    );
}

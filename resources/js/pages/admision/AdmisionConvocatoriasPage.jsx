import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_ACTIVIDAD_RECIENTE, ADM_CALENDARIO_CLAVES, ADM_CONVOCATORIAS, ADM_CONVOCATORIAS_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionConvocatoriasPage() {
    return (
        <CeShell
            title="Convocatorias"
            subtitle="Gestiona y da seguimiento a las convocatorias de admisión (UPN y Escuelas Normales)."
            metrics={ADM_CONVOCATORIAS_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Calendario de fechas clave">
                        <p className="mb-2 text-right text-xs">
                            <span className="text-sky-700">Ver calendario &gt;</span>
                        </p>
                        <ul className="space-y-2 text-xs text-slate-700">
                            {ADM_CALENDARIO_CLAVES.map((c) => (
                                <li key={c.texto} className="flex gap-2 border-b border-slate-100 pb-2">
                                    <span
                                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                                            c.tono === 'rojo' ? 'bg-red-500' : c.tono === 'naranja' ? 'bg-amber-500' : 'bg-sky-500'
                                        }`}
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-800">{c.fecha}</p>
                                        <p className="text-slate-600">{c.texto}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <p className="mb-2 text-right text-xs text-sky-700">Ver todo &gt;</p>
                        <ul className="space-y-2 text-xs text-slate-700">
                            {ADM_ACTIVIDAD_RECIENTE.map((a) => (
                                <li key={a.texto} className="border-b border-slate-100 pb-2">
                                    <p>{a.texto}</p>
                                    <p className="text-[10px] text-slate-400">
                                        {a.usuario} · {a.hora}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    + Nueva convocatoria
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Duplicar
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Publicar
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar ▾
                </button>
            </div>
            <CeInstSurface title="Listado de convocatorias">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">Periodo</th>
                                <th className="px-2 py-2 text-left">Subsistema</th>
                                <th className="px-2 py-2 text-left">Institución / Sede</th>
                                <th className="px-2 py-2 text-left">Programas</th>
                                <th className="px-2 py-2 text-left">Registro</th>
                                <th className="px-2 py-2 text-left">Evaluación</th>
                                <th className="px-2 py-2 text-left">Publicación</th>
                                <th className="px-2 py-2 text-left">Cupo</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_CONVOCATORIAS.map((c) => (
                                <tr key={c.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-800">{c.nombre}</td>
                                    <td className="px-2 py-2">{c.periodo}</td>
                                    <td className="px-2 py-2">{c.subsistema}</td>
                                    <td className="px-2 py-2 text-slate-600">{c.institucion}</td>
                                    <td className="px-2 py-2 text-slate-600">{c.programas}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{c.registro}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{c.evaluacion}</td>
                                    <td className="px-2 py-2">{c.publicacion}</td>
                                    <td className="px-2 py-2">{c.cupo.toLocaleString('es-MX')}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{c.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={4} total={12} noun="convocatorias" />
            </CeInstSurface>
        </CeShell>
    );
}

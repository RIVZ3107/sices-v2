import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_EXPEDIENTE_DETALLE_DOC, ADM_EXPEDIENTES, ADM_EXPEDIENTES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionExpedientesIngresoPage() {
    return (
        <CeShell
            title="Expedientes de ingreso"
            subtitle="Gestión y revisión de expedientes de ingreso — completo no implica matrícula creada."
            metrics={ADM_EXPEDIENTES_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Detalle del expediente">
                        <p className="text-xs font-semibold text-slate-800">EXP-2025-000124</p>
                        <p className="text-xs text-slate-600">Carlos Alberto Méndez Ortiz</p>
                        <p className="mt-1 text-xs">Convocatoria Ene–Jun 2025 · UPN 151</p>
                        <p className="mt-2">
                            <CeStatusBadge>En revisión</CeStatusBadge>
                        </p>
                        <div className="mt-3 flex gap-2 border-b border-slate-100 pb-2 text-xs">
                            <span className="font-semibold text-sky-700">Documentos</span>
                            <span className="text-slate-400">Información</span>
                            <span className="text-slate-400">Observaciones</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">Checklist: 6 de 7 completos</p>
                        <ul className="mt-2 space-y-1 text-xs">
                            {ADM_EXPEDIENTE_DETALLE_DOC.map((d) => (
                                <li key={d.doc} className="flex justify-between border-b border-slate-50 py-1">
                                    <span>{d.doc}</span>
                                    <span className={d.estado === 'Pendiente' ? 'text-red-600' : 'text-emerald-600'}>{d.estado}</span>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <ul className="space-y-2 text-xs text-slate-600">
                            <li>Cambió estatus a En revisión — Laura Rivas · 09:40</li>
                            <li>Documento CURP validado — Sistema · 09:12</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    Revisar expediente
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Validar documentos
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar ▾
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
            </div>
            <CeInstSurface title="Listado de expedientes">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Aspirante</th>
                                <th className="px-2 py-2 text-left">Convocatoria</th>
                                <th className="px-2 py-2 text-left">Subsistema</th>
                                <th className="px-2 py-2 text-left">Programa</th>
                                <th className="px-2 py-2 text-left">Progreso</th>
                                <th className="px-2 py-2 text-left">Responsable</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_EXPEDIENTES.map((e) => (
                                <tr key={e.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-sky-700">{e.folio}</td>
                                    <td className="px-2 py-2">{e.aspirante}</td>
                                    <td className="px-2 py-2">{e.convocatoria}</td>
                                    <td className="px-2 py-2">{e.subsistema}</td>
                                    <td className="px-2 py-2 text-slate-600">{e.programa}</td>
                                    <td className="px-2 py-2">
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-1.5 rounded-full ${e.progreso >= 85 ? 'bg-emerald-500' : e.progreso >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${e.progreso}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px]">{e.progreso}%</span>
                                    </td>
                                    <td className="px-2 py-2 text-slate-600">{e.responsable}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{e.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={1224} noun="expedientes" />
            </CeInstSurface>
        </CeShell>
    );
}

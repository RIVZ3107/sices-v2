import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { ADM_ASPIRANTES, ADM_ASPIRANTES_METRICS } from '../../data/admisionDemoData';

const FOOT = '© 2025 SICES v2 — Admisión. Todos los derechos reservados.';

export function AdmisionAspirantesPage() {
    return (
        <CeShell
            title="Aspirantes"
            subtitle="Lista de aspirantes — CURP obligatoria; sin creación de alumno definitivo ni matrícula oficial."
            metrics={ADM_ASPIRANTES_METRICS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Acciones rápidas">
                        <ul className="space-y-2 text-xs text-sky-800">
                            <li>Registrar nuevo aspirante</li>
                            <li>Importar aspirantes</li>
                            <li>Revisar pendientes (286)</li>
                            <li>Revisar duplicados (52)</li>
                            <li>Documentos pendientes (198)</li>
                            <li>Generar reporte</li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <p className="mb-2 text-right text-xs text-sky-700">Ver todo &gt;</p>
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li>Nuevo aspirante registrado — María Fernanda López · 10:32</li>
                            <li>Estatus actualizado a En revisión — Carlos Méndez · 09:58</li>
                            <li>Duplicado detectado — Brandon Cruz · Ayer</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" className="inst-btn inst-btn-primary text-sm">
                    + Nuevo aspirante
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Importar
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Exportar
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Filtros
                </button>
                <button type="button" className="inst-btn inst-btn-secondary text-sm">
                    Más opciones
                </button>
            </div>
            <CeInstSurface title="Lista de aspirantes">
                <CeTableCard>
                    <table className="inst-table min-w-full text-xs">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">CURP</th>
                                <th className="px-2 py-2 text-left">Convocatoria</th>
                                <th className="px-2 py-2 text-left">Subsistema</th>
                                <th className="px-2 py-2 text-left">Programa solicitado</th>
                                <th className="px-2 py-2 text-left">Sede solicitada</th>
                                <th className="px-2 py-2 text-left">Fecha registro</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ADM_ASPIRANTES.map((a) => (
                                <tr key={a.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-sky-700">{a.folio}</td>
                                    <td className="px-2 py-2">{a.nombre}</td>
                                    <td className="px-2 py-2 font-mono text-[11px]">{a.curp}</td>
                                    <td className="px-2 py-2">{a.convocatoria}</td>
                                    <td className="px-2 py-2">{a.subsistema}</td>
                                    <td className="px-2 py-2 text-slate-600">{a.programa}</td>
                                    <td className="px-2 py-2 text-slate-600">{a.sede}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{a.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{a.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={4} total={1245} noun="aspirantes" />
            </CeInstSurface>
        </CeShell>
    );
}

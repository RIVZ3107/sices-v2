import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_DOCUMENTOS_EMITIDOS, CE_PLANTILLAS_RAPIDAS } from '../../data/controlEscolarDemoData';

export function DocumentosCePage() {
    const actions = [
        { to: '/app/documentos/bandejas/por-rol', label: 'Generar constancia', variant: 'purple', icon: 'fileText' },
        { to: '/app/documentos/bandejas/por-rol', label: 'Historial académico', variant: 'primary', icon: 'bookOpen' },
        { to: '/app/documentos/bandejas/por-rol', label: 'Boleta', variant: 'success', icon: 'scrollText' },
        { to: '/app/documentos/bandejas/por-rol', label: 'Kardex PDF', variant: 'orange', icon: 'graduationCap' },
        { to: '/app/documentos/nuevo', label: 'Subir documento', variant: 'primary', icon: 'cloudUpload' },
        { to: '/app/control-escolar/documentos', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Documentos generados hoy', value: '48', trend: '↑ 25% vs. día anterior', tone: 'purple' },
        { title: 'Solicitudes de descarga', value: '34', trend: '↑ 18% vs. día anterior', tone: 'blue' },
        { title: 'Documentos observados', value: '12', trend: '↓ 4% vs. día anterior', tone: 'orange' },
        { title: 'Revisiones pendientes', value: '16', trend: 'En bandeja operativa', tone: 'orange' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Plantillas y accesos rápidos">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Plantillas frecuentes</p>
                <ul className="space-y-2 text-sm">
                    {CE_PLANTILLAS_RAPIDAS.map((p) => (
                        <li key={p} className="flex items-center gap-2 border-b border-slate-100 py-2 text-slate-800">
                            <span className="text-violet-600">▪</span>
                            <Link to="/app/documentos/bandejas/por-rol" className="hover:text-sky-800 hover:underline">
                                {p}
                            </Link>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Accesos rápidos</p>
                <ul className="space-y-2 text-sm text-sky-800">
                    <li>
                        <Link to="/app/documentos/bandejas/por-rol" className="hover:underline">
                            Catálogo de documentos operativos
                        </Link>
                    </li>
                    <li>
                        <Link to="/app/control-escolar/solicitudes" className="hover:underline">
                            Solicitudes relacionadas
                        </Link>
                    </li>
                </ul>
            </CeInstSurface>
            <CeInstSurface title="¿Necesitas ayuda?" className="mt-4 border-sky-200 bg-sky-50">
                <p className="text-sm text-slate-700">Consulta la guía de constancias y formatos admitidos para Normal / UPN.</p>
                <Link to="/app/control-escolar/reportes" className="inst-btn inst-btn-primary mt-3 inline-block text-sm">
                    Ir a la guía
                </Link>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Documentos y constancias"
            subtitle="Emisión operativa. La emisión oficial con validez electrónica plena corresponde a Sistemas y Certificación."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <CeInstSurface title="Documentos emitidos">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_DOCUMENTOS_EMITIDOS.map((r, i) => (
                                <tr key={`${r.tipo}-${i}`} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.tipo}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.alumno}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/documentos/bandejas/por-rol">Descargar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={7} total={48} noun="resultados" />
            </CeInstSurface>
        </CeShell>
    );
}

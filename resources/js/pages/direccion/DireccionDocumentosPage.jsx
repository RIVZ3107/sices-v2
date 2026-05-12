import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_DOCUMENTOS_EMITIDOS, CE_PLANTILLAS_RAPIDAS } from '../../data/controlEscolarDemoData';

export function DireccionDocumentosPage() {
    const actions = [
        { to: '/app/direccion/documentos', label: 'Solicitar constancia', variant: 'purple', icon: 'fileText' },
        { to: '/app/expedientes', label: 'Historial académico', variant: 'primary', icon: 'bookOpen' },
        { to: '/app/direccion/documentos', label: 'Boleta', variant: 'success', icon: 'scrollText' },
        { to: '/app/direccion/documentos', label: 'Kardex PDF', variant: 'orange', icon: 'graduationCap' },
        { to: '/app/direccion/documentos', label: 'Solicitar revisión', variant: 'primary', icon: 'cloudUpload' },
        { to: '/app/direccion/documentos', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Documentos generados hoy', value: '96', trend: '↓ 12% vs. ayer', tone: 'green' },
        { title: 'Pendientes de revisión institucional', value: '28', trend: '↑ 18% vs. ayer', tone: 'red' },
        { title: 'Solicitudes de descarga', value: '147', trend: '↓ 6% vs. ayer', tone: 'green' },
        { title: 'Plantillas disponibles', value: '34', trend: '— 0% vs. ayer', tone: 'purple' },
        { title: 'Documentos observados', value: '16', trend: '↑ 14% vs. ayer', tone: 'red' },
        { title: 'Revisiones pendientes', value: '22', trend: '↑ 10% vs. ayer', tone: 'orange' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Plantillas y accesos rápidos">
                <ul className="space-y-2 text-sm">
                    {CE_PLANTILLAS_RAPIDAS.map((p) => (
                        <li key={p} className="flex gap-2 border-b border-slate-100 py-2">
                            <span className="text-sky-600">●</span>
                            <div>
                                <p className="font-medium text-slate-900">{p}</p>
                                <p className="text-xs text-slate-600">Generación institucional supervisada.</p>
                            </div>
                        </li>
                    ))}
                </ul>
                <Link to="/app/direccion/documentos" className="ce-link-more">
                    Ver todas las plantillas &gt;
                </Link>
            </CeInstSurface>
            <CeInstSurface title="¿Necesitas ayuda?" className="mt-4">
                <p className="text-sm text-slate-700">
                    La emisión técnica y la configuración global de plantillas corresponden a otros roles. Aquí revisa, autoriza u observa documentos de tu escuela.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Guía de uso
                    </button>
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Centro de ayuda
                    </button>
                    <button type="button" className="inst-btn inst-btn-primary text-sm">
                        Contactar a soporte
                    </button>
                </div>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Documentos institucionales"
            subtitle="Emisión, revisión y autorización documental. Sin administración técnica de sellos ni plantillas globales."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Documentos emitidos">
                <div className="mb-3 flex flex-wrap gap-2">
                    <select className="inst-input text-sm" aria-label="Periodo">
                        <option>Hoy</option>
                        <option>Esta semana</option>
                    </select>
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar en la tabla…" />
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Filtros
                    </button>
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Descarga</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_DOCUMENTOS_EMITIDOS.map((r) => (
                                <tr key={`${r.tipo}-${r.alumno}`} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.tipo}</td>
                                    <td className="px-2 py-2 text-slate-800">{r.alumno}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2">
                                        <button type="button" className="inst-btn inst-btn-secondary text-xs">
                                            PDF ▾
                                        </button>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Ver</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={6} total={25} noun="resultados" />
            </CeInstSurface>
        </CeShell>
    );
}

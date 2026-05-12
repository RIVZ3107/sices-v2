import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_OBSERVACIONES } from '../../data/controlEscolarDemoData';

export function ObservacionesCePage() {
    const actions = [
        { to: '/app/observaciones', label: 'Responder', variant: 'primary', icon: 'messageCircle' },
        { to: '/app/observaciones', label: 'Adjuntar evidencia', variant: 'success', icon: 'paperclip' },
        { to: '/app/observaciones', label: 'Marcar atendida', variant: 'orange', icon: 'check' },
        { to: '/app/expedientes', label: 'Abrir expediente', variant: 'purple', icon: 'folderOpen' },
        { to: '/app/observaciones', label: 'Ver historial', variant: 'muted', icon: 'scrollText' },
    ];
    const metrics = [
        { title: 'Observaciones pendientes', value: '33', trend: 'Por atender', tone: 'blue' },
        { title: 'Atendidas', value: '128', trend: 'Últimos 60 días', tone: 'green' },
        { title: 'Devueltas', value: '14', trend: 'Requieren nueva acción', tone: 'orange' },
        { title: 'Vencidas', value: '3', trend: 'Prioridad alta', tone: 'red' },
    ];

    const detalle = CE_DEMO_OBSERVACIONES[0];

    const rightPanel = (
        <>
            <CeInstSurface title="Detalle de observación">
                <p className="text-sm font-semibold text-slate-900">{detalle.folio}</p>
                <p className="mt-2 text-sm text-slate-700">{detalle.texto}</p>
                <p className="mt-3 text-xs text-slate-500">Alumno: {detalle.alumno}</p>
            </CeInstSurface>
            <CeInstSurface title="Evidencia" className="mt-4">
                <p className="text-sm text-slate-600">Arrastra archivos o selecciona desde tu equipo (PDF / JPG, máx. 10 MB).</p>
                <button type="button" className="inst-btn inst-btn-secondary mt-3 text-sm">
                    Subir evidencia
                </button>
            </CeInstSurface>
            <CeInstSurface title="Historial" className="mt-4">
                <ul className="ce-timeline text-xs text-slate-600">
                    <li className="ce-timeline-item">Creación de observación — Control Escolar</li>
                    <li className="ce-timeline-item">Comentario de seguimiento — hace 2 días</li>
                </ul>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Observaciones"
            subtitle="Seguimiento académico y documental. Sin solicitar identificadores técnicos al usuario final."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <CeInstSurface title="Bandeja de observaciones">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Módulo</th>
                                <th className="px-2 py-2 text-left">Observación</th>
                                <th className="px-2 py-2 text-left">Prioridad</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_OBSERVACIONES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-semibold text-sky-700">{r.folio}</td>
                                    <td className="px-2 py-2">{r.alumno}</td>
                                    <td className="px-2 py-2">{r.modulo}</td>
                                    <td className="px-2 py-2 max-w-xs truncate text-slate-700">{r.texto}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.prioridad}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/observaciones">Atender</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={2} total={33} noun="observaciones" />
            </CeInstSurface>
        </CeShell>
    );
}

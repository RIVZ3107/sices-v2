import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { DE_AUTORIZACIONES_FILAS } from '../../data/direccionEscuelaDemoData';

export function DireccionAutorizacionesPage() {
    const actions = [
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Revisar solicitud', variant: 'primary', icon: 'eye' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar', variant: 'success', icon: 'check' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Observar', variant: 'orange', icon: 'alertTriangle' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Rechazar institucionalmente', variant: 'muted', icon: 'x' },
        { to: '/app/expedientes', label: 'Ver expediente', variant: 'purple', icon: 'folder' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Ver historial', variant: 'muted', icon: 'clock' },
    ];
    const metrics = [
        { title: 'Solicitudes por autorizar', value: '24', trend: '↑ 5% vs. semana anterior', tone: 'orange' },
        { title: 'Observaciones emitidas', value: '18', trend: '↑ 2% vs. semana anterior', tone: 'blue' },
        { title: 'Observaciones atendidas', value: '41', trend: '↑ 8% vs. semana anterior', tone: 'green' },
        { title: 'Procesos devueltos', value: '9', trend: '↓ 3% vs. semana anterior', tone: 'purple' },
        { title: 'Autorizaciones excepcionales', value: '6', trend: '↑ 1% vs. semana anterior', tone: 'green' },
        { title: 'Historial de decisiones', value: '312', trend: 'Consulta', tone: 'blue' },
    ];

    return (
        <CeShell
            title="Autorizaciones y observaciones"
            subtitle="Solicitudes institucionales: inscripción extemporánea, reinscripción excepcional, correcciones, bajas, cambios y egreso."
            actions={actions}
            metrics={metrics}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Bandeja de autorizaciones">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Origen</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DE_AUTORIZACIONES_FILAS.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-mono text-xs font-semibold text-sky-700">{r.folio}</td>
                                    <td className="px-2 py-2 text-slate-900">{r.tipo}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.solicitante}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Revisar</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={4} total={24} />
            </CeInstSurface>
        </CeShell>
    );
}

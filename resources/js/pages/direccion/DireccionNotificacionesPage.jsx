import { Link } from 'react-router-dom';
import { CeInstSurface, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { DE_NOTIFICACION_CATEGORIAS, DE_NOTIFICACION_DETALLE, DE_NOTIFICACIONES_LISTA } from '../../data/direccionEscuelaDemoData';

export function DireccionNotificacionesPage() {
    const actions = [
        { to: '/app/direccion/notificaciones', label: 'Marcar todas leídas', variant: 'primary', icon: 'envelope' },
        { to: '/app/direccion/notificaciones', label: 'Filtrar', variant: 'muted', icon: 'funnel' },
        { to: '/app/direccion/notificaciones', label: 'Preferencias de notificación', variant: 'muted', icon: 'cog' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'purple', icon: 'arrowDownTray' },
    ];
    const metrics = [
        { title: 'No leídas', value: '31', trend: '↑ 15% vs. ayer', tone: 'blue' },
        { title: 'Críticas', value: '5', trend: '↑ 25% vs. ayer', tone: 'red' },
        { title: 'Recordatorios', value: '14', trend: '↓ 7% vs. ayer', tone: 'green' },
        { title: 'Automáticas', value: '18', trend: '↑ 12% vs. ayer', tone: 'purple' },
        { title: 'Incidencias', value: '9', trend: '↑ 28% vs. ayer', tone: 'red' },
        { title: 'Aprobaciones pendientes', value: '12', trend: '↓ 5% vs. ayer', tone: 'green' },
    ];

    const detalle = DE_NOTIFICACION_DETALLE;

    return (
        <CeShell
            title="Centro de notificaciones"
            subtitle="Alertas, recordatorios y eventos relevantes. Preferencias personales; sin reglas globales del sistema."
            actions={actions}
            metrics={metrics}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                    <CeInstSurface title="Categorías">
                        <ul className="space-y-1 text-sm">
                            {DE_NOTIFICACION_CATEGORIAS.map((c) => (
                                <li
                                    key={c.key}
                                    className={`flex items-center justify-between rounded-lg px-2 py-2 ${
                                        c.activo ? 'bg-sky-50 font-semibold text-sky-900' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{c.label}</span>
                                    <span className="text-xs text-slate-500">{c.n}</span>
                                </li>
                            ))}
                        </ul>
                        <Link to="/app/direccion/notificaciones" className="ce-link-more">
                            Ver todas las categorías &gt;
                        </Link>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-5">
                    <CeInstSurface title="Lista de notificaciones (89)">
                        <div className="ce-table-wrap">
                            <table className="inst-table min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left">Tipo</th>
                                        <th className="px-2 py-2 text-left">Mensaje</th>
                                        <th className="px-2 py-2 text-left">Usuario / Alumno</th>
                                        <th className="px-2 py-2 text-left">Fecha</th>
                                        <th className="px-2 py-2 text-left">Prioridad</th>
                                        <th className="px-2 py-2 text-left">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DE_NOTIFICACIONES_LISTA.map((n) => (
                                        <tr key={n.mensaje} className="border-t border-slate-100">
                                            <td className="px-2 py-2">{n.tipo}</td>
                                            <td className="px-2 py-2 font-medium text-slate-900">{n.mensaje}</td>
                                            <td className="px-2 py-2 text-slate-600">{n.relacion}</td>
                                            <td className="px-2 py-2 text-slate-500">{n.fecha}</td>
                                            <td className="px-2 py-2">
                                                <CeStatusBadge>{n.prioridad}</CeStatusBadge>
                                            </td>
                                            <td className="px-2 py-2">
                                                <CeStatusBadge>{n.estatus}</CeStatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Link to="/app/direccion/notificaciones" className="ce-link-more">
                            Ver más notificaciones ⌵
                        </Link>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-4">
                    <CeInstSurface title="Detalle de la notificación">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <CeStatusBadge>{detalle.prioridad}</CeStatusBadge>
                            <span className="font-mono text-xs text-slate-500">{detalle.id}</span>
                        </div>
                        <p className="text-base font-bold text-slate-900">{detalle.titulo}</p>
                        <p className="mt-3 text-sm text-slate-700">{detalle.descripcion}</p>
                        <dl className="mt-4 space-y-2 text-sm text-slate-600">
                            <div>
                                <dt className="text-xs uppercase text-slate-400">Usuario relacionado</dt>
                                <dd>{detalle.usuario}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-slate-400">Fecha</dt>
                                <dd>{detalle.fecha}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-slate-400">Categoría</dt>
                                <dd>{detalle.categoria}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-slate-400">Estatus</dt>
                                <dd>
                                    <CeStatusBadge>{detalle.estatus}</CeStatusBadge>
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase text-slate-500">Acciones recomendadas</p>
                            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                                {detalle.acciones.map((a) => (
                                    <li key={a}>{a}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <Link to="/app/expedientes" className="inst-btn inst-btn-primary text-center text-sm">
                                Ver detalle ↗
                            </Link>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className="inst-btn inst-btn-secondary flex-1 text-xs">
                                    Marcar leída
                                </button>
                                <button type="button" className="inst-btn inst-btn-secondary flex-1 text-xs">
                                    Archivar
                                </button>
                                <button type="button" className="inst-btn inst-btn-secondary flex-1 text-xs">
                                    Responder
                                </button>
                            </div>
                        </div>
                    </CeInstSurface>
                </div>
            </div>
        </CeShell>
    );
}

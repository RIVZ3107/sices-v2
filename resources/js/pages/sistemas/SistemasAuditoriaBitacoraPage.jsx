import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_AUDITORIA_METRICAS, SIS_AUDITORIA_TABLA } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasAuditoriaBitacoraPage() {
    const actions = [
        { to: '/app/sistemas/auditoria', label: 'Exportar bitácora', variant: 'primary', icon: 'arrowUpTray' },
        { to: '/app/sistemas/auditoria', label: 'Filtrar', variant: 'muted', icon: 'funnel' },
        { to: '/app/sistemas/auditoria', label: 'Trazabilidad', variant: 'muted', icon: 'eye' },
        { to: '/app/sistemas/auditoria', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];

    return (
        <CeShell
            title="Auditoría y bitácora"
            subtitle="Eventos técnicos y de seguridad. Incluye intentos de acceso inválidos y cambios de configuración."
            actions={actions}
            metrics={SIS_AUDITORIA_METRICAS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Eventos críticos">
                        <ul className="space-y-2 text-xs text-slate-700">
                            <li className="flex gap-2">
                                <span className="text-red-500">●</span> Intento de acceso con credenciales inválidas
                            </li>
                            <li className="flex gap-2">
                                <span className="text-amber-500">●</span> Eliminación de registro en catálogo
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Top usuarios con actividad" className="mt-4">
                        <ul className="space-y-1 text-xs text-slate-600">
                            <li>admin.tecnico — 842 eventos</li>
                            <li>sistemas.bot — 610 eventos</li>
                            <li>mhernandez — 402 eventos</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Bitácora">
                <div className="mb-3 flex flex-wrap gap-2">
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar por acción, entidad, ID, IP…" />
                    <input className="inst-input text-sm" placeholder="Rango fechas" defaultValue="20/05/2025 00:00 — 20/05/2025 23:59" />
                    <select className="inst-input text-sm">
                        <option>Módulo</option>
                    </select>
                    <select className="inst-input text-sm">
                        <option>Usuario</option>
                    </select>
                    <button type="button" className="inst-btn inst-btn-secondary text-xs">
                        Limpiar filtros
                    </button>
                </div>
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Fecha y hora</th>
                                <th className="px-2 py-2 text-left">Usuario</th>
                                <th className="px-2 py-2 text-left">Módulo</th>
                                <th className="px-2 py-2 text-left">Acción</th>
                                <th className="px-2 py-2 text-left">Entidad afectada</th>
                                <th className="px-2 py-2 text-left">Resultado</th>
                                <th className="px-2 py-2 text-left">IP</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_AUDITORIA_TABLA.map((r) => (
                                <tr key={`${r.fecha}-${r.usuario}`} className="border-t border-slate-100">
                                    <td className="px-2 py-2 text-xs text-slate-600">{r.fecha}</td>
                                    <td className="px-2 py-2 font-mono text-xs">{r.usuario}</td>
                                    <td className="px-2 py-2">{r.modulo}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.accion}</td>
                                    <td className="px-2 py-2 text-xs">{r.entidad}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.resultado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 font-mono text-xs">{r.ip}</td>
                                    <td className="px-2 py-2 text-xs text-sky-700">⋯</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={8} total={12458} noun="eventos" />
            </CeInstSurface>
        </CeShell>
    );
}

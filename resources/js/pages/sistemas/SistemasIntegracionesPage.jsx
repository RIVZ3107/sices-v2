import { CeInstSurface, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_INTEGRACION_METRICAS, SIS_INTEGRACIONES } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasIntegracionesPage() {
    const actions = [
        { to: '/app/sistemas/integraciones', label: 'Nueva integración', variant: 'primary', icon: 'plus' },
        { to: '/app/sistemas/integraciones', label: 'Probar conexión', variant: 'success', icon: 'refreshCw' },
        { to: '/app/sistemas/integraciones', label: 'Sincronizar', variant: 'muted', icon: 'refreshCw' },
        { to: '/app/sistemas/integraciones', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/integraciones', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];

    return (
        <CeShell
            title="Integraciones y servicios externos"
            subtitle="Servicios reales SICES. Sin pagos, colegiaturas ni SAT RFC mientras no exista módulo financiero."
            actions={actions}
            metrics={SIS_INTEGRACION_METRICAS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Salud de conexiones">
                        <p className="text-center text-2xl font-bold text-slate-900">75%</p>
                        <p className="text-center text-xs text-slate-500">Conectado vs alerta</p>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad sincronización (24 h)" className="mt-4">
                        <ul className="text-xs text-slate-700 space-y-2">
                            <li>Exitosos: 118</li>
                            <li>Fallidos: 10</li>
                            <li>Registros procesados: 254,812</li>
                            <li>Duración media: 1.42 s</li>
                        </ul>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Servicios">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Servicio</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Última sincronización</th>
                                <th className="px-2 py-2 text-left">Responsable</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_INTEGRACIONES.map((r) => (
                                <tr key={r.servicio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.servicio}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.tipo}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-slate-600">{r.ultima}</td>
                                    <td className="px-2 py-2 text-xs">{r.responsable}</td>
                                    <td className="px-2 py-2 text-xs text-sky-700">Ver · Probar</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
            </CeInstSurface>
        </CeShell>
    );
}

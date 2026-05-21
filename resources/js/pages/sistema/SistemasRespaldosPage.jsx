import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_RESPALDOS_METRICAS, SIS_RESPALDOS_TABLA } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasRespaldosPage() {
    const actions = [
        { to: '/app/sistema/respaldos', label: 'Ejecutar respaldo', variant: 'primary', icon: 'cloudUpload' },
        { to: '/app/sistema/respaldos', label: 'Programar', variant: 'muted', icon: 'clock' },
        { to: '/app/sistema/respaldos', label: 'Verificar integridad', variant: 'success', icon: 'check' },
        { to: '/app/sistema/respaldos', label: 'Exportar log', variant: 'muted', icon: 'arrowUpTray' },
    ];

    return (
        <CeShell
            title="Respaldos del sistema"
            subtitle="La restauración completa requiere permiso elevado (superadmin)."
            actions={actions}
            metrics={SIS_RESPALDOS_METRICAS}
            footerNote={FOOT}
        >
            <CeInstSurface title="Historial de respaldos">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Tipo</th>
                                <th className="px-2 py-2 text-left">Tamaño</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Responsable</th>
                                <th className="px-2 py-2 text-left">Ubicación</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_RESPALDOS_TABLA.map((r) => (
                                <tr key={r.fecha} className="border-t border-slate-100">
                                    <td className="px-2 py-2 text-xs">{r.fecha}</td>
                                    <td className="px-2 py-2">{r.tipo}</td>
                                    <td className="px-2 py-2">{r.tamano}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 font-mono text-xs">{r.responsable}</td>
                                    <td className="px-2 py-2 break-all text-xs text-slate-600">{r.ubicacion}</td>
                                    <td className="px-2 py-2 text-xs text-sky-700">Descargar · Log</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={3} total={28} noun="respaldos" />
            </CeInstSurface>
        </CeShell>
    );
}

import { CeInstSurface, CePaginationFoot, CeShell, CeTableCard, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { SIS_CATALOGO_FILAS, SIS_CATALOGO_METRICAS } from '../../data/sistemasDemoData';

const FOOT = '© 2025 SICES v2 — Administración técnica. Todos los derechos reservados.';

export function SistemasCatalogosPage() {
    const actions = [
        { to: '/app/sistemas/catalogos', label: 'Nuevo catálogo', variant: 'primary', icon: 'plus' },
        { to: '/app/sistemas/catalogos', label: 'Nueva opción', variant: 'success', icon: 'plus' },
        { to: '/app/sistemas/catalogos', label: 'Importar', variant: 'muted', icon: 'arrowDownTray' },
        { to: '/app/sistemas/catalogos', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
        { to: '/app/sistemas/catalogos', label: 'Filtros', variant: 'muted', icon: 'funnel' },
        { to: '/app/sistemas/catalogos', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];

    return (
        <CeShell
            title="Catálogos del sistema"
            subtitle="Catálogos reales SICES. La sección avanzada de claves legacy solo para Sistemas / Superadmin."
            actions={actions}
            metrics={SIS_CATALOGO_METRICAS}
            footerNote={FOOT}
            rightPanel={
                <>
                    <CeInstSurface title="Distribución por tipo">
                        <div className="flex flex-col items-center gap-2 py-4">
                            <div className="text-2xl font-bold text-slate-900">27</div>
                            <p className="text-xs text-slate-500">Total catálogos</p>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-700">
                            <li>Generales 33%</li>
                            <li>Académicos 22%</li>
                            <li>Administrativos 19%</li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Actividad reciente" className="mt-4">
                        <p className="text-xs text-slate-600">Se importaron 45 elementos en Tipos de trámite — ayer.</p>
                    </CeInstSurface>
                </>
            }
        >
            <CeInstSurface title="Catálogos">
                <CeTableCard>
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Nombre</th>
                                <th className="px-2 py-2 text-left">Total elementos</th>
                                <th className="px-2 py-2 text-left">Última actualización</th>
                                <th className="px-2 py-2 text-left">Responsable</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIS_CATALOGO_FILAS.map((c) => (
                                <tr key={c.nombre} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{c.nombre}</td>
                                    <td className="px-2 py-2">{c.total.toLocaleString('es-MX')}</td>
                                    <td className="px-2 py-2 text-slate-600">{c.actualizado}</td>
                                    <td className="px-2 py-2 text-slate-600">{c.responsable}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{c.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-sky-700">⋯</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CeTableCard>
                <CePaginationFoot showingFrom={1} showingTo={SIS_CATALOGO_FILAS.length} total={27} noun="catálogos" />
            </CeInstSurface>
        </CeShell>
    );
}

import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_ERRORES_IMPORT, CE_DEMO_IMPORTACIONES } from '../../data/controlEscolarDemoData';

export function ImportacionesCePage() {
    const actions = [
        { to: '/app/importaciones', label: 'Nueva importación', variant: 'primary', icon: 'plus' },
        { to: '/app/importaciones', label: 'Subir archivo', variant: 'success', icon: 'arrowUpTray' },
        { to: '/app/importaciones', label: 'Prevalidar', variant: 'orange', icon: 'check' },
        { to: '/app/importaciones', label: 'Conciliar', variant: 'purple', icon: 'arrowsLeftRight' },
        { to: '/app/importaciones', label: 'Ver errores', variant: 'muted', icon: 'alertTriangle' },
    ];
    const metrics = [
        { title: 'Importaciones recientes', value: '24', trend: 'Últimos 30 días', tone: 'blue' },
        { title: 'Prevalidadas', value: '11', trend: 'Listas para conciliar', tone: 'green' },
        { title: 'Con errores', value: '5', trend: 'Requieren corrección', tone: 'red' },
        { title: 'Pendientes de conciliación', value: '7', trend: 'En cola operativa', tone: 'orange' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Errores frecuentes">
                <ul className="space-y-2 text-sm">
                    {CE_DEMO_ERRORES_IMPORT.map((e) => (
                        <li key={e.label} className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-slate-700">{e.label}</span>
                            <span className="font-bold text-slate-900">{e.n}</span>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Flujo de importación" className="mt-4">
                <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-700">
                    <li>Carga del archivo y selección de plantilla.</li>
                    <li>Prevalidación sintáctica y de catálogos.</li>
                    <li>Conciliación con expedientes y trayectoria.</li>
                    <li>Confirmación (bloqueada si hay errores críticos).</li>
                </ol>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Importaciones académicas"
            subtitle="Calificaciones, kardex y altas masivas. Sin confirmación con errores críticos abiertos."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950">
                No se permite <strong>confirmar</strong> una importación mientras existan <strong>errores críticos</strong> sin corregir.
            </div>
            <CeInstSurface title="Historial de importaciones">
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Folio</th>
                                <th className="px-2 py-2 text-left">Archivo / origen</th>
                                <th className="px-2 py-2 text-left">Alumno / programa</th>
                                <th className="px-2 py-2 text-left">Registros</th>
                                <th className="px-2 py-2 text-left">Errores</th>
                                <th className="px-2 py-2 text-left">Estado</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_IMPORTACIONES.map((r) => (
                                <tr key={r.folio} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-semibold text-sky-700">{r.folio}</td>
                                    <td className="px-2 py-2 text-slate-800">{r.archivo}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.alumno}</td>
                                    <td className="px-2 py-2">{r.registros}</td>
                                    <td className="px-2 py-2">{r.errores}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estado}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/importaciones">Abrir</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={4} total={24} noun="importaciones" />
            </CeInstSurface>
        </CeShell>
    );
}

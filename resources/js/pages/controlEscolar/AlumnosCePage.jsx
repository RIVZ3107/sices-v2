import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_ALUMNOS, CE_DEMO_ALUMNOS_RECENTES } from '../../data/controlEscolarDemoData';

export function AlumnosCePage() {
    const actions = [
        { to: '/app/alumnos/crear', label: 'Nuevo alumno', variant: 'primary', icon: 'userPlus' },
        { to: '/app/control-escolar/importaciones', label: 'Importar', variant: 'success', icon: 'arrowDownTray' },
        { to: '/app/control-escolar/reportes', label: 'Exportar', variant: 'purple', icon: 'arrowUpTray' },
        { to: '/app/control-escolar/alumnos?filtros=1', label: 'Filtros', variant: 'primary', icon: 'funnel' },
        { to: '/app/control-escolar/solicitudes', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];
    const metrics = [
        { title: 'Alumnos activos', value: '2,124', trend: '↑ 3% vs. ciclo anterior', tone: 'blue' },
        { title: 'Baja temporal', value: '196', trend: '↓ 5% vs. ciclo anterior', tone: 'orange' },
        { title: 'Egresados', value: '312', trend: '↑ 8% vs. ciclo anterior', tone: 'purple' },
        { title: 'Expedientes incompletos', value: '32', trend: '↓ 11% vs. ciclo anterior', tone: 'orange' },
    ];

    return (
        <CeShell
            title="Gestión de alumnos"
            subtitle="Registro y seguimiento para licenciaturas en educación (Educación Normal y UPN)."
            actions={actions}
            metrics={metrics}
        >
            <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-3">
                    <CeInstSurface title="Acciones rápidas">
                        <ul className="space-y-3 text-sm text-slate-700">
                            <li className="flex gap-2">
                                <span className="text-sky-600">●</span>
                                <Link to="/app/alumnos/crear" className="font-medium text-sky-700 hover:underline">
                                    Registrar un nuevo alumno
                                </Link>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-600">●</span>
                                <Link to="/app/control-escolar/importaciones" className="font-medium text-sky-700 hover:underline">
                                    Carga masiva desde archivo
                                </Link>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-violet-600">●</span>
                                <Link to="/app/control-escolar/documentos" className="font-medium text-sky-700 hover:underline">
                                    Generar constancia en lote
                                </Link>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-amber-600">●</span>
                                <Link to="/app/control-escolar/trayectoria" className="font-medium text-sky-700 hover:underline">
                                    Consultar kardex por alumno
                                </Link>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-600">●</span>
                                <Link to="/app/control-escolar/reinscripciones" className="font-medium text-sky-700 hover:underline">
                                    Iniciar proceso de reinscripción
                                </Link>
                            </li>
                        </ul>
                    </CeInstSurface>
                    <CeInstSurface title="Alumnos recientes">
                        <ul className="space-y-3">
                            {CE_DEMO_ALUMNOS_RECENTES.map((a) => (
                                <li key={a.matricula} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                                        {a.nombre
                                            .split(' ')
                                            .slice(0, 2)
                                            .map((p) => p[0])
                                            .join('')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-slate-900">{a.nombre}</p>
                                        <p className="text-xs text-slate-500">{a.matricula}</p>
                                        <p className="truncate text-xs text-slate-600">{a.programa}</p>
                                        <div className="mt-1">
                                            <CeStatusBadge>{a.estatus}</CeStatusBadge>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CeInstSurface>
                </div>
                <div className="lg:col-span-9">
                    <CeInstSurface title="Registro de alumnos">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar en la tabla…" />
                            <span className="text-xs text-slate-600">Mostrar 10 registros</span>
                        </div>
                        <div className="ce-table-wrap">
                            <table className="inst-table min-w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-left">Matrícula</th>
                                        <th className="px-2 py-2 text-left">Nombre</th>
                                        <th className="px-2 py-2 text-left">Programa</th>
                                        <th className="px-2 py-2 text-left">Semestre / periodo</th>
                                        <th className="px-2 py-2 text-left">Estatus</th>
                                        <th className="px-2 py-2 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CE_DEMO_ALUMNOS.map((r) => (
                                        <tr key={r.matricula} className="border-t border-slate-100">
                                            <td className="px-2 py-2">
                                                <Link to="/app/expedientes" className="font-semibold text-sky-700 hover:underline">
                                                    {r.matricula}
                                                </Link>
                                            </td>
                                            <td className="px-2 py-2 font-medium text-slate-900">{r.nombre}</td>
                                            <td className="px-2 py-2 text-slate-700">{r.programa}</td>
                                            <td className="px-2 py-2 text-slate-600">{r.periodo}</td>
                                            <td className="px-2 py-2">
                                                <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                            </td>
                                            <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                                <Link to="/app/expedientes">Exp</Link>
                                                {' · '}
                                                <Link to="/app/alumnos/crear">Edit</Link>
                                                {' · '}
                                                <Link to="/app/control-escolar/trayectoria">Tray</Link>
                                                {' · '}
                                                <Link to="/app/control-escolar/reinscripciones">Rein</Link>
                                                {' · '}
                                                <Link to="/app/control-escolar/documentos">Doc</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <CePaginationFoot showingFrom={1} showingTo={10} total={2124} />
                    </CeInstSurface>
                </div>
            </div>
        </CeShell>
    );
}

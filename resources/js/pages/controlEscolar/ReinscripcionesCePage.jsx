import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_REINSCRIPCIONES, CE_MOTIVOS_BLOQUEO } from '../../data/controlEscolarDemoData';

export function ReinscripcionesCePage() {
    const actions = [
        { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', variant: 'success', icon: 'refreshCw' },
        { to: '/app/control-escolar/reinscripciones', label: 'Desbloquear', variant: 'primary', icon: 'lockOpen' },
        { to: '/app/control-escolar/reinscripciones', label: 'Generar ficha', variant: 'purple', icon: 'fileText' },
        { to: '/app/control-escolar/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
    ];
    const metrics = [
        { title: 'Reinscripciones en proceso', value: '156', trend: '↑ 8% vs. ciclo anterior', tone: 'blue' },
        { title: 'Bloqueadas', value: '48', trend: '↑ 15% vs. ciclo anterior', tone: 'red' },
        { title: 'Completadas', value: '312', trend: '↑ 12% vs. ciclo anterior', tone: 'green' },
        { title: 'Incidencias detectadas', value: '63', trend: '↑ 9% vs. ciclo anterior', tone: 'orange' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Motivos de bloqueo">
                <ul className="space-y-2 text-sm">
                    {CE_MOTIVOS_BLOQUEO.map((m) => (
                        <li key={m.label} className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-slate-700">{m.label}</span>
                            <span className="font-bold text-slate-900">{m.n}</span>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Flujo de reinscripción" className="mt-4">
                <ol className="space-y-2 text-sm text-slate-700">
                    <li>1. Solicitud iniciada</li>
                    <li className="font-semibold text-sky-800">2. Validación documental y académica</li>
                    <li>3. Corrección de observaciones</li>
                    <li>4. Confirmación</li>
                    <li>5. Reinscripción completada</li>
                </ol>
                <Link to="/app/control-escolar/solicitudes" className="ce-link-more mt-2 inline-block">
                    Ver guía del proceso &gt;
                </Link>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Gestión de reinscripciones"
            subtitle="Seguimiento por ciclo escolar. Motivos académicos y documentales — sin gestión de colegiaturas."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <CeInstSurface title="Lista de reinscripciones (516 registros)">
                <div className="mb-3 flex flex-wrap gap-2">
                    <input type="search" className="inst-input max-w-md text-sm" placeholder="Buscar alumno o matrícula…" />
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Filtros
                    </button>
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Matrícula</th>
                                <th className="px-2 py-2 text-left">Periodo</th>
                                <th className="px-2 py-2 text-left">Motivo de bloqueo</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_REINSCRIPCIONES.map((r) => (
                                <tr key={r.matricula} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.alumno}</td>
                                    <td className="px-2 py-2 text-sky-700">{r.matricula}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.periodo}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.motivo}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                    </td>
                                    <td className="px-2 py-2 text-xs font-semibold text-sky-700">
                                        <Link to="/app/expedientes">Ver</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={10} total={516} />
            </CeInstSurface>
        </CeShell>
    );
}

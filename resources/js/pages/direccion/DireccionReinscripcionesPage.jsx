import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_REINSCRIPCIONES, CE_MOTIVOS_BLOQUEO } from '../../data/direccionEscuelaDemoData';
import { DE_REINSCRIPCION_FLUJO } from '../../data/direccionEscuelaDemoData';

export function DireccionReinscripcionesPage() {
    const actions = [
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Autorizar excepcional', variant: 'success', icon: 'check' },
        { to: '/app/direccion/autorizaciones-observaciones', label: 'Desbloquear institucional', variant: 'orange', icon: 'lockOpen' },
        { to: '/app/direccion/reinscripciones', label: 'Revisar bloqueo', variant: 'primary', icon: 'clipboardList' },
        { to: '/app/expedientes', label: 'Ver expediente', variant: 'purple', icon: 'folder' },
        { to: '/app/direccion/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowDownTray' },
        { to: '/app/direccion/reinscripciones?filtros=1', label: 'Filtros', variant: 'muted', icon: 'funnel' },
    ];
    const metrics = [
        { title: 'Reinscripciones en proceso', value: '412', trend: '↑ 7% vs. ciclo anterior', tone: 'blue' },
        { title: 'Reinscripciones bloqueadas', value: '58', trend: '↓ 3% vs. ciclo anterior', tone: 'red' },
        { title: 'Reinscripciones completadas', value: '1,656', trend: '↑ 9% vs. ciclo anterior', tone: 'green' },
        { title: 'Incidencias', value: '19', trend: '↑ 4% vs. ciclo anterior', tone: 'orange' },
        { title: 'Casos urgentes', value: '11', trend: '↑ 2% vs. ciclo anterior', tone: 'purple' },
        { title: 'En validación documental', value: '37', trend: '↑ 6% vs. ciclo anterior', tone: 'blue' },
    ];

    const rightPanel = (
        <>
            <CeInstSurface title="Motivos de bloqueo">
                <ul className="space-y-2 text-sm">
                    {CE_MOTIVOS_BLOQUEO.map((m) => (
                        <li key={m.label} className="flex items-center justify-between border-b border-slate-100 py-2">
                            <span className="text-slate-700">{m.label}</span>
                            <span className="font-bold text-slate-900">{m.n}</span>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Flujo de reinscripción" className="mt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {DE_REINSCRIPCION_FLUJO.map((s, i) => (
                        <span key={s.paso} className="flex items-center gap-1">
                            <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                                    s.estado === 'completo'
                                        ? 'bg-emerald-600'
                                        : s.estado === 'proceso'
                                          ? 'bg-sky-600'
                                          : 'bg-slate-300 text-slate-700'
                                }`}
                            >
                                {i + 1}
                            </span>
                            <span className="font-medium text-slate-800">{s.paso}</span>
                            {i < DE_REINSCRIPCION_FLUJO.length - 1 ? <span className="text-slate-400">→</span> : null}
                        </span>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Leyenda: azul en proceso · gris pendiente · verde completado.</p>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Seguimiento de reinscripciones"
            subtitle="Control y desbloqueo por autorización institucional. Sin adeudos financieros ni colegiaturas."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
            footerNote="© 2025 SICES v2 — Dirección de Escuela. Todos los derechos reservados."
        >
            <CeInstSurface title="Reinscripciones bloqueadas o en proceso">
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
                                    <td className="px-2 py-2">
                                        <Link to="/app/expedientes" className="text-sky-700 hover:underline">
                                            {r.matricula}
                                        </Link>
                                    </td>
                                    <td className="px-2 py-2 text-slate-600">{r.periodo}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.motivo === '—' ? 'Sin bloqueo' : r.motivo}</td>
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
                <CePaginationFoot showingFrom={1} showingTo={3} total={412} />
            </CeInstSurface>
        </CeShell>
    );
}

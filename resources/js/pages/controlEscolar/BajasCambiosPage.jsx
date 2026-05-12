import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_BAJAS } from '../../data/controlEscolarDemoData';

const MOTIVOS_DONUT = [
    { label: 'Cambio de residencia', pct: 37, color: '#1d4ed8' },
    { label: 'Problemas de salud', pct: 21, color: '#16a34a' },
    { label: 'Reorganización académica', pct: 18, color: '#ca8a04' },
    { label: 'Otros', pct: 24, color: '#64748b' },
];

export function BajasCambiosPage() {
    const actions = [
        { to: '/app/control-escolar/bajas-cambios', label: 'Nueva baja', variant: 'primary', icon: 'plus' },
        { to: '/app/control-escolar/bajas-cambios', label: 'Cambio de grupo', variant: 'primary', icon: 'users' },
        { to: '/app/control-escolar/bajas-cambios', label: 'Cambio de turno', variant: 'success', icon: 'clock' },
        { to: '/app/control-escolar/bajas-cambios', label: 'Cambio de programa', variant: 'purple', icon: 'graduationCap' },
        { to: '/app/control-escolar/bajas-cambios', label: 'Enviar a revisión', variant: 'orange', icon: 'send' },
        { to: '/app/control-escolar/bajas-cambios', label: 'Atender observación', variant: 'muted', icon: 'envelope' },
    ];
    const metrics = [
        { title: 'Bajas temporales', value: '19', trend: '↓ 11% vs. ciclo anterior', tone: 'red' },
        { title: 'Bajas definitivas', value: '27', trend: '↑ 20% vs. ciclo anterior', tone: 'purple' },
        { title: 'Cambios pendientes', value: '45', trend: '↑ 6% vs. ciclo anterior', tone: 'blue' },
        { title: 'Solicitudes observadas', value: '12', trend: '↑ 12% vs. ciclo anterior', tone: 'orange' },
    ];

    const grad = `conic-gradient(${MOTIVOS_DONUT.map((m, i, arr) => {
        const start = (arr.slice(0, i).reduce((s, x) => s + x.pct, 0) / 100) * 360;
        const end = (arr.slice(0, i + 1).reduce((s, x) => s + x.pct, 0) / 100) * 360;
        return `${m.color} ${start}deg ${end}deg`;
    }).join(', ')})`;

    const rightPanel = (
        <>
            <CeInstSurface title="Motivos frecuentes">
                <div className="ce-donut-wrap justify-center">
                    <div className="ce-donut h-36 w-36" style={{ background: grad }}>
                        <div className="ce-donut-inner">
                            <span className="ce-donut-total text-lg">100%</span>
                        </div>
                    </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {MOTIVOS_DONUT.map((m) => (
                        <li key={m.label} className="flex justify-between">
                            <span>
                                <span style={{ color: m.color }}>●</span> {m.label}
                            </span>
                            <span>{m.pct}%</span>
                        </li>
                    ))}
                </ul>
            </CeInstSurface>
            <CeInstSurface title="Cambios recientes" className="mt-4">
                <ul className="ce-timeline text-sm">
                    <li className="ce-timeline-item">
                        <span className="text-emerald-700">Baja temporal aprobada por Dirección — ENSVT-2024-0142</span>
                        <span className="text-xs text-slate-500">Hoy 08:10</span>
                    </li>
                    <li className="ce-timeline-item">
                        <span className="text-amber-700">Cambio de grupo en revisión</span>
                        <span className="text-xs text-slate-500">Ayer</span>
                    </li>
                    <li className="ce-timeline-item">
                        <span className="text-violet-800">Cambio de programa en revisión documental</span>
                        <span className="text-xs text-slate-500">Hace 2 días</span>
                    </li>
                </ul>
                <Link to="/app/control-escolar/bajas-cambios" className="ce-link-more mt-2 inline-block">
                    Ver todos &gt;
                </Link>
            </CeInstSurface>
        </>
    );

    return (
        <CeShell
            title="Bajas y cambios de estatus"
            subtitle="Registro y envío a revisión. Dirección o Educación Superior aprueban o rechazan según el flujo institucional."
            actions={actions}
            metrics={metrics}
            rightPanel={rightPanel}
        >
            <CeInstSurface title="Solicitudes de bajas y cambios">
                <div className="mb-3 flex flex-wrap gap-2">
                    <select className="inst-input text-sm">
                        <option>Todos los estatus</option>
                        <option>Pendiente</option>
                        <option>En revisión</option>
                    </select>
                    <input type="search" className="inst-input max-w-xs text-sm" placeholder="Buscar alumno…" />
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Alumno</th>
                                <th className="px-2 py-2 text-left">Tipo de cambio</th>
                                <th className="px-2 py-2 text-left">Motivo</th>
                                <th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                                <th className="px-2 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_BAJAS.map((r) => (
                                <tr key={r.alumno + r.fecha} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-medium text-slate-900">{r.alumno}</td>
                                    <td className="px-2 py-2 text-slate-700">{r.tipo}</td>
                                    <td className="px-2 py-2 text-slate-600">{r.motivo}</td>
                                    <td className="px-2 py-2 text-xs text-slate-600">{r.fecha}</td>
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
                <CePaginationFoot showingFrom={1} showingTo={7} total={57} />
            </CeInstSurface>
        </CeShell>
    );
}

import { Link } from 'react-router-dom';
import { CeInstSurface, CePaginationFoot, CeShell, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import { CE_DEMO_ALUMNO_TRAYECTORIA, CE_DEMO_MATERIAS_HISTORIAL, CE_MATERIAS } from '../../data/controlEscolarDemoData';

export function TrayectoriaCePage() {
    const alumno = CE_DEMO_ALUMNO_TRAYECTORIA;
    const actions = [
        { to: '/app/control-escolar/trayectoria', label: 'Consultar Kardex', variant: 'primary', icon: 'graduationCap' },
        { to: '/app/control-escolar/documentos', label: 'Generar constancia', variant: 'purple', icon: 'fileText' },
        { to: '/app/control-escolar/trayectoria', label: 'Ver historial', variant: 'orange', icon: 'scrollText' },
        { to: '/app/control-escolar/trayectoria', label: 'Equivalencias', variant: 'success', icon: 'arrowsLeftRight' },
        { to: '/app/control-escolar/reportes', label: 'Exportar', variant: 'muted', icon: 'arrowUpTray' },
    ];
    const metrics = [
        { title: 'Créditos aprobados', value: '186 / 240', trend: '77.5% avance', tone: 'green' },
        { title: 'Promedio general', value: '8.74', trend: 'Escala 0–10 · Bueno', tone: 'blue' },
        { title: 'Materias pendientes', value: '8 / 24', trend: 'En curso', tone: 'orange' },
        { title: 'Riesgo académico', value: 'Bajo', trend: 'Sin alertas críticas', tone: 'red' },
    ];

    const donutStyle = {
        background: 'conic-gradient(#16a34a 0deg 200deg, #e2e8f0 200deg 360deg)',
    };

    return (
        <CeShell
            title="Trayectoria académica"
            subtitle="Consulta operativa; la validación normativa de equivalencias corresponde a Educación Superior."
            actions={actions}
            metrics={metrics}
        >
            <CeInstSurface title="Selección de alumno">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-600">Selecciona un alumno</label>
                        <input type="search" className="inst-input mt-1 max-w-md text-sm" placeholder="Nombre, matrícula o CURP…" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm lg:max-w-md">
                        <p className="text-lg font-bold text-slate-900">{alumno.nombre}</p>
                        <p className="text-slate-600">
                            Matrícula: <strong>{alumno.matricula}</strong>
                        </p>
                        <p className="text-slate-600">
                            CURP: <strong>{alumno.curp}</strong>
                        </p>
                        <p className="text-slate-600">
                            Programa: <strong>{alumno.programa}</strong>
                        </p>
                        <p className="mt-1 flex items-center gap-2">
                            <span className="text-slate-600">Estatus:</span> <CeStatusBadge>{alumno.estatus}</CeStatusBadge>
                        </p>
                    </div>
                    <Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm whitespace-nowrap">
                        Cambiar alumno
                    </Link>
                </div>
            </CeInstSurface>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CeInstSurface title="Avance curricular">
                    <div className="ce-donut-wrap justify-center">
                        <div className="ce-donut" style={donutStyle}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total">77.5%</span>
                                <span className="ce-donut-label">Avance</span>
                            </div>
                        </div>
                    </div>
                </CeInstSurface>
                <CeInstSurface title="Materias aprobadas / reprobadas">
                    <p className="text-center text-2xl font-bold text-slate-900">48</p>
                    <p className="text-center text-xs text-slate-600">Materias cursadas en el programa</p>
                </CeInstSurface>
                <CeInstSurface title="Avance por semestre">
                    <div className="flex h-24 items-end justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <div key={s} className="flex flex-1 flex-col items-center gap-1">
                                <div
                                    className={`w-full rounded-t ${s === 6 ? 'bg-sky-600' : 'bg-sky-300'}`}
                                    style={{ height: `${20 + s * 8}px` }}
                                />
                                <span className="text-[10px] text-slate-500">{s}°</span>
                            </div>
                        ))}
                    </div>
                </CeInstSurface>
                <CeInstSurface title="Alertas académicas">
                    <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex justify-between border-b border-slate-100 py-2">2 materias con calificación reprobatoria ›</li>
                        <li className="flex justify-between border-b border-slate-100 py-2">1 materia próxima a límite de intentos ›</li>
                        <li className="flex justify-between py-2">Documentos pendientes en expediente ›</li>
                    </ul>
                </CeInstSurface>
            </div>

            <CeInstSurface title="Historial de materias" className="mt-4">
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                    <select className="inst-input text-sm">
                        <option>2024-2025</option>
                        <option>2023-2024</option>
                    </select>
                    <input type="search" className="inst-input max-w-xs text-sm" placeholder="Buscar materia…" />
                </div>
                <div className="ce-table-wrap">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-2 py-2 text-left">Clave</th>
                                <th className="px-2 py-2 text-left">Materia</th>
                                <th className="px-2 py-2 text-left">Periodo</th>
                                <th className="px-2 py-2 text-left">Calificación</th>
                                <th className="px-2 py-2 text-left">Créditos</th>
                                <th className="px-2 py-2 text-left">Estatus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CE_DEMO_MATERIAS_HISTORIAL.map((m) => (
                                <tr key={m.clave} className="border-t border-slate-100">
                                    <td className="px-2 py-2 font-mono text-xs">{m.clave}</td>
                                    <td className="px-2 py-2 text-slate-800">{m.nombre}</td>
                                    <td className="px-2 py-2 text-slate-600">{m.periodo}</td>
                                    <td className="px-2 py-2">{m.calificacion}</td>
                                    <td className="px-2 py-2">{m.creditos}</td>
                                    <td className="px-2 py-2">
                                        <CeStatusBadge>{m.estatus}</CeStatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <CePaginationFoot showingFrom={1} showingTo={6} total={CE_MATERIAS.length * 4} noun="materias" />
            </CeInstSurface>
        </CeShell>
    );
}

import { Link } from 'react-router-dom';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { MetricIcon } from '../../components/dashboard/ControlEscolarDashboardIcons';
import { useDashboardResumen } from './useDashboardResumen';

export function EducacionSuperiorDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();
    const data = fullPayload;
    const loading = fullPayload === null && !error;

    if (loading) {
        return <LoadingState text="Cargando tablero de Educación Superior..." />;
    }

    if (error && data === null) {
        return (
            <section className="grid gap-4">
                <PageHeader
                    title="Educación Superior"
                    subtitle="Autoridad académica central para Educación Normal y UPN."
                />
                <ErrorState message={error} />
            </section>
        );
    }

    const contexto = {
        subsistema: data?.contexto?.subsistema ?? 'Educación Normal y UPN',
        institucion: data?.contexto?.institucion ?? 'Coordinación',
        sede: data?.contexto?.sede ?? 'Según perfil',
        ciclo: data?.contexto?.ciclo_escolar ?? 'Ciclo vigente',
    };

    const m = data?.metricas ?? {};
    const cards = Array.isArray(data?.cards)
        ? data.cards
        : [
            { key: 'inst', title: 'Instituciones activas', value: m.instituciones_activas ?? 0, href: '/app/educacion-superior/instituciones' },
            { key: 'sed', title: 'Sedes / subsedes', value: m.sedes_registradas ?? 0, href: '/app/educacion-superior/sedes' },
        ];

    const iconFor = (title) => {
        if (title.includes('Instituciones')) return 'users';
        if (title.includes('Sedes')) return 'users';
        if (title.includes('Programas')) return 'books';
        if (title.includes('Planes')) return 'pen';
        if (title.includes('Solicitudes')) return 'clipboard';
        if (title.includes('validación') || title.includes('Validación')) return 'search';
        if (title.includes('egreso') || title.includes('Egreso')) return 'check';
        if (title.includes('emitidos') || title.includes('Documentos emitidos')) return 'check';
        if (title.includes('Alertas')) return 'message';
        return 'clipboard';
    };

    const toneFor = (title) => {
        if (title.includes('Alertas') || title.includes('pendientes') || title.includes('Pendientes') || title.includes('validación')) return 'warning';
        if (title.includes('emitidos') || title.includes('asignadas')) return 'success';
        return 'neutral';
    };

    const tabla = data?.tabla_solicitudes_matricula;
    const filas = Array.isArray(tabla?.filas) ? tabla.filas : [];
    const filasNorm = Array.isArray(data?.tabla_expedientes_normativa?.filas) ? data.tabla_expedientes_normativa.filas : [];
    const filasLib = Array.isArray(data?.tabla_documentos_pendientes_liberar?.filas) ? data.tabla_documentos_pendientes_liberar.filas : [];
    const alertas = Array.isArray(data?.alertas_normativas) ? data.alertas_normativas : [];
    const matInst = Array.isArray(data?.matricula_por_institucion) ? data.matricula_por_institucion : [];
    const matSub = Array.isArray(data?.matricula_por_subsistema) ? data.matricula_por_subsistema : [];
    const reportes = Array.isArray(data?.reportes_frecuentes) ? data.reportes_frecuentes : [];

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Educación Superior"
                subtitle="Autoridad académica central: instituciones, sedes, programas, planes, solicitudes de matrícula, validación normativa, certificación y reportes oficiales (Normal / UPN). Sin operación técnica de Sistemas."
            />
            {error ? <ErrorState message={error} /> : null}

            <nav className="dashboard-quick-actions" aria-label="Acciones rápidas">
                <p className="dashboard-quick-actions-head">Acciones rápidas</p>
                <Link to="/app/educacion-superior/instituciones" className="inst-btn inst-btn-primary text-sm">
                    Instituciones
                </Link>
                <Link to="/app/solicitudes-matricula" className="inst-btn inst-btn-secondary text-sm">
                    Solicitudes de matrícula
                </Link>
                <Link to="/app/educacion-superior/validaciones-normativas" className="inst-btn inst-btn-secondary text-sm">
                    Validaciones normativas
                </Link>
                <Link to="/app/educacion-superior/certificacion" className="inst-btn inst-btn-secondary text-sm">
                    Certificación
                </Link>
                <Link to="/app/consulta/documentos" className="inst-btn inst-btn-secondary text-sm">
                    Consulta pública
                </Link>
                <Link to="/app/notificaciones" className="inst-btn inst-btn-secondary text-sm">
                    Notificaciones
                </Link>
            </nav>

            <div className="context-chip-grid">
                <article className="context-chip">
                    <p className="context-chip-label">Alcance</p>
                    <p className="context-chip-value">{contexto.subsistema}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Coordinación</p>
                    <p className="context-chip-value">{contexto.institucion}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Sede / unidad</p>
                    <p className="context-chip-value">{contexto.sede}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Ciclo escolar</p>
                    <p className="context-chip-value">{contexto.ciclo}</p>
                </article>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {cards.map((card) => (
                    <article key={card.key} className={`metric-card metric-card-${toneFor(card.title)}`}>
                        <div className="metric-card-head">
                            <span className="metric-card-icon">
                                <MetricIcon name={iconFor(card.title)} />
                            </span>
                            <p className="metric-card-title">{card.title}</p>
                        </div>
                        <p className="metric-card-value">{card.value ?? 0}</p>
                        {card.href ? (
                            <Link to={card.href} className="inst-btn inst-btn-secondary metric-cta text-xs">
                                Abrir
                            </Link>
                        ) : null}
                    </article>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="inst-surface p-4">
                    <h3 className="font-semibold text-slate-900">Matrícula por institución</h3>
                    <div className="overflow-x-auto mt-3">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left">Institución</th>
                                    <th className="px-3 py-2 text-left">Matrícula activa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matInst.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-3 text-slate-500" colSpan={2}>
                                            Sin datos agregados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    matInst.map((row, idx) => (
                                        <tr key={`${row.institucion}-${idx}`} className="border-t border-slate-100">
                                            <td className="px-3 py-2">{row.institucion}</td>
                                            <td className="px-3 py-2">{row.matricula_activa}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="inst-surface p-4">
                    <h3 className="font-semibold text-slate-900">Matrícula por subsistema</h3>
                    <div className="overflow-x-auto mt-3">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left">Subsistema</th>
                                    <th className="px-3 py-2 text-left">Matrícula activa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matSub.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-3 text-slate-500" colSpan={2}>
                                            Sin datos agregados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    matSub.map((row, idx) => (
                                        <tr key={`${row.subsistema}-${idx}`} className="border-t border-slate-100">
                                            <td className="px-3 py-2">{row.subsistema}</td>
                                            <td className="px-3 py-2">{row.matricula_activa}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="inst-surface p-4">
                <h3 className="font-semibold text-slate-900">Reportes oficiales frecuentes</h3>
                <ul className="mt-2 space-y-2 text-sm">
                    {reportes.map((r) => (
                        <li key={r.titulo}>
                            <Link to={r.ruta} className="text-sky-700 hover:underline">
                                {r.titulo}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {filas.length > 0 ? (
                <section className="inst-surface p-4 grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{tabla?.titulo ?? 'Solicitudes de matrícula'}</h2>
                        <Link to="/app/solicitudes-matricula" className="inst-btn inst-btn-secondary text-sm">
                            Ir a solicitudes
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-600">
                                    <th className="py-2 pr-3">Alumno</th>
                                    <th className="py-2 pr-3">CURP</th>
                                    <th className="py-2 pr-3">Estado</th>
                                    <th className="py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100">
                                        <td className="py-2 pr-3">{row.alumno || '—'}</td>
                                        <td className="py-2 pr-3 font-mono text-xs">{row.curp || '—'}</td>
                                        <td className="py-2 pr-3">{row.estado}</td>
                                        <td className="py-2">
                                            <Link to={`${row.href ?? '/app/solicitudes-matricula'}?highlight=${row.id}`} className="text-sky-700 hover:underline">
                                                Revisar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {filasNorm.length > 0 ? (
                <section className="inst-surface grid gap-3 p-4">
                    <h2 className="text-lg font-semibold text-slate-900">{data?.tabla_expedientes_normativa?.titulo ?? 'Validaciones normativas'}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-600">
                                    <th className="py-2 pr-3">Institución</th>
                                    <th className="py-2 pr-3">Alumno</th>
                                    <th className="py-2 pr-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filasNorm.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100">
                                        <td className="py-2 pr-3">{row.institucion}</td>
                                        <td className="py-2 pr-3">{row.alumno}</td>
                                        <td className="py-2 pr-3 font-mono text-xs">{row.estado}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {filasLib.length > 0 ? (
                <section className="inst-surface grid gap-3 p-4">
                    <h2 className="text-lg font-semibold text-slate-900">{data?.tabla_documentos_pendientes_liberar?.titulo ?? 'Envío a proceso técnico'}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-600">
                                    <th className="py-2 pr-3">Institución</th>
                                    <th className="py-2 pr-3">Alumno</th>
                                    <th className="py-2 pr-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filasLib.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100">
                                        <td className="py-2 pr-3">{row.institucion}</td>
                                        <td className="py-2 pr-3">{row.alumno}</td>
                                        <td className="py-2 pr-3 font-mono text-xs">{row.estado}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {alertas.length > 0 ? (
                <section className="inst-surface grid gap-2 p-4">
                    <h2 className="text-lg font-semibold text-slate-900">Alertas institucionales</h2>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {alertas.map((a, idx) => (
                            <li key={idx}>
                                {a.titulo} — {a.institucion} (folio {a.folio})
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </section>
    );
}

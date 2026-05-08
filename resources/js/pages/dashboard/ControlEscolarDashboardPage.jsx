import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    IconFilePlus,
    IconRoute,
    IconUpload,
    IconUserPlus,
    IconUsers,
    MetricIcon,
} from '../../components/dashboard/ControlEscolarDashboardIcons';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';

export function ControlEscolarDashboardPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        controlEscolarApi
            .dashboard()
            .then((res) => {
                setData(res?.data ?? {});
                setError('');
            })
            .catch((err) => {
                setData(null);
                setError(err?.message ?? 'No fue posible cargar el dashboard.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingState text="Cargando tablero operativo..." />;
    }

    if (error && data === null) {
        return (
            <section className="grid gap-4">
                <PageHeader title="Panel operativo de Control Escolar" subtitle="Gestión diaria de captura académica, seguimiento de trayectoria y solicitud de certificación." />
                <ErrorState message={error} />
            </section>
        );
    }

    const contexto = {
        subsistema: data?.contexto?.subsistema ?? 'Por definir en configuración institucional',
        institucion: data?.contexto?.institucion ?? 'Por definir en configuración institucional',
        sede: data?.contexto?.sede ?? 'Por definir en configuración institucional',
        ciclo: data?.contexto?.ciclo_escolar ?? 'No configurado',
    };

    const m = data?.metricas ?? {};
    const cards = [
        { iconKey: 'users', tone: 'primary', title: 'Alumnos activos', value: m.alumnos_activos ?? 0, description: 'Seguimiento escolar diario.', to: '/app/expedientes', cta: 'Ver expedientes' },
        { iconKey: 'clipboard', tone: 'warning', title: 'Matrículas incompletas', value: m.matriculas_incompletas ?? 0, description: (m.matriculas_incompletas ?? 0) > 0 ? 'Requieren completar captura.' : 'Sin matrículas pendientes por completar.', to: '/app/expedientes?tab=matricula', cta: 'Corregir matrícula' },
        { iconKey: 'books', tone: 'warning', title: 'Inscripciones pendientes', value: m.inscripciones_pendientes ?? 0, description: (m.inscripciones_pendientes ?? 0) > 0 ? 'Regularice periodos de inscripción.' : 'No hay inscripciones pendientes.', to: '/app/expedientes?tab=inscripcion', cta: 'Inscribir' },
        { iconKey: 'layers', tone: 'purple', title: 'Cargas académicas pendientes', value: m.cargas_academicas_pendientes ?? 0, description: (m.cargas_academicas_pendientes ?? 0) > 0 ? 'Ajustar carga por plan.' : 'Sin cargas pendientes.', to: '/app/expedientes?tab=carga', cta: 'Generar carga' },
        { iconKey: 'pen', tone: 'warning', title: 'Calificaciones pendientes', value: m.calificaciones_pendientes ?? 0, description: (m.calificaciones_pendientes ?? 0) > 0 ? 'Captura o importación pendiente.' : 'Sin captura pendiente.', to: '/app/expedientes?tab=calificaciones', cta: 'Capturar calificaciones' },
        { iconKey: 'alert', tone: 'danger', title: 'Importaciones con errores', value: m.importaciones_con_errores ?? 0, description: (m.importaciones_con_errores ?? 0) > 0 ? 'Revise incidencias de importación.' : 'No hay incidencias de importación.', to: '/app/importaciones', cta: 'Revisar importaciones' },
        { iconKey: 'check', tone: 'success', title: 'Trayectorias listas para certificar', value: m.trayectorias_listas_para_certificar ?? 0, description: (m.trayectorias_listas_para_certificar ?? 0) > 0 ? 'Documentos listos para solicitud.' : 'Aún no hay trayectorias listas.', to: '/app/expedientes?tab=trayectoria', cta: 'Solicitar certificado' },
        { iconKey: 'message', tone: 'danger', title: 'Documentos con observaciones', value: m.documentos_con_observaciones ?? 0, description: (m.documentos_con_observaciones ?? 0) > 0 ? 'Atienda observaciones pendientes.' : 'Sin observaciones pendientes.', to: '/app/observaciones', cta: 'Atender observaciones' },
        { iconKey: 'search', tone: 'neutral', title: 'Solicitudes en revisión', value: m.solicitudes_en_revision ?? 0, description: (m.solicitudes_en_revision ?? 0) > 0 ? 'Espere dictaminación institucional.' : 'No hay solicitudes en revisión.', to: '/app/documentos', cta: 'Ver solicitudes' },
    ];
    const pendientes = Array.isArray(data?.pendientes_prioritarios) ? data.pendientes_prioritarios : [];

    return (
        <section className="grid gap-4">
            <PageHeader title="Panel operativo de Control Escolar" subtitle="Gestión diaria de captura académica, seguimiento de trayectoria y solicitud de certificación." />
            {error ? <ErrorState message={error} /> : null}

            <nav className="dashboard-quick-actions" aria-label="Acciones principales">
                <p className="dashboard-quick-actions-head">Acciones principales</p>
                <Link to="/app/expedientes?tab=certificacion" className="inst-btn inst-btn-primary text-sm">
                    <IconFilePlus className="h-4 w-4" />
                    Crear solicitud de certificación
                </Link>
                <Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm">
                    <IconUsers className="h-4 w-4" />
                    Ir a alumnos
                </Link>
                <Link to="/app/expedientes?tab=trayectoria" className="inst-btn inst-btn-secondary text-sm">
                    <IconRoute className="h-4 w-4" />
                    Ver trayectorias listas
                </Link>
                <Link to="/app/alumnos/crear" className="inst-btn inst-btn-secondary text-sm">
                    <IconUserPlus className="h-4 w-4" />
                    Registrar alumno
                </Link>
                <Link to="/app/importaciones" className="inst-btn inst-btn-secondary text-sm">
                    <IconUpload className="h-4 w-4" />
                    Importar historial
                </Link>
            </nav>

            <div className="dashboard-hero">
                <h3 className="dashboard-hero-title">Resumen institucional del ciclo</h3>
                <p className="dashboard-hero-subtitle">Este tablero concentra prioridades de captura, regularización académica y atención documental.</p>
            </div>
            <div className="context-chip-grid">
                <article className="context-chip">
                    <p className="context-chip-label">Subsistema</p>
                    <p className="context-chip-value">{contexto.subsistema}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Institución</p>
                    <p className="context-chip-value">{contexto.institucion}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Sede / CCT</p>
                    <p className="context-chip-value">{contexto.sede}</p>
                </article>
                <article className="context-chip">
                    <p className="context-chip-label">Ciclo escolar activo</p>
                    <p className="context-chip-value">{contexto.ciclo}</p>
                </article>
            </div>
            <div className="inst-surface p-4">
                <h3 className="font-semibold text-slate-900">Mis expedientes pendientes</h3>
                <div className="overflow-x-auto mt-3">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-3 py-2 text-left">Alumno</th>
                                <th className="px-3 py-2 text-left">Matrícula</th>
                                <th className="px-3 py-2 text-left">Problema</th>
                                <th className="px-3 py-2 text-left">Prioridad</th>
                                <th className="px-3 py-2 text-left">Siguiente acción</th>
                                <th className="px-3 py-2 text-left">Abrir expediente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendientes.length === 0 ? (
                                <tr className="border-t border-slate-100">
                                    <td className="px-3 py-4 text-slate-500" colSpan={6}>
                                        Sin pendientes prioritarios en este momento. Use las acciones de arriba para iniciar captura o revisión.
                                    </td>
                                </tr>
                            ) : (
                                pendientes.map((p, idx) => (
                                    <tr key={`${p.alumno}-${idx}`} className="border-t border-slate-100">
                                        <td className="px-3 py-2">{p.alumno}</td>
                                        <td className="px-3 py-2">{p.matricula}</td>
                                        <td className="px-3 py-2">{p.problema}</td>
                                        <td className="px-3 py-2">
                                            <span className={`status-badge ${p.prioridad === 'Alta' ? 'inst-badge inst-badge-danger' : p.prioridad === 'Media' ? 'inst-badge inst-badge-warning' : 'inst-badge inst-badge-neutral'}`}>
                                                {p.prioridad}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">{p.siguiente_accion}</td>
                                        <td className="px-3 py-2"><Link to={p.expediente_url ?? '/app/expedientes'} className="inst-btn inst-btn-secondary text-xs">Abrir expediente</Link></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                {cards.map((card) => (
                    <article key={card.title} className={`metric-card metric-card-${card.tone}`}>
                        <div className="metric-card-head">
                            <span className="metric-card-icon">
                                <MetricIcon name={card.iconKey} />
                            </span>
                            <p className="metric-card-title">{card.title}</p>
                        </div>
                        <p className="metric-card-value">{card.value}</p>
                        <p className="metric-card-description">{card.description}</p>
                        <Link to={card.to} className={`inst-btn ${card.tone === 'danger' ? 'inst-btn-danger' : card.tone === 'success' ? 'inst-btn-success' : 'inst-btn-secondary'} metric-cta text-xs`}>
                            {card.cta}
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

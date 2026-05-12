<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
=======
import { Link } from 'react-router-dom';
import { CeShell } from '../../components/controlEscolar/CeShell';
import { CeInstSurface, CeStatusBadge } from '../../components/controlEscolar/CeShell';
>>>>>>> 26e352c (Aplicacion de roles nuevos y cambio de vistas)
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import {
    CE_DASHBOARD_ESTATUS_ALUMNOS,
    CE_DEMO_PROCESOS_RECIENTES,
    ceTotalAlumnosEstatus,
} from '../../data/controlEscolarDemoData';
import { useDashboardResumen } from './useDashboardResumen';

function buildDonutGradient() {
    const segs = CE_DASHBOARD_ESTATUS_ALUMNOS;
    const total = ceTotalAlumnosEstatus();
    let acc = 0;
    const parts = segs.map((s) => {
        const start = acc;
        const span = (s.count / total) * 360;
        acc += span;
        return `${s.color} ${start}deg ${acc}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
}

function Icon({ d, className = 'h-4 w-4' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
            strokeLinejoin="round" className={className} aria-hidden="true">
            <path d={d} />
        </svg>
    );
}
const ICONS = {
    users: [
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    ],

    alert: [
        'M12 13h.01',
        'M12 6v3',
        'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
    ],

    check: [
        'M22 11.08V12a10 10 0 1 1-5.93-9.14',
        'M22 4 12 14.01l-3-3',
    ],

    message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',

    search: [
        'M21 21l-4.35-4.35',
        'M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
    ],

    clipboard: [
        'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        'M9 2h6v4H9z',
    ],

    layers: [
        'M12 2 2 7l10 5 10-5-10-5z',
        'M2 17l10 5 10-5',
        'M2 12l10 5 10-5',
    ],

    pen: [
        'M10 13h4',
        'M12 6v7',
        'M16 8V6H8v2',
        'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
    ],

    books: [
        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
        'M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
    ],

    filePlus: [
        'M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35',
        'M14 2v5a1 1 0 0 0 1 1h5',
        'M14 19h6',
        'M17 16v6',
    ],

    userPlus: [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
        'M19 8v6',
        'M16 11h6',
    ],

    upload: [
        'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
        'M17 8l-5-5-5 5',
        'M12 3v12',
    ],

    route: [
        'M5 7a2 2 0 0 0-2 2v11',
        'M5.803 18H5a2 2 0 0 0 0 4h9.5a.5.5 0 0 0 .5-.5V21',
        'M9 15V4a2 2 0 0 1 2-2h9.5a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H11a2 2 0 0 1 0-4h10',
    ],

    chevronDown: 'M6 9l6 6 6-6',

    chevronRight: 'M9 18l6-6-6-6',

    cert: [
        'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
        'M9 9.5l2 2 4-4',
    ],

    bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
};

const PRIORITY_ORDER = { Alta: 0, Media: 1, Baja: 2 };

function groupPendientes(pendientes) {
    const map = {};
    for (const p of pendientes) {
        const key = p.problema ?? 'Sin clasificar';
        if (!map[key]) map[key] = { label: key, items: [], maxPriority: 2 };
        map[key].items.push(p);
        const prio = PRIORITY_ORDER[p.prioridad] ?? 2;
        if (prio < map[key].maxPriority) map[key].maxPriority = prio;
    }
    return Object.values(map).sort((a, b) => a.maxPriority - b.maxPriority);
}

const BATCH_URL = {
    'Expediente incompleto: falta matricula activa': '/app/expedientes?tab=matricula',
    'Inscripcion pendiente': '/app/expedientes?tab=inscripcion',
    'Carga academica pendiente': '/app/expedientes?tab=carga',
    'Documento con observaciones': '/app/observaciones',
};
function batchUrl(label) {
    return BATCH_URL[label] ?? '/app/expedientes';
}

const PRIORITY_STYLES = {
    Alta:  { badge: 'ce-badge ce-badge-danger',  dot: 'ce-dot-red' },
    Media: { badge: 'ce-badge ce-badge-warning', dot: 'ce-dot-orange' },
    Baja:  { badge: 'ce-badge ce-badge-neutral', dot: 'ce-dot-gray' },
};
function priorityDot(maxPriority) {
    if (maxPriority === 0) return 'ce-dot-red';
    if (maxPriority === 1) return 'ce-dot-orange';
    return 'ce-dot-gray';
}
function batchBtnClass(maxPriority) {
    if (maxPriority === 0) return 'ce-btn ce-btn-danger-soft text-xs';
    if (maxPriority === 1) return 'ce-btn ce-btn-warning-soft text-xs';
    return 'ce-btn ce-btn-secondary text-xs';
}

export function ControlEscolarDashboardPage() {
<<<<<<< HEAD
    const [data, setData]       = useState(null);
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(true);
    const [openGroups, setOpenGroups] = useState({});

    useEffect(() => {
        setLoading(true);
        controlEscolarApi
            .dashboard()
            .then((res) => { setData(res?.data ?? {}); setError(''); })
            .catch((err) => { setData(null); setError(err?.message ?? 'No fue posible cargar el dashboard.'); })
            .finally(() => setLoading(false));
    }, []);
=======
    const { error, fullPayload } = useDashboardResumen();
    const data = fullPayload;
    const loading = fullPayload === null && !error;
    const m = data?.metricas ?? {};
>>>>>>> 26e352c (Aplicacion de roles nuevos y cambio de vistas)

    const pendientes = useMemo(
        () => Array.isArray(data?.pendientes_prioritarios) ? data.pendientes_prioritarios : [],
        [data]
    );
    const grupos = useMemo(() => groupPendientes(pendientes), [pendientes]);

    const toggleGroup = (label) =>
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

    if (loading) return <LoadingState text="Cargando tablero operativo..." />;

    if (error && data === null) {
        return (
            <section className="grid gap-4">
<<<<<<< HEAD
                <PageHeader
                    title="Panel operativo de Control Escolar"
                    subtitle="Gestión diaria de captura académica, seguimiento de trayectoria y solicitud de certificación."
                />
=======
                <h1 className="text-lg font-bold text-slate-900">Dashboard Control Escolar</h1>
>>>>>>> 26e352c (Aplicacion de roles nuevos y cambio de vistas)
                <ErrorState message={error} />
            </section>
        );
    }

<<<<<<< HEAD
    const ctx = {
        subsistema: data?.contexto?.subsistema ?? 'Por definir',
        institucion: data?.contexto?.institucion ?? 'Por definir',
        sede: data?.contexto?.sede ?? 'Por definir',
        ciclo: data?.contexto?.ciclo_escolar ?? 'No configurado',
    };

    const m = data?.metricas ?? {};

    const totalAlta = pendientes.filter(p => p.prioridad === 'Alta').length;
    const totalMedia = pendientes.filter(p => p.prioridad === 'Media').length;

    const kpis = [
        { icon: 'users',   label: 'Alumnos activos',         value: m.alumnos_activos ?? 0,                    color: 'blue'   },
        { icon: 'alert',   label: 'Pendientes alta prioridad', value: totalAlta,                                color: 'red'    },
        { icon: 'pen',     label: 'Pendientes media prioridad',value: totalMedia,                               color: 'orange' },
        { icon: 'cert',    label: 'Listos para certificar',   value: m.trayectorias_listas_para_certificar ?? 0, color: 'green'  },
    ];

    const metricas = [
        { label: 'Matrículas incompletas',   value: m.matriculas_incompletas ?? 0,           to: '/app/expedientes?tab=matricula',     color: 'orange', max: m.alumnos_activos || 1 },
        { label: 'Inscripciones pendientes', value: m.inscripciones_pendientes ?? 0,          to: '/app/expedientes?tab=inscripcion',   color: 'orange', max: m.alumnos_activos || 1 },
        { label: 'Cargas académicas pend.',  value: m.cargas_academicas_pendientes ?? 0,      to: '/app/expedientes?tab=carga',         color: 'purple', max: m.alumnos_activos || 1 },
        { label: 'Calificaciones pendientes',value: m.calificaciones_pendientes ?? 0,         to: '/app/expedientes?tab=calificaciones',color: 'yellow', max: m.alumnos_activos || 1 },
        { label: 'Importaciones con errores',value: m.importaciones_con_errores ?? 0,         to: '/app/importaciones',                 color: 'red',    max: m.alumnos_activos || 1 },
        { label: 'Docs con observaciones',   value: m.documentos_con_observaciones ?? 0,      to: '/app/observaciones',                 color: 'red',    max: m.alumnos_activos || 1 },
        { label: 'Listos para certificar',   value: m.trayectorias_listas_para_certificar ?? 0,to: '/app/expedientes?tab=trayectoria', color: 'green',  max: m.alumnos_activos || 1 },
        { label: 'Solicitudes en revisión',  value: m.solicitudes_en_revision ?? 0,           to: '/app/documentos',                   color: 'gray',   max: m.alumnos_activos || 1 },
    ];

    const BAR_COLORS = {
        orange: '#FB8C00', purple: '#8B5CF6', yellow: '#F59E0B',
        red: '#E24B4A', green: '#43A047', gray: '#8B9DB5',
    };
    const VAL_CLASSES = {
        orange: 'ce-val-orange', purple: 'ce-val-purple', yellow: 'ce-val-yellow',
        red: 'ce-val-red', green: 'ce-val-green', gray: 'ce-val-gray',
    };

    return (
        <>
            <style>{`
                /* kpi cards */
    .ce-kpi-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
    .ce-kpi {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: transform .18s ease, box-shadow .18s ease;
    }
    .ce-kpi:hover { transform: translateY(-2px); box-shadow: 0 16px 26px rgba(15,23,42,.12); }
    .ce-kpi-ico { width: 38px; height: 38px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ce-kpi-ico.blue   { background: var(--inst-blue-soft);   color: #1e3a8a; }
    .ce-kpi-ico.red    { background: var(--inst-red-soft);    color: var(--inst-red); }
    .ce-kpi-ico.orange { background: var(--inst-yellow-soft); color: var(--inst-yellow); }
    .ce-kpi-ico.green  { background: var(--inst-green-soft);  color: var(--inst-green); }
    .ce-kpi-val { font-size: 26px; font-weight: 800; color: var(--inst-navy); line-height: 1; }
    .ce-kpi-lbl { font-size: 11px; color: var(--inst-muted); margin-top: 2px; font-weight: 500; }
 
    /* Main layout */
    .ce-main { display: grid; grid-template-columns: 1fr 288px; gap: 12px; align-items: start; }
 
    /* quick actions bar */
    .ce-qa {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        padding: 12px 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
    }
    .ce-qa-label { font-size: 11px; font-weight: 700; color: var(--inst-muted-2); letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
 
    /* context */
    .ce-ctx-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10px; }
    .ce-ctx {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-left: 3px solid var(--inst-blue);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        padding: 10px 14px;
    }
    .ce-ctx-l { font-size: 11px; color: var(--inst-muted); margin-bottom: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .ce-ctx-v { font-size: 13px; font-weight: 600; color: var(--inst-navy); }
 
    /*  table */
    .ce-table-card {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        overflow: hidden;
    }
    .ce-table-head {
        padding: 12px 16px;
        border-bottom: 1px solid var(--inst-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--inst-surface-muted);
    }
    .ce-table-head-title { font-size: 13px; font-weight: 700; color: var(--inst-navy); }
    .ce-empty { padding: 16px; font-size: 13px; color: var(--inst-muted); }
 
    .ce-group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--inst-surface-muted);
        border-bottom: 1px solid var(--inst-border);
        cursor: pointer;
        user-select: none;
    }
    .ce-group-header:hover { background: #edf2fb; }
    .ce-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ce-dot-red    { background: var(--inst-red); }
    .ce-dot-orange { background: #d97706; }
    .ce-dot-gray   { background: var(--inst-muted); }
    .ce-group-label { font-size: 12px; font-weight: 600; color: var(--inst-text); flex: 1; }
    .ce-group-count { font-size: 11px; color: var(--inst-muted); }
    .ce-chevron { color: var(--inst-muted); transition: transform .2s; }
    .ce-chevron.open { transform: rotate(90deg); }
 
    .ce-erow {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 8px;
        align-items: center;
        padding: 9px 16px;
        border-bottom: 1px solid var(--inst-border);
    }
    .ce-erow:last-child { border-bottom: none; }
    .ce-erow:hover { background: var(--inst-surface-muted); }
    .ce-erow-name { font-size: 12px; font-weight: 600; color: var(--inst-text); }
    .ce-erow-mat  { font-size: 11px; color: var(--inst-muted); }
    .ce-erow-accion { font-size: 11px; color: var(--inst-muted-2); white-space: nowrap; }
 
    /* badges */
    .ce-badge { font-size: 10px; padding: 2px 8px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
    .ce-badge-danger  { background: var(--inst-red-soft);    color: var(--inst-red); }
    .ce-badge-warning { background: var(--inst-yellow-soft); color: var(--inst-yellow); }
    .ce-badge-neutral { background: var(--inst-surface-muted); color: var(--inst-muted-2); }
 
    /* buttons */
    .ce-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1px solid var(--inst-border);
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
        font-weight: 600;
        transition: all .18s ease;
    }
    .ce-btn-primary      { background: var(--inst-blue);        color: #fff; border-color: var(--inst-blue); }
    .ce-btn-secondary    { background: var(--inst-surface);     color: var(--inst-text); border-color: var(--inst-border); }
    .ce-btn-danger-soft  { background: var(--inst-red-soft);    color: var(--inst-red);    border-color: #fecaca; }
    .ce-btn-warning-soft { background: var(--inst-yellow-soft); color: var(--inst-yellow); border-color: #fcd34d; }
    .ce-btn-success      { background: var(--inst-green-soft);  color: var(--inst-green);  border-color: #86efac; }
    .ce-btn:hover { opacity: .85; transform: translateY(-1px); }
 
    /* sidebar */
    .ce-sidebar { display: flex; flex-direction: column; gap: 10px; }
    .ce-metric-card {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        overflow: hidden;
    }
    .ce-metric-head {
        padding: 10px 14px;
        border-bottom: 1px solid var(--inst-border);
        font-size: 12px;
        font-weight: 700;
        color: var(--inst-navy);
        background: var(--inst-surface-muted);
        text-transform: uppercase;
        letter-spacing: .04em;
    }
    .ce-mrow {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 14px;
        border-bottom: 1px solid var(--inst-border);
        text-decoration: none;
        transition: background .12s;
    }
    .ce-mrow:last-child { border-bottom: none; }
    .ce-mrow:hover { background: var(--inst-surface-muted); }
    .ce-mrow-label { font-size: 11px; color: var(--inst-muted-2); width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; font-weight: 500; }
    .ce-bar-bg { flex: 1; height: 5px; background: var(--inst-surface-muted); border-radius: 3px; overflow: hidden; }
    .ce-bar    { height: 5px; border-radius: 3px; }
    .ce-mrow-val { font-size: 13px; font-weight: 700; min-width: 22px; text-align: right; flex-shrink: 0; }
    .ce-val-orange { color: var(--inst-yellow); }
    .ce-val-purple { color: #7c3aed; }
    .ce-val-yellow { color: #92600a; }
    .ce-val-red    { color: var(--inst-red); }
    .ce-val-green  { color: var(--inst-green); }
    .ce-val-gray   { color: var(--inst-muted); }
 
    .ce-quick-card {
        background: var(--inst-surface);
        border: 1px solid var(--inst-border);
        border-radius: var(--inst-radius);
        box-shadow: var(--inst-shadow);
        padding: 12px 14px;
    }
    .ce-quick-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--inst-navy);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: .04em;
    }
    .ce-quick-grid  { display: flex; flex-direction: column; gap: 5px; }
 
    @media (max-width: 900px) {
        .ce-kpi-grid  { grid-template-columns: repeat(2,1fr); }
        .ce-main      { grid-template-columns: 1fr; }
        .ce-ctx-grid  { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 640px) {
        .ce-kpi-grid  { grid-template-columns: 1fr; }
        .ce-ctx-grid  { grid-template-columns: 1fr; }
    }
            `}</style>

            <section className="grid gap-4">
                <PageHeader
                    title="Panel operativo de Control Escolar"
                    subtitle="Gestión diaria de captura académica, seguimiento de trayectoria y solicitud de certificación."
                />
                {error ? <ErrorState message={error} /> : null}

                <nav className="ce-qa" aria-label="Acciones principales">
                    <span className="ce-qa-label">Acciones</span>
                    <Link to="/app/expedientes?tab=certificacion" className="ce-btn ce-btn-primary">
                        <Icon d={ICONS.filePlus} /> Crear solicitud de certificación
                    </Link>
                    <Link to="/app/expedientes" className="ce-btn ce-btn-secondary">
                        <Icon d={ICONS.users} /> Ir a alumnos
                    </Link>
                    <Link to="/app/expedientes?tab=trayectoria" className="ce-btn ce-btn-secondary">
                        <Icon d={ICONS.route} /> Ver trayectorias listas
                    </Link>
                    <Link to="/app/alumnos/crear" className="ce-btn ce-btn-secondary">
                        <Icon d={ICONS.userPlus} /> Registrar alumno
                    </Link>
                    <Link to="/app/importaciones" className="ce-btn ce-btn-secondary">
                        <Icon d={ICONS.upload} /> Importar historial
                    </Link>
                </nav>

                <div className="ce-ctx-grid">
                    <div className="ce-ctx"><p className="ce-ctx-l">Subsistema</p><p className="ce-ctx-v">{ctx.subsistema}</p></div>
                    <div className="ce-ctx"><p className="ce-ctx-l">Institución</p><p className="ce-ctx-v">{ctx.institucion}</p></div>
                    <div className="ce-ctx"><p className="ce-ctx-l">Sede / CCT</p><p className="ce-ctx-v">{ctx.sede}</p></div>
                    <div className="ce-ctx" style={{ borderLeftColor: '#43A047' }}>
                        <p className="ce-ctx-l">Ciclo escolar activo</p>
                        <p className="ce-ctx-v" style={{ color: '#3B6D11' }}>{ctx.ciclo}</p>
                    </div>
                </div>

                <div className="ce-kpi-grid">
                    {kpis.map((k) => (
                        <div key={k.label} className="ce-kpi">
                            <div className={`ce-kpi-ico ${k.color}`}>
                                <Icon d={ICONS[k.icon]} className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="ce-kpi-val">{k.value}</div>
                                <div className="ce-kpi-lbl">{k.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="ce-main">

                    <div>
                        <div className="ce-table-card">
                            <div className="ce-table-head">
                                <span className="ce-table-head-title">Mis expedientes pendientes</span>
                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                    {pendientes.length} expediente{pendientes.length !== 1 ? 's' : ''} · agrupados por problema
                                </span>
                            </div>

                            {grupos.length === 0 ? (
                                <p className="ce-empty">
                                    Sin pendientes prioritarios. Use las acciones de arriba para iniciar captura o revisión.
                                </p>
                            ) : (
                                grupos.map((grupo) => {
                                    const isOpen = openGroups[grupo.label] !== false; // abierto por defecto
                                    return (
                                        <div key={grupo.label}>
                                            {/* Encabezado de grupo */}
                                            <div
                                                className="ce-group-header"
                                                onClick={() => toggleGroup(grupo.label)}
                                                role="button"
                                                aria-expanded={isOpen}
                                            >
                                                <span className={`ce-dot ${priorityDot(grupo.maxPriority)}`} />
                                                <span className="ce-group-label">{grupo.label}</span>
                                                <span className="ce-group-count">{grupo.items.length} alumno{grupo.items.length !== 1 ? 's' : ''}</span>
                                                <Link
                                                    to={batchUrl(grupo.label)}
                                                    className={batchBtnClass(grupo.maxPriority)}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Atender todos
                                                </Link>
                                                <span className={`ce-chevron${isOpen ? ' open' : ''}`}>
                                                    <Icon d={ICONS.chevronRight} className="h-3.5 w-3.5" />
                                                </span>
                                            </div>

                                            
                                            {isOpen && grupo.items.map((p, idx) => {
                                                const pStyles = PRIORITY_STYLES[p.prioridad] ?? PRIORITY_STYLES.Baja;
                                                return (
                                                    <div key={`${p.alumno}-${idx}`} className="ce-erow">
                                                        <div>
                                                            <div className="ce-erow-name">{p.alumno}</div>
                                                            <div className="ce-erow-mat">{p.matricula}</div>
                                                        </div>
                                                        <span className={pStyles.badge}>{p.prioridad}</span>
                                                        <span className="ce-erow-accion">{p.siguiente_accion}</span>
                                                        <Link
                                                            to={p.expediente_url ?? '/app/expedientes'}
                                                            className="ce-btn ce-btn-secondary"
                                                            style={{ fontSize: 11, padding: '4px 10px' }}
                                                        >
                                                            Abrir
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="ce-sidebar">

                        <div className="ce-metric-card">
                            <div className="ce-metric-head">Resumen del ciclo</div>
                            {metricas.map((met) => {
                                const pct = Math.min(100, Math.round((met.value / met.max) * 100));
                                return (
                                    <Link key={met.label} to={met.to} className="ce-mrow">
                                        <span className="ce-mrow-label">{met.label}</span>
                                        <div className="ce-bar-bg">
                                            <div
                                                className="ce-bar"
                                                style={{ width: `${pct}%`, background: BAR_COLORS[met.color] }}
                                            />
                                        </div>
                                        <span className={`ce-mrow-val ${VAL_CLASSES[met.color]}`}>{met.value}</span>
                                    </Link>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </section>
        </>
=======
    const expedPend = Math.max(Number(m.matriculas_incompletas ?? 0), 12);
    const insVal = Math.max(Number(m.inscripciones_pendientes ?? 0), 28);
    const reinBloq = Math.max(Number(m.cargas_academicas_pendientes ?? 0), 14);
    const docGen = Math.max(Number(m.calificaciones_pendientes ?? 0), 18);
    const solCorr = Math.max(Number(m.documentos_con_observaciones ?? 0), 7);

    const misPendientes = [
        { label: 'Inscripciones por validar', n: insVal, to: '/app/control-escolar/inscripciones' },
        { label: 'Reinscripciones bloqueadas', n: reinBloq, to: '/app/control-escolar/reinscripciones' },
        { label: 'Documentos por generar', n: docGen, to: '/app/control-escolar/documentos' },
        { label: 'Solicitudes de corrección', n: solCorr, to: '/app/control-escolar/solicitudes' },
        { label: 'Expedientes incompletos', n: expedPend, to: '/app/control-escolar/expedientes' },
    ];

    const procesos = (Array.isArray(data?.documentos_en_proceso) && data.documentos_en_proceso.length > 0
        ? data.documentos_en_proceso.map((r) => ({
            alumno: r.alumno ?? '—',
            matricula: r.matricula ?? '—',
            tramite: 'Seguimiento documental / expediente',
            fecha: new Date().toLocaleDateString('es-MX'),
            estatus: r.estado ?? 'En proceso',
        }))
        : CE_DEMO_PROCESOS_RECIENTES);

    const actions = [
        { to: '/app/alumnos/crear', label: 'Nuevo alumno', variant: 'primary', icon: 'userPlus' },
        { to: '/app/control-escolar/inscripciones', label: 'Nueva inscripción', variant: 'success', icon: 'clipboardList' },
        { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', variant: 'success', icon: 'refreshCw' },
        { to: '/app/control-escolar/documentos', label: 'Generar constancia', variant: 'purple', icon: 'fileText' },
        { to: '/app/control-escolar/trayectoria', label: 'Kardex', variant: 'orange', icon: 'graduationCap' },
        { to: '/app/control-escolar/solicitudes', label: 'Más opciones', variant: 'muted', icon: 'moreHorizontal' },
    ];

    const metrics = [
        { title: 'Expedientes pendientes', value: expedPend, trend: '↓ 6% vs. ciclo anterior', tone: 'blue' },
        { title: 'Inscripciones por validar', value: insVal, trend: '↑ 4% vs. ciclo anterior', tone: 'green' },
        { title: 'Reinscripciones bloqueadas', value: reinBloq, trend: '↑ 2% vs. ciclo anterior', tone: 'red' },
        { title: 'Documentos por generar', value: docGen, trend: '↓ 3% vs. ciclo anterior', tone: 'purple' },
        { title: 'Solicitudes de corrección', value: solCorr, trend: '↑ 1% vs. ciclo anterior', tone: 'orange' },
    ];

    const totalDonut = ceTotalAlumnosEstatus();

    return (
        <CeShell
            title="Dashboard Control Escolar"
            subtitle="Operación académica escolar para Educación Normal y UPN. La matrícula oficial la asigna Educación Superior; aquí se prepara expediente, inscripción, trayectoria y documentos operativos."
            actions={actions}
            metrics={metrics}
            rightPanel={null}
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Mis pendientes">
                    <ul className="grid gap-2">
                        {misPendientes.map((p) => (
                            <li key={p.label} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                                <span className="text-slate-700">{p.label}</span>
                                <span className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{p.n}</span>
                                    <Link to={p.to} className="text-xs font-semibold text-sky-700">
                                        Ir
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/control-escolar/expedientes" className="ce-link-more">
                        Ver todos mis pendientes &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Alumnos por estatus">
                    <div className="ce-donut-wrap">
                        <div className="ce-donut" style={{ background: buildDonutGradient() }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total">{totalDonut.toLocaleString('es-MX')}</span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>
                        <div className="ce-legend">
                            {CE_DASHBOARD_ESTATUS_ALUMNOS.map((r) => (
                                <div key={r.key} className="ce-legend-row">
                                    <span>
                                        <span style={{ color: r.color }}>●</span> {r.label}
                                    </span>
                                    <span>
                                        {r.count.toLocaleString('es-MX')} ({r.pct}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/alumnos" className="ce-link-more">
                        Ver reporte completo &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Procesos recientes">
                    <div className="ce-table-wrap">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-2 py-2 text-left">Alumno</th>
                                    <th className="px-2 py-2 text-left">Trámite</th>
                                    <th className="px-2 py-2 text-left">Fecha</th>
                                    <th className="px-2 py-2 text-left">Estatus</th>
                                    <th className="px-2 py-2 text-left">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {procesos.slice(0, 6).map((row, idx) => (
                                    <tr key={`${row.alumno}-${idx}`} className="border-t border-slate-100">
                                        <td className="px-2 py-2">
                                            <div className="font-medium text-slate-900">{row.alumno}</div>
                                            <div className="text-xs text-slate-500">{row.matricula}</div>
                                        </td>
                                        <td className="px-2 py-2 text-slate-700">{row.tramite}</td>
                                        <td className="px-2 py-2 text-slate-600">{row.fecha}</td>
                                        <td className="px-2 py-2">
                                            <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link to="/app/control-escolar/expedientes" className="text-sky-700 font-semibold text-xs">
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Link to="/app/control-escolar/solicitudes" className="ce-link-more">
                        Ver todos los procesos &gt;
                    </Link>
                </CeInstSurface>
            </div>
        </CeShell>
>>>>>>> 26e352c (Aplicacion de roles nuevos y cambio de vistas)
    );
}
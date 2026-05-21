import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogosApi } from '../../api/catalogos';
import { fetchDashboard } from '../../api/dashboard';
import { solicitudesMatriculaApi } from '../../api/solicitudesMatricula';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { getUser } from '../../authStore';

const pageShell = { padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' };
const card = { background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' };
const btnSecondary = { height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#0f172a', cursor: 'pointer' };
const th = { background: '#f8fafc', padding: '14px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' };
const td = { padding: '16px', fontSize: 13 };
const iconBtn = { width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const btnPrimary = (bg, mr = 8) => ({ height: 40, padding: '0 16px', borderRadius: 8, background: bg, color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginRight: mr });
const field = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, outline: 'none' };
const selectStyle = { height: 38, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' };

const Icons = {
    users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
    graduation: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    refresh: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" /><path d="M20.49 15A9 9 0 0 1 6.36 18.36L1 14" /></svg>,
    alert: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    export: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    filter: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
    close: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

const ESTADO_LABELS = {
    borrador: 'Borrador', enviada: 'Enviada', en_revision: 'En revisión', con_observaciones: 'Observada',
    aprobada: 'Aprobada', matricula_asignada: 'Matrícula asignada', rechazada: 'Rechazada', cancelada: 'Cancelada',
};

const BADGE_COLORS = {
    green: { background: '#DCFCE7', color: '#0F6E56' },
    yellow: { background: '#FEF3C7', color: '#BA7517' },
    red: { background: '#FEE2E2', color: '#DC2626' },
    blue: { background: '#DBEAFE', color: '#185FA5' },
    purple: { background: '#EDE9FE', color: '#534AB7' },
};

const TABLE_HEADERS = ['Alumno', 'CURP', 'Matrícula', 'Institución', 'Programa', 'Estado', 'Acciones'];

const FILTRO_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'enviada', label: 'Enviadas' },
    { value: 'en_revision', label: 'En revisión' },
    { value: 'con_observaciones', label: 'Observadas' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'matricula_asignada', label: 'Matrícula asignada' },
    { value: 'rechazada', label: 'Rechazadas' },
];

const formatNum = (n) => new Intl.NumberFormat('es-MX').format(Number(n) || 0);

const formatFecha = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-MX');
};

const perm = (name, aliases = []) => {
    const perms = getUser()?.permissions ?? [];
    if (perms.includes(name)) return true;
    return aliases.some((a) => perms.includes(a));
};

const etiquetaEstado = (e) => ESTADO_LABELS[e] ?? e ?? '—';

function estadoColor(estado) {
    if (estado === 'aprobada' || estado === 'matricula_asignada') return 'green';
    if (estado === 'rechazada') return 'red';
    if (estado === 'en_revision') return 'blue';
    return 'yellow';
}

function nombreAlumno(r) {
    return [r.alumno?.nombre, r.alumno?.primer_apellido, r.alumno?.segundo_apellido].filter(Boolean).join(' ') || '—';
}

function StatusBadge({ children, color = 'green' }) {
    const s = BADGE_COLORS[color] ?? BADGE_COLORS.green;
    return <span style={{ ...s, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>;
}

function MetricCard({ icon, iconBg, iconColor, title, value, trend }) {
    return (
        <div style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 220 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{title}</p>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#0F6E56', fontWeight: 600 }}>{trend}</p>
            </div>
        </div>
    );
}

function SidePanel({ title, children }) {
    return (
        <div style={{ ...card, padding: 20 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {children}
        </div>
    );
}

function SolicitudRow({ r, onSelect }) {
    const estado = etiquetaEstado(r.estado);
    const color = estadoColor(r.estado);
    const esSolicitud = r.origen !== 'matricula';
    const clave = r.clave_matricula ?? '—';

    return (
        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ ...td, fontWeight: 500, color: '#0f172a' }}>
                {nombreAlumno(r)}
                {r.origen === 'matricula' ? (
                    <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>Registro directo</span>
                ) : null}
            </td>
            <td style={{ ...td, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{r.alumno?.curp ?? '—'}</td>
            <td style={{ ...td, fontWeight: 600, color: '#185FA5', fontFamily: 'monospace' }}>{clave}</td>
            <td style={{ ...td, color: '#64748b' }}>{r.institucion?.nombre ?? '—'}</td>
            <td style={{ ...td, color: '#64748b' }}>{r.programa_estudio?.nombre ?? r.programaEstudio?.nombre ?? '—'}</td>
            <td style={td}><StatusBadge color={color}>{estado}</StatusBadge></td>
            <td style={{ ...td, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                        type="button"
                        onClick={() => onSelect(r)}
                        style={iconBtn}
                        title={esSolicitud ? 'Gestionar solicitud' : 'Ver matrícula'}
                    >
                        {Icons.eye}
                    </button>
                    {r.alumno_id ? (
                        <Link to={`/app/alumnos/${r.alumno_id}/expediente?tab=matricula`} style={{ ...iconBtn, textDecoration: 'none' }} title="Expediente">
                            {Icons.check}
                        </Link>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}

function OperacionesPanel({ sel, busy, puede, obs, setObs, motivo, setMotivo, claveMat, setClaveMat, actuar, onClose }) {
    const esSolicitud = sel.origen !== 'matricula';

    return (
        <div style={{ ...card, marginTop: 24, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                {esSolicitud ? `Operación · solicitud #${sel.solicitud_id ?? sel.id}` : `Matrícula · ${sel.clave_matricula ?? sel.id}`}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                Estado: <strong>{etiquetaEstado(sel.estado)}</strong>
                {sel.estado_matricula ? <> · matrícula <strong>{sel.estado_matricula}</strong></> : null}
            </p>

            {!esSolicitud ? (
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    Esta matrícula fue registrada directamente en el sistema (sin solicitud de trámite en la bandeja).
                    Use el expediente del alumno para más detalle.
                </p>
            ) : null}

            {esSolicitud && puede.revisar && sel.estado === 'enviada' ? (
                <button type="button" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.tomarRevision(id))} style={btnPrimary('#185FA5')}>
                    Tomar en revisión
                </button>
            ) : null}

            {esSolicitud && puede.aprobar && sel.estado === 'en_revision' ? (
                <button type="button" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.aprobar(id))} style={btnPrimary('#0F6E56')}>
                    Aprobar solicitud
                </button>
            ) : null}

            {esSolicitud && puede.devolver && sel.estado === 'en_revision' ? (
                <div style={{ marginTop: 16 }}>
                    <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones" style={{ ...field, minHeight: 90, resize: 'vertical' }} />
                    <button type="button" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.devolverObservaciones(id, obs))} style={{ ...btnSecondary, marginTop: 10, fontWeight: 600 }}>
                        Devolver con observaciones
                    </button>
                </div>
            ) : null}

            {esSolicitud && puede.rechazar && (sel.estado === 'en_revision' || sel.estado === 'enviada') ? (
                <div style={{ marginTop: 16 }}>
                    <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de rechazo" style={{ ...field, minHeight: 80, resize: 'vertical' }} />
                    <button type="button" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.rechazar(id, motivo))} style={{ ...btnPrimary('#DC2626', 0), marginTop: 10 }}>
                        Rechazar
                    </button>
                </div>
            ) : null}

            {esSolicitud && puede.asignar && sel.estado === 'aprobada' ? (
                <div style={{ marginTop: 16 }}>
                    <input value={claveMat} onChange={(e) => setClaveMat(e.target.value)} placeholder="Clave institucional" style={{ ...field, height: 40, padding: '0 12px' }} />
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => actuar((id) => solicitudesMatriculaApi.asignarMatricula(id, { matricula: claveMat.trim(), estado: 'activa' }))}
                        style={{ ...btnPrimary('#185FA5', 0), marginTop: 10 }}
                    >
                        Asignar matrícula
                    </button>
                </div>
            ) : null}

            <button type="button" onClick={onClose} style={{ ...btnSecondary, marginTop: 20, fontWeight: 600 }}>Cerrar</button>
        </div>
    );
}

export function SolicitudesMatriculaBandejaPage() {
    const [rows, setRows] = useState([]);
    const [metricasDash, setMetricasDash] = useState({});
    const [cicloActual, setCicloActual] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [filtro, setFiltro] = useState('');
    const [search, setSearch] = useState('');
    const [obs, setObs] = useState('');
    const [motivo, setMotivo] = useState('');
    const [claveMat, setClaveMat] = useState('');
    const [sel, setSel] = useState(null);

    const puede = useMemo(() => ({
        revisar: perm('revisar_solicitud_matricula', ['solicitudes_matricula.revisar']),
        devolver: perm('devolver_solicitud_matricula', ['solicitudes_matricula.devolver']),
        aprobar: perm('aprobar_solicitud_matricula', ['solicitudes_matricula.aprobar']),
        rechazar: perm('rechazar_solicitud_matricula', ['solicitudes_matricula.rechazar']),
        asignar: perm('asignar_matricula', ['matriculas.asignar', 'solicitudes_matricula.aprobar']),
    }), []);

    async function cargar() {
        setBusy(true);
        setError('');
        try {
            const [res, dash, ciclosRes] = await Promise.all([
                solicitudesMatriculaApi.index(filtro ? { estado: filtro } : {}),
                fetchDashboard().catch(() => null),
                catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
            ]);

            setRows(Array.isArray(res?.data) ? res.data : []);

            const dashMetricas = dash?.data?.payload?.metricas ?? dash?.payload?.metricas ?? {};
            setMetricasDash(dashMetricas);

            const ciclos = Array.isArray(ciclosRes?.data) ? ciclosRes.data : [];
            setCicloActual(ciclos.find((c) => c.es_actual) ?? ciclos[0] ?? null);
        } catch (e) {
            setRows([]);
            setError(e?.message ?? 'No se pudo cargar la bandeja.');
        } finally {
            setBusy(false);
            setLoading(false);
        }
    }

    useEffect(() => {
        void cargar();
    }, [filtro]);

    const stats = useMemo(() => {
        const pendientes = rows.filter((r) => r.origen === 'solicitud' && ['enviada', 'en_revision', 'con_observaciones'].includes(r.estado)).length;
        const enRevision = rows.filter((r) => r.estado === 'en_revision').length;
        const asignadas = rows.filter((r) => r.estado === 'matricula_asignada' || r.origen === 'matricula').length;
        const rechazadas = rows.filter((r) => r.estado === 'rechazada').length;

        return { pendientes, enRevision, asignadas, rechazadas };
    }, [rows]);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => {
            const haystack = [
                nombreAlumno(r),
                r.alumno?.curp,
                r.institucion?.nombre,
                r.programa_estudio?.nombre,
                r.programaEstudio?.nombre,
                r.sede?.nombre,
                r.clave_matricula,
                r.origen,
                etiquetaEstado(r.estado),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [rows, search]);

    const porInstitucion = useMemo(() => {
        const counts = {};
        for (const r of rows) {
            const label = r.institucion?.nombre ?? 'Sin institución';
            counts[label] = (counts[label] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [rows]);

    const fechasClave = useMemo(() => {
        if (!cicloActual) {
            return [{ titulo: 'Ciclo escolar', fecha: 'No configurado' }];
        }
        return [
            { titulo: `Inicio · ${cicloActual.nombre ?? cicloActual.clave}`, fecha: formatFecha(cicloActual.fecha_inicio) },
            { titulo: `Fin · ${cicloActual.nombre ?? cicloActual.clave}`, fecha: formatFecha(cicloActual.fecha_fin) },
        ];
    }, [cicloActual]);

    const metricsCards = [
        {
            icon: 'users',
            iconBg: '#CCFBF1',
            iconColor: '#0F6E56',
            title: 'Alumnos activos',
            value: formatNum(metricasDash.alumnos_activos ?? 0),
            trend: 'Sistema académico',
        },
        {
            icon: 'graduation',
            iconBg: '#EDE9FE',
            iconColor: '#534AB7',
            title: 'Solicitudes pendientes',
            value: formatNum(metricasDash.solicitudes_matricula_pendientes ?? stats.pendientes),
            trend: 'Enviadas y en trámite',
        },
        {
            icon: 'refresh',
            iconBg: '#DBEAFE',
            iconColor: '#185FA5',
            title: 'En revisión',
            value: formatNum(metricasDash.solicitudes_matricula_en_revision ?? stats.enRevision),
            trend: 'Bandeja operativa',
        },
        {
            icon: 'alert',
            iconBg: '#FEF3C7',
            iconColor: '#BA7517',
            title: 'Rechazadas',
            value: formatNum(metricasDash.solicitudes_matricula_rechazadas ?? stats.rechazadas),
            trend: 'Requieren seguimiento',
        },
    ];

    async function actuar(fn) {
        if (!sel?.id || sel.origen === 'matricula') return;
        const solicitudId = sel.solicitud_id ?? sel.id;
        setBusy(true);
        setError('');
        try {
            await fn(solicitudId);
            setSel(null);
            setObs('');
            setMotivo('');
            setClaveMat('');
            await cargar();
        } catch (e) {
            setError(e?.message ?? 'Acción no completada.');
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div style={pageShell}>
                <LoadingState text="Cargando solicitudes de matrícula..." />
            </div>
        );
    }

    return (
        <div style={pageShell}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, color: '#185FA5', fontWeight: 500 }}>
                        Educ. Superior <span style={{ color: '#94a3b8' }}>›</span> Matrícula
                    </div>
                    <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: '#0f172a' }}>Control de matrícula</h1>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
                        Bandeja de solicitudes desde la base de datos ({formatNum(rows.length)} registros).
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => void cargar()} style={{ ...btnSecondary, background: '#185FA5', color: 'white', fontWeight: 600, border: '1px solid #185FA5' }}>
                        {Icons.refresh} Actualizar
                    </button>
                    <button type="button" style={btnSecondary}>{Icons.export} Exportar</button>
                </div>
            </div>

            {error ? <div style={{ marginBottom: 20 }}><ErrorState message={error} /></div> : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                {metricsCards.map((m) => (
                    <MetricCard key={m.title} icon={Icons[m.icon]} iconBg={m.iconBg} iconColor={m.iconColor} title={m.title} value={m.value} trend={m.trend} />
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Solicitudes / Matrículas registradas</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                Mostrando {formatNum(filtrados.length)} de {formatNum(rows.length)} resultados
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>{Icons.search}</span>
                                <input
                                    type="search"
                                    placeholder="Buscar por alumno o institución"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: 280, height: 38, paddingLeft: 36, ...selectStyle }}
                                />
                            </div>
                            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={selectStyle} disabled={busy}>
                                {FILTRO_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {TABLE_HEADERS.map((h) => (
                                        <th key={h} style={{ ...th, textAlign: h === 'Acciones' ? 'center' : 'left' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={TABLE_HEADERS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 32 }}>
                                            {search.trim() || filtro
                                                ? 'No hay solicitudes que coincidan con los filtros.'
                                                : 'No hay solicitudes de matrícula registradas.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtrados.map((r) => (
                                        <SolicitudRow key={`${r.origen ?? 'solicitud'}-${r.id}`} r={r} onSelect={setSel} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <SidePanel title="Distribución por institución">
                        {porInstitucion.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Sin solicitudes en la bandeja.</p>
                        ) : (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {porInstitucion.map(([label, count]) => (
                                    <li key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                        <span style={{ color: '#475569', paddingRight: 8 }}>{label}</span>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNum(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SidePanel>
                    <SidePanel title="Fechas clave">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {fechasClave.map((f) => (
                                <div key={f.titulo}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.titulo}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{f.fecha}</p>
                                </div>
                            ))}
                        </div>
                    </SidePanel>
                    {stats.asignadas > 0 ? (
                        <SidePanel title="Matrículas asignadas">
                            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{formatNum(stats.asignadas)}</p>
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>En el listado actual</p>
                        </SidePanel>
                    ) : null}
                </div>
            </div>

            {sel ? (
                <OperacionesPanel
                    sel={sel}
                    busy={busy}
                    puede={puede}
                    obs={obs}
                    setObs={setObs}
                    motivo={motivo}
                    setMotivo={setMotivo}
                    claveMat={claveMat}
                    setClaveMat={setClaveMat}
                    actuar={actuar}
                    onClose={() => setSel(null)}
                />
            ) : null}
        </div>
    );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CePageHeader,
    CeStatusBadge,
    ceColors,
    ceInitials,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { ErrorStateAlert } from './alumnos/ErrorStateAlert';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';

const TABS = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'plan', label: 'Plan de estudios' },
    { id: 'kardex', label: 'Kardex' },
    { id: 'historial', label: 'Historial de periodos' },
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'equivalencias', label: 'Equivalencias' },
];

function TrayectoriaMetricCard({ icon, iconBg, iconColor, title, value, subValue, progressPercent }) {
    return (
        <div style={{ ...ceTheme.surface, flex: '1 1 200px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>{title}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.1 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>{subValue}</p>
                {progressPercent != null ? (
                    <div style={{ marginTop: 10, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: iconColor, borderRadius: 2 }} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ActionBtn({ label, icon, onClick, disabled, loading, title }) {
    return (
        <button
            type="button"
            title={disabled ? (title || 'Selecciona un alumno para continuar.') : title}
            disabled={disabled || loading}
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px',
                borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
                fontSize: 13, fontWeight: 500, color: disabled ? '#94a3b8' : '#0f172a',
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
        >
            <span style={{ color: disabled ? '#94a3b8' : '#185FA5', display: 'flex' }}>{icon}</span>
            {loading ? 'Procesando…' : label}
        </button>
    );
}

export function TrayectoriaCePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const alumnoIdParam = searchParams.get('alumno_id');
    const initialAlumnoId = alumnoIdParam ? Number(alumnoIdParam) : null;

    const [search, setSearch] = useState('');
    const [alumnoId, setAlumnoId] = useState(initialAlumnoId);
    const [buscando, setBuscando] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [periodo, setPeriodo] = useState('Todos los periodos');
    const [historialSearch, setHistorialSearch] = useState('');
    const [payload, setPayload] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [ultimoPeriodo, setUltimoPeriodo] = useState(null);
    const [actividad, setActividad] = useState([]);
    const [tabData, setTabData] = useState(null);
    const [activeTab, setActiveTab] = useState('resumen');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [accionLoading, setAccionLoading] = useState('');
    const [showConstancia, setShowConstancia] = useState(false);

    const syncAlumnoUrl = useCallback((id) => {
        const next = new URLSearchParams(searchParams);
        if (id) next.set('alumno_id', String(id));
        else next.delete('alumno_id');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const cargarTrayectoria = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.trayectoria({
                search: search.trim() || undefined,
                alumno_id: alumnoId ?? undefined,
                periodo: periodo !== 'Todos los periodos' ? periodo : undefined,
                historial_search: historialSearch.trim() || undefined,
            });
            setPayload(res?.data ?? null);
            if (res?.data?.alumno?.alumno_id && !alumnoId) {
                setAlumnoId(res.data.alumno.alumno_id);
                syncAlumnoUrl(res.data.alumno.alumno_id);
            }
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar la trayectoria académica.');
        } finally {
            setLoading(false);
        }
    }, [search, alumnoId, periodo, historialSearch, syncAlumnoUrl]);

    const cargarExtras = useCallback(async (id) => {
        if (!id) {
            setKpis(null);
            setUltimoPeriodo(null);
            setActividad([]);
            return;
        }
        try {
            const [r, u, a] = await Promise.all([
                controlEscolarApi.trayectoriaResumen(id),
                controlEscolarApi.trayectoriaUltimoPeriodo(id),
                controlEscolarApi.trayectoriaActividad(id),
            ]);
            setKpis(r?.data ?? null);
            setUltimoPeriodo(u?.data ?? null);
            setActividad(a?.data ?? []);
        } catch {
            setKpis(null);
            setUltimoPeriodo(null);
            setActividad([]);
        }
    }, []);

    const cargarTab = useCallback(async (tab, id) => {
        if (!id) return;
        setTabData(null);
        try {
            let data = null;
            if (tab === 'kardex') {
                const r = await controlEscolarApi.trayectoriaKardex(id);
                data = r?.data;
            } else if (tab === 'plan') {
                const r = await controlEscolarApi.trayectoriaPlan(id);
                data = r?.data;
            } else if (tab === 'historial') {
                const r = await controlEscolarApi.trayectoriaHistorial(id);
                data = r?.data;
            } else if (tab === 'estadisticas') {
                const r = await controlEscolarApi.trayectoriaEstadisticas(id);
                data = r?.data;
            } else if (tab === 'equivalencias') {
                const r = await controlEscolarApi.trayectoriaEquivalencias(id);
                data = r?.data;
            }
            setTabData(data);
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo cargar la sección.');
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => void cargarTrayectoria(), search.trim() && !alumnoId ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargarTrayectoria]);

    useEffect(() => {
        if (alumnoId) void cargarExtras(alumnoId);
    }, [alumnoId, cargarExtras]);

    useEffect(() => {
        if (alumnoId && ['kardex', 'plan', 'historial', 'estadisticas', 'equivalencias'].includes(activeTab)) {
            void cargarTab(activeTab, alumnoId);
        }
    }, [activeTab, alumnoId, cargarTab]);

    const buscarAlumnos = async () => {
        if (!search.trim()) return;
        setBuscando(true);
        setResultados([]);
        try {
            const res = await controlEscolarApi.trayectoriaBuscar({ search: search.trim(), per_page: 10 });
            setResultados(res?.data?.data ?? []);
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo buscar alumnos.');
        } finally {
            setBuscando(false);
        }
    };

    const seleccionarAlumno = (id, nombre) => {
        setAlumnoId(id);
        setSearch(nombre);
        setResultados([]);
        syncAlumnoUrl(id);
    };

    const alumno = payload?.alumno;
    const metricas = payload?.metricas ?? {};
    const materiasResumen = payload?.materias_resumen ?? {};
    const avanceCurricular = payload?.avance_curricular ?? {};
    const historial = payload?.historial?.data ?? [];
    const periodos = payload?.historial?.periodos ?? ['Todos los periodos'];
    const sugerencias = payload?.sugerencias ?? [];
    const sinTrayectoria = alumno && (materiasResumen.total ?? 0) === 0;

    const pctCreditos = Number(kpis?.porcentaje_creditos ?? metricas.pct_avance ?? 0);
    const progressSeverity = pctCreditos >= 70 ? '#0F6E56' : pctCreditos >= 40 ? '#BA7517' : '#991B1B';

    const ultimasMaterias = useMemo(() => historial.slice(0, 8), [historial]);

    const recargar = () => {
        void cargarTrayectoria();
        if (alumnoId) void cargarExtras(alumnoId);
        if (['kardex', 'plan', 'historial', 'estadisticas', 'equivalencias'].includes(activeTab)) {
            void cargarTab(activeTab, alumnoId);
        }
    };

    const generarConstancia = async () => {
        if (!alumnoId) return;
        setAccionLoading('constancia');
        setAviso('');
        try {
            await controlEscolarApi.trayectoriaConstancia(alumnoId);
            setAviso('Constancia generada correctamente.');
            setShowConstancia(false);
            recargar();
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo generar la constancia.');
        } finally {
            setAccionLoading('');
        }
    };

    const exportar = async () => {
        if (!alumnoId) return;
        setAccionLoading('exportar');
        try {
            await controlEscolarApi.trayectoriaExportar(alumnoId);
            setAviso('Archivo exportado correctamente.');
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo exportar la trayectoria.');
        } finally {
            setAccionLoading('');
        }
    };

    const kardexPdf = async () => {
        if (!alumnoId) return;
        setAccionLoading('kardexPdf');
        try {
            await controlEscolarApi.trayectoriaKardexPdf(alumnoId);
            setAviso('Kardex PDF descargado.');
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo generar el PDF del kardex.');
        } finally {
            setAccionLoading('');
        }
    };

    const listaBusqueda = resultados.length > 0 ? resultados : (sugerencias.length > 0 && search.trim() ? sugerencias : []);

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <CePageHeader
                breadcrumbCurrent="Trayectoria académica"
                title="Trayectoria académica"
                subtitle="Consulta el historial académico, kardex, calificaciones y avance curricular del alumno."
                updatedAt={(
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                        <button type="button" onClick={recargar} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {CeIcons.refreshCw} Actualizar
                        </button>
                    </span>
                )}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <ActionBtn label="Consultar kardex" icon={CeIcons.scrollText} disabled={!alumnoId} onClick={() => setActiveTab('kardex')} />
                    <ActionBtn label="Generar constancia" icon={CeIcons.file} disabled={!alumnoId} loading={accionLoading === 'constancia'} onClick={() => setShowConstancia(true)} />
                    <ActionBtn label="Ver historial" icon={CeIcons.history} disabled={!alumnoId} onClick={() => setActiveTab('historial')} />
                    <ActionBtn label="Equivalencias" icon={CeIcons.refreshCw} disabled={!alumnoId} onClick={() => setActiveTab('equivalencias')} />
                </div>
                <ActionBtn label="Exportar" icon={CeIcons.download} disabled={!alumnoId} loading={accionLoading === 'exportar'} onClick={exportar} />
            </div>

            {error ? <ErrorStateAlert message={error} onRetry={recargar} /> : null}
            {aviso ? (
                <p style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#EFF6FF', color: '#1e40af', fontSize: 13 }}>{aviso}</p>
            ) : null}

            <div style={{ ...ceTheme.surface, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
                    <div style={{ flex: '1 1 280px' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>Selecciona un alumno</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>{CeIcons.search}</span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); if (!e.target.value) setAlumnoId(null); }}
                                    placeholder="Buscar por nombre, matrícula o CURP..."
                                    style={{ width: '100%', height: 40, paddingLeft: 34, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                                />
                                {listaBusqueda.length > 0 ? (
                                    <ul style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 20, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, listStyle: 'none', margin: 0, padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                        {listaBusqueda.map((s) => (
                                            <li key={s.alumno_id}>
                                                <button type="button" onClick={() => seleccionarAlumno(s.alumno_id, s.nombre)} style={{ width: '100%', textAlign: 'left', padding: 10, border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                                                    <strong>{sanitizeInstitutionalLabel(s.nombre)}</strong>
                                                    <span style={{ color: '#64748b', marginLeft: 8 }}>{s.matricula}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                            <button type="button" onClick={buscarAlumnos} disabled={buscando || !search.trim()} style={{ height: 40, padding: '0 16px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                {buscando ? 'Buscando…' : 'Buscar'}
                            </button>
                        </div>
                    </div>
                    {alumno ? (
                        <div style={{ flex: '2 1 400px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '1px solid #f1f5f9', paddingLeft: 16 }}>
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DBEAFE', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                    {ceInitials(alumno.nombre)}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{sanitizeInstitutionalLabel(alumno.nombre)}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                        Matrícula: {alumno.matricula} · CURP: {alumno.curp}
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                        {sanitizeInstitutionalLabel(alumno.programa)} · Semestre: {sanitizeInstitutionalLabel(alumno.semestre)} · <CeStatusBadge>{alumno.estatus}</CeStatusBadge>
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setAlumnoId(null); setSearch(''); syncAlumnoUrl(null); setPayload(null); }} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#185FA5', fontWeight: 600 }}>
                                Cambiar alumno
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {!alumno && !loading ? (
                <div style={{ ...ceTheme.surface, textAlign: 'center', padding: 48 }}>
                    <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Selecciona un alumno para consultar su trayectoria</h2>
                    <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Busca por nombre, matrícula o CURP para revisar kardex, avance curricular, historial académico y constancias.</p>
                    <Link to="/app/control-escolar/alumnos" style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>Ver alumnos activos</Link>
                </div>
            ) : null}

            {alumno && sinTrayectoria ? (
                <div style={{ ...ceTheme.surface, textAlign: 'center', padding: 40, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, margin: '0 0 8px' }}>El alumno aún no tiene trayectoria académica registrada</h2>
                    <p style={{ color: '#64748b', fontSize: 13 }}>Registra carga académica o calificaciones para comenzar a construir su historial.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                        <Link to="/app/control-escolar/calificaciones" style={{ color: '#185FA5', fontWeight: 600 }}>Ir a calificaciones</Link>
                    </div>
                </div>
            ) : null}

            {alumno && !sinTrayectoria ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>
                    <div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                            {loading && !kpis ? (
                                <>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} style={{ ...ceTheme.surface, flex: '1 1 180px', height: 100, background: '#f8fafc' }} />
                                    ))}
                                </>
                            ) : (
                                <>
                                    <TrayectoriaMetricCard icon={CeIcons.checkCircle} iconBg="#DBEAFE" iconColor="#185FA5" title="Promedio general" value={kpis?.promedio_general ?? metricas.promedio ?? '—'} subValue="Escala 0-10" />
                                    <TrayectoriaMetricCard icon={CeIcons.scrollText} iconBg="#DCFCE7" iconColor="#0F6E56" title="Créditos aprobados" value={`${formatCeNum(kpis?.creditos_aprobados ?? metricas.creditos_aprobados)} / ${formatCeNum(kpis?.creditos_totales ?? metricas.creditos_totales)}`} subValue={`${kpis?.porcentaje_creditos ?? pctCreditos}% del plan`} progressPercent={kpis?.porcentaje_creditos ?? pctCreditos} />
                                    <TrayectoriaMetricCard icon={CeIcons.checkCircle} iconBg="#F0FDF4" iconColor="#0F6E56" title="Materias aprobadas" value={`${formatCeNum(kpis?.materias_aprobadas ?? materiasResumen.aprobadas)} / ${formatCeNum(kpis?.materias_totales ?? materiasResumen.total)}`} subValue={`${kpis?.porcentaje_materias ?? materiasResumen.pct_aprobadas ?? 0}% del plan`} />
                                    <TrayectoriaMetricCard icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Antigüedad" value={kpis?.antiguedad ?? '—'} subValue={payload?.semestre_actual ? `Periodo actual: ${sanitizeInstitutionalLabel(payload.semestre_actual)}` : 'Historial académico'} />
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 16, flexWrap: 'wrap' }}>
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    style={{
                                        padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                                        fontWeight: activeTab === t.id ? 600 : 500,
                                        color: activeTab === t.id ? '#185FA5' : '#64748b',
                                        borderBottom: activeTab === t.id ? '2px solid #185FA5' : '2px solid transparent',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'resumen' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ ...ceTheme.surface }}>
                                    <p style={{ ...ceTheme.surfaceTitle }}>Último periodo cursado</p>
                                    {ultimoPeriodo ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 13 }}>
                                            <div><span style={{ color: '#64748b' }}>Periodo</span><p style={{ margin: 4, fontWeight: 600 }}>{sanitizeInstitutionalLabel(ultimoPeriodo.periodo)}</p></div>
                                            <div><span style={{ color: '#64748b' }}>Materias cursadas</span><p style={{ margin: 4, fontWeight: 600 }}>{ultimoPeriodo.materias_cursadas}</p></div>
                                            <div><span style={{ color: '#64748b' }}>Aprobadas</span><p style={{ margin: 4, fontWeight: 600 }}>{ultimoPeriodo.materias_aprobadas}</p></div>
                                            <div><span style={{ color: '#64748b' }}>Reprobadas</span><p style={{ margin: 4, fontWeight: 600 }}>{ultimoPeriodo.materias_reprobadas}</p></div>
                                            <div><span style={{ color: '#64748b' }}>Promedio</span><p style={{ margin: 4, fontWeight: 600 }}>{ultimoPeriodo.promedio_periodo ?? '—'}</p></div>
                                            <div><CeStatusBadge>{ultimoPeriodo.estatus === 'aprobado' ? 'Aprobado' : 'En seguimiento'}</CeStatusBadge></div>
                                        </div>
                                    ) : <p style={{ fontSize: 13, color: '#64748b' }}>Sin periodos registrados.</p>}
                                </div>
                                <div style={{ ...ceTheme.surface }}>
                                    <p style={{ ...ceTheme.surfaceTitle }}>Últimas materias cursadas</p>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ background: ceColors.pageBg }}>
                                                    {['Periodo', 'Materia', 'Créditos', 'Calificación', 'Estatus'].map((h) => (
                                                        <th key={h} style={{ padding: 10, textAlign: 'left', color: '#64748b' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ultimasMaterias.map((m) => (
                                                    <tr key={`${m.clave}-${m.periodo}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: 10 }}>{sanitizeInstitutionalLabel(m.periodo)}</td>
                                                        <td style={{ padding: 10 }}>{m.nombre}</td>
                                                        <td style={{ padding: 10 }}>{m.creditos}</td>
                                                        <td style={{ padding: 10, fontWeight: 600 }}>{m.calificacion}</td>
                                                        <td style={{ padding: 10 }}><CeStatusBadge>{m.estatus}</CeStatusBadge></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                                        <button type="button" onClick={() => setActiveTab('kardex')} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#185FA5', fontWeight: 600 }}>
                                            Ver kardex completo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {activeTab === 'kardex' && tabData?.periodos ? (
                            <div style={{ ...ceTheme.surface }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <p style={{ ...ceTheme.surfaceTitle, margin: 0, border: 'none' }}>Kardex completo</p>
                                    <button type="button" onClick={kardexPdf} disabled={accionLoading === 'kardexPdf'} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                                        {accionLoading === 'kardexPdf' ? 'Generando…' : 'Exportar PDF'}
                                    </button>
                                </div>
                                {tabData.periodos.map((p) => (
                                    <div key={p.periodo} style={{ marginBottom: 20 }}>
                                        <p style={{ fontWeight: 700, fontSize: 14 }}>{sanitizeInstitutionalLabel(p.periodo)} · Promedio: {p.promedio ?? '—'}</p>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                                            <tbody>
                                                {(p.materias ?? []).map((m) => (
                                                    <tr key={`${p.periodo}-${m.clave}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: 8, fontFamily: 'monospace' }}>{m.clave}</td>
                                                        <td style={{ padding: 8 }}>{m.nombre}</td>
                                                        <td style={{ padding: 8 }}>{m.calificacion}</td>
                                                        <td style={{ padding: 8 }}>{m.creditos}</td>
                                                        <td style={{ padding: 8 }}><CeStatusBadge>{m.estatus}</CeStatusBadge></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {activeTab === 'plan' && tabData ? (
                            <div style={{ ...ceTheme.surface }}>
                                <p style={{ ...ceTheme.surfaceTitle }}>Plan: {sanitizeInstitutionalLabel(tabData.plan)}</p>
                                <p style={{ fontSize: 13 }}>Avance créditos: {tabData.avance_creditos}% · Materias pendientes: {tabData.materias_pendientes}</p>
                                {(tabData.materias_por_periodo ?? []).map((p) => (
                                    <div key={p.periodo} style={{ marginTop: 16 }}>
                                        <p style={{ fontWeight: 600 }}>{sanitizeInstitutionalLabel(p.periodo)}</p>
                                        {(p.materias ?? []).map((m) => (
                                            <div key={m.clave} style={{ display: 'flex', gap: 12, padding: '6px 0', fontSize: 12, borderBottom: '1px solid #f8fafc' }}>
                                                <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{m.clave}</span>
                                                <span style={{ flex: 1 }}>{m.nombre}</span>
                                                <CeStatusBadge>{m.estatus}</CeStatusBadge>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {activeTab === 'historial' && Array.isArray(tabData) ? (
                            <div style={{ ...ceTheme.surface }}>
                                {tabData.map((p) => (
                                    <div key={p.periodo} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{sanitizeInstitutionalLabel(p.periodo)}</p>
                                        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                                            {p.materias?.length ?? 0} materias · Promedio: {p.promedio ?? '—'} · Créditos: {p.creditos}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {activeTab === 'estadisticas' && tabData?.distribucion_calificaciones ? (
                            <div style={{ ...ceTheme.surface }}>
                                <p style={{ ...ceTheme.surfaceTitle }}>Distribución de calificaciones</p>
                                {(tabData.distribucion_calificaciones ?? []).map((d) => (
                                    <div key={d.rango} style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                            <span>{d.rango}</span>
                                            <span>{d.porcentaje ?? 0}% ({d.total})</span>
                                        </div>
                                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginTop: 4 }}>
                                            <div style={{ width: `${d.porcentaje ?? 0}%`, height: '100%', background: '#185FA5', borderRadius: 3 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {activeTab === 'equivalencias' ? (
                            <div style={{ ...ceTheme.surface, textAlign: 'center', padding: 32 }}>
                                <p style={{ color: '#64748b', fontSize: 14 }}>No hay equivalencias registradas para este alumno.</p>
                            </div>
                        ) : null}

                    </div>

                    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ ...ceTheme.surface }}>
                            <p style={{ ...ceTheme.surfaceTitle }}>Progreso del plan</p>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: 88, height: 88, margin: '0 auto', borderRadius: '50%', background: `conic-gradient(${progressSeverity} 0deg ${pctCreditos * 3.6}deg, #e2e8f0 ${pctCreditos * 3.6}deg 360deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{pctCreditos}%</div>
                                </div>
                                <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                                    {formatCeNum(avanceCurricular.aprobados ?? kpis?.creditos_aprobados)} de {formatCeNum(avanceCurricular.aprobados != null ? (avanceCurricular.aprobados + (avanceCurricular.pendientes ?? 0)) : kpis?.creditos_totales)} créditos
                                </p>
                            </div>
                        </div>
                        <div style={{ ...ceTheme.surface }}>
                            <p style={{ ...ceTheme.surfaceTitle }}>Actividad reciente</p>
                            {actividad.length === 0 ? <p style={{ fontSize: 12, color: '#64748b' }}>Sin actividad reciente.</p> : actividad.map((ev) => (
                                <div key={ev.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{ev.titulo}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{ev.descripcion}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ ...ceTheme.surface }}>
                            <p style={{ ...ceTheme.surfaceTitle }}>Atajos rápidos</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {[
                                    { label: 'Kardex', fn: () => setActiveTab('kardex') },
                                    { label: 'Constancia', fn: () => setShowConstancia(true) },
                                    { label: 'Historial', fn: () => setActiveTab('historial') },
                                    { label: 'Estadísticas', fn: () => setActiveTab('estadisticas') },
                                ].map((a) => (
                                    <button key={a.label} type="button" disabled={!alumnoId} onClick={a.fn} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: alumnoId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, color: '#185FA5' }}>
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            ) : null}

            {showConstancia ? (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }}>
                        <h3 style={{ margin: '0 0 12px' }}>Generar constancia</h3>
                        <p style={{ fontSize: 13, color: '#64748b' }}>Se generará un PDF con los datos académicos del alumno seleccionado.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button type="button" onClick={() => setShowConstancia(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                            <button type="button" onClick={generarConstancia} disabled={accionLoading === 'constancia'} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                {accionLoading === 'constancia' ? 'Generando…' : 'Generar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

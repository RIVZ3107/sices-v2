import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeHeaderAction,
    CeIcons,
    CePageHeader,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { AlumnoKpiCard, AlumnoKpiSkeleton } from './alumnos/AlumnoKpiCard';
import { ErrorStateAlert } from './alumnos/ErrorStateAlert';
import { ReinscripcionProgressBar } from './reinscripciones/ReinscripcionProgressBar';
import { ReinscripcionStatusBadge } from './reinscripciones/ReinscripcionStatusBadge';
import { DesbloquearReinscripcionModal, ObservarReinscripcionModal, ReinscribirAlumnoModal } from './reinscripciones/ReinscripcionesModals';
import { canRei } from './reinscripciones/reinscripcionesPermissions';
import { useReinscripciones } from './reinscripciones/useReinscripciones';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';

export function ReinscripcionesCePage() {
    const [modalReinscribir, setModalReinscribir] = useState(false);
    const [modalDesbloquear, setModalDesbloquear] = useState(false);
    const [modalObservar, setModalObservar] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
    const [aviso, setAviso] = useState('');

    const {
        loading, error, technicalDetail, filters, setFilters, limpiarFiltros, recargar,
        selected, toggleSelect, toggleAll, metricas, catalogos, rows, meta, motivos, flujo, regla, actualizadoEn, apiOk,
    } = useReinscripciones();

    const ids = useMemo(() => rows.map((r) => r.reinscripcion_id), [rows]);

    const filtrosActivos = useMemo(() => {
        let n = 0;
        if (filters.search?.trim()) n++;
        if (filters.estatus || filters.periodo_id || filters.programa_id || filters.motivo_bloqueo) n++;
        if (filters.con_observaciones || filters.con_adeudos || filters.fecha_desde) n++;
        return n;
    }, [filters]);

    const kpi = (n) => (apiOk && metricas ? formatCeNum(n ?? 0) : '—');

    const exportar = async () => {
        if (!canRei('exportar')) return;
        setExporting(true);
        try {
            const p = { ...filters };
            delete p.page;
            await controlEscolarApi.reinscripcionesExportar(p);
        } finally {
            setExporting(false);
        }
    };

    const abrirDesbloquear = () => {
        if (!selected.length) {
            setAviso('Selecciona al menos una reinscripción para desbloquear.');
            return;
        }
        setAviso('');
        setModalDesbloquear(true);
    };

    const abrirFicha = async (id) => {
        if (!canRei('ficha')) return;
        try {
            await controlEscolarApi.reinscripcionesFicha(id);
        } catch {
            setAviso('No se pudo generar la ficha.');
        }
    };

    return (
        <div style={ceTheme.pageShell}>
            <CePageHeader
                breadcrumbCurrent="Reinscripciones"
                title="Gestión de reinscripciones"
                subtitle="Administra el proceso de reinscripción de alumnos con matrícula activa y continuidad académica."
                updatedAt={(
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Última actualización: {loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                        <button type="button" onClick={() => void recargar()} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {CeIcons.refreshCw} Actualizar
                        </button>
                    </span>
                )}
                actions={(
                    <>
                        {canRei('crear') ? <CeHeaderAction variant="primary" icon={CeIcons.refreshCw} label="Reinscribir alumno" onClick={() => setModalReinscribir(true)} /> : null}
                        {canRei('desbloquear') ? <CeHeaderAction variant="secondary" icon={CeIcons.lock} label="Desbloquear" onClick={abrirDesbloquear} /> : null}
                        {canRei('ficha') ? <CeHeaderAction variant="secondary" icon={CeIcons.file} label="Generar ficha" onClick={() => selected[0] ? void abrirFicha(selected[0]) : setAviso('Selecciona una reinscripción para generar ficha.') } /> : null}
                        {canRei('exportar') ? <CeHeaderAction variant="secondary" icon={CeIcons.download} label={exporting ? 'Exportando…' : 'Exportar'} onClick={() => void exportar()} /> : null}
                    </>
                )}
            />

            <ErrorStateAlert error={error} technicalDetail={technicalDetail} onRetry={recargar} />

            {aviso ? (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#EFF6FF', color: '#1E40AF', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{aviso}</span>
                    <button type="button" onClick={() => setAviso('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button>
                </div>
            ) : null}

            {regla ? (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 13, color: '#1E40AF', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {CeIcons.infoCircle}
                    <span>{regla}</span>
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {loading && !metricas ? (
                    <>
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                    </>
                ) : (
                    <>
                        <AlumnoKpiCard icon={CeIcons.refreshCw} iconBg="#DBEAFE" iconColor="#185FA5" title="Reinscripciones en proceso" value={kpi(metricas?.en_proceso)} trend={apiOk ? `${kpi(metricas?.total_en_alcance)} en tu alcance` : undefined} onClick={() => setFilters({ estatus: 'en_proceso' })} active={filters.estatus === 'en_proceso'} />
                        <AlumnoKpiCard icon={CeIcons.lock} iconBg="#FEF3C7" iconColor="#BA7517" title="Bloqueadas" value={kpi(metricas?.bloqueadas)} onClick={() => setFilters({ estatus: 'bloqueada' })} active={filters.estatus === 'bloqueada'} />
                        <AlumnoKpiCard icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Completadas" value={kpi(metricas?.completadas)} onClick={() => setFilters({ estatus: 'completada' })} active={filters.estatus === 'completada'} />
                        <AlumnoKpiCard icon={CeIcons.alertTriangle} iconBg="#EEEDFE" iconColor="#534AB7" title="Adeudos detectados" value={kpi(metricas?.adeudos)} onClick={() => setFilters({ con_adeudos: '1' })} active={filters.con_adeudos === '1'} />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 16, alignItems: 'start' }}>
                <div style={ceTheme.surface}>
                    {selected.length > 0 ? (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', padding: 10, background: '#EFF6FF', borderRadius: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.length} seleccionados</span>
                            {canRei('desbloquear') ? <button type="button" onClick={abrirDesbloquear} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Desbloquear</button> : null}
                            {canRei('ficha') ? <button type="button" onClick={() => void abrirFicha(selected[0])} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Generar ficha</button> : null}
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <input type="search" value={filters.search || ''} onChange={(e) => setFilters({ search: e.target.value })} placeholder="Buscar por alumno, matrícula, CURP o folio…" style={{ flex: 1, minWidth: 200, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 13 }} />
                        <button type="button" onClick={() => setFiltrosAbiertos((v) => !v)} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                            Filtros {filtrosActivos > 0 ? `(${filtrosActivos})` : ''}
                        </button>
                        <button type="button" onClick={limpiarFiltros} style={{ height: 36, padding: '0 12px', border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer' }}>Limpiar</button>
                    </div>

                    {filtrosAbiertos ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                            <select value={filters.estatus || ''} onChange={(e) => setFilters({ estatus: e.target.value })}>
                                {(catalogos.estatus ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={filters.motivo_bloqueo || ''} onChange={(e) => setFilters({ motivo_bloqueo: e.target.value })}>
                                <option value="">Motivo bloqueo</option>
                                {(catalogos.motivos_bloqueo ?? []).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={filters.programa_id || ''} onChange={(e) => setFilters({ programa_id: e.target.value })}>
                                <option value="">Programa</option>
                                {(catalogos.programas ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <button type="button" onClick={() => void recargar()} style={{ height: 34, border: 'none', borderRadius: 8, background: '#185FA5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Aplicar filtros</button>
                        </div>
                    ) : null}

                    {!loading && apiOk && rows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <p style={{ fontWeight: 700 }}>Aún no hay reinscripciones registradas</p>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Comienza iniciando una reinscripción para un alumno con matrícula activa.</p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                                {canRei('crear') ? <button type="button" onClick={() => setModalReinscribir(true)} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#185FA5', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Reinscribir primer alumno</button> : null}
                                <Link to="/app/control-escolar/alumnos" style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0f172a' }}>Ver alumnos elegibles</Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
                                        <th style={{ padding: 8 }}><input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={() => toggleAll(ids)} /></th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Folio</th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Alumno</th>
                                        <th style={{ padding: 8 }}>Periodo</th>
                                        <th style={{ padding: 8 }}>Motivo</th>
                                        <th style={{ padding: 8 }}>Avance</th>
                                        <th style={{ padding: 8 }}>Estatus</th>
                                        <th style={{ padding: 8 }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && !rows.length ? (
                                        <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center' }}>Cargando…</td></tr>
                                    ) : rows.map((r) => (
                                        <tr key={r.reinscripcion_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 8 }}><input type="checkbox" checked={selected.includes(r.reinscripcion_id)} onChange={() => toggleSelect(r.reinscripcion_id)} /></td>
                                            <td style={{ padding: 8, fontWeight: 600, color: '#185FA5' }}>{r.folio}</td>
                                            <td style={{ padding: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{sanitizeInstitutionalLabel(r.alumno)}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{r.matricula}</div>
                                            </td>
                                            <td style={{ padding: 8, fontSize: 12 }}>{sanitizeInstitutionalLabel(r.periodo)}</td>
                                            <td style={{ padding: 8, fontSize: 12 }}>{r.motivo_bloqueo}</td>
                                            <td style={{ padding: 8 }}><ReinscripcionProgressBar avance={r.avance} /></td>
                                            <td style={{ padding: 8 }}><ReinscripcionStatusBadge estatus={r.estatus} /></td>
                                            <td style={{ padding: 8 }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                    {canRei('desbloquear') && r.puede_desbloquear ? <button type="button" title="Desbloquear" onClick={() => { setSelected([r.reinscripcion_id]); setModalDesbloquear(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>{CeIcons.lock}</button> : null}
                                                    {canRei('ficha') && r.puede_ficha ? <button type="button" title="Generar ficha" onClick={() => void abrirFicha(r.reinscripcion_id)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>{CeIcons.file}</button> : null}
                                                    {canRei('expediente') ? <Link to={r.urls?.expediente} title="Expediente" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 6 }}>{CeIcons.folder}</Link> : null}
                                                    {canRei('trayectoria') ? <Link to={r.urls?.trayectoria} title="Trayectoria" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 6 }}>{CeIcons.graduationCap}</Link> : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                        <span>{meta.from && meta.to ? `Mostrando ${meta.from} a ${meta.to} de ${meta.total} resultados` : ''}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" disabled={(Number(filters.page) || 1) <= 1} onClick={() => setFilters({ page: String((Number(filters.page) || 1) - 1) }, { resetPage: false })}>«</button>
                            <span>{meta.current_page ?? filters.page} / {meta.last_page ?? 1}</span>
                            <button type="button" disabled={(Number(filters.page) || 1) >= (meta.last_page ?? 1)} onClick={() => setFilters({ page: String((Number(filters.page) || 1) + 1) }, { resetPage: false })}>»</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Motivos de bloqueo</p>
                        {motivos.length === 0 ? <p style={{ fontSize: 12, color: '#94a3b8' }}>Sin bloqueos académicos registrados.</p> : motivos.map((m) => (
                            <button key={m.codigo ?? m.label} type="button" onClick={() => setFilters({ motivo_bloqueo: m.filtro ?? m.codigo })} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 0', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                                <span style={{ fontSize: 12, color: '#475569' }}>{m.nombre ?? m.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#185FA5', background: '#DBEAFE', padding: '2px 8px', borderRadius: 6 }}>{m.total ?? m.n}</span>
                            </button>
                        ))}
                    </div>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Flujo de reinscripción</p>
                        {(flujo.length ? flujo : []).map((step) => (
                            <div key={step.codigo} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.estado === 'completado' ? '#0F6E56' : step.estado === 'en_proceso' ? '#185FA5' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {step.orden}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{step.nombre}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{step.descripcion} · {step.total_relacionado} en alcance</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Atajos rápidos</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {canRei('crear') ? <button type="button" onClick={() => setModalReinscribir(true)} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Reinscribir alumno</button> : null}
                            {canRei('desbloquear') ? <button type="button" onClick={abrirDesbloquear} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Desbloquear</button> : null}
                        </div>
                    </div>
                </div>
            </div>

            <ReinscribirAlumnoModal open={modalReinscribir} onClose={() => setModalReinscribir(false)} onSuccess={recargar} />
            <DesbloquearReinscripcionModal open={modalDesbloquear} onClose={() => setModalDesbloquear(false)} ids={selected} onSuccess={recargar} />
            <ObservarReinscripcionModal open={modalObservar} onClose={() => setModalObservar(false)} ids={selected} onSuccess={recargar} />
        </div>
    );
}

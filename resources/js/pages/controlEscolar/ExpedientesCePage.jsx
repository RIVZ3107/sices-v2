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
import { ExpedienteProgressBar } from './expedientes/ExpedienteProgressBar';
import { ExpedienteStatusBadge } from './expedientes/ExpedienteStatusBadge';
import {
    CargarDocumentoModal,
    CrearExpedienteModal,
    ObservarExpedienteModal,
    ValidarExpedienteModal,
} from './expedientes/ExpedientesModals';
import { canExp } from './expedientes/expedientesPermissions';
import { useExpedientes } from './expedientes/useExpedientes';
import { formatDateTime, getProgressSeverity } from '../../utils/expedienteUx';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';

export function ExpedientesCePage() {
    const [modalCrear, setModalCrear] = useState(false);
    const [modalCargar, setModalCargar] = useState(false);
    const [modalObservar, setModalObservar] = useState(false);
    const [modalValidar, setModalValidar] = useState(false);
    const [cargarAlumnoId, setCargarAlumnoId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
    const [aviso, setAviso] = useState('');

    const {
        loading,
        error,
        technicalDetail,
        filters,
        setFilters,
        limpiarFiltros,
        recargar,
        selected,
        toggleSelect,
        toggleAll,
        metricas,
        catalogos,
        rows,
        meta,
        documentos,
        promedio,
        actividad,
        actualizadoEn,
        apiOk,
    } = useExpedientes();

    const ids = useMemo(() => rows.map((r) => r.alumno_id), [rows]);
    const selectedRows = useMemo(() => rows.filter((r) => selected.includes(r.alumno_id)), [rows, selected]);

    const filtrosActivos = useMemo(() => {
        let n = 0;
        if (filters.search?.trim()) n++;
        if (filters.estatus) n++;
        if (filters.programa_id) n++;
        if (filters.sede_id) n++;
        if (filters.documento_faltante) n++;
        if (filters.con_observaciones) n++;
        if (filters.fecha_desde || filters.fecha_hasta) n++;
        return n;
    }, [filters]);

    const kpi = (n) => (apiOk && metricas ? formatCeNum(n ?? 0) : '—');

    const exportar = async () => {
        if (!canExp('exportar')) return;
        setExporting(true);
        try {
            const p = { ...filters };
            delete p.page;
            await controlEscolarApi.expedientesExportar(p);
        } finally {
            setExporting(false);
        }
    };

    const abrirCargar = (alumnoId = null) => {
        const id = alumnoId ?? selected[0] ?? null;
        if (!id) {
            setAviso('Seleccione un expediente en la tabla o use la acción por fila para cargar un documento.');
            return;
        }
        setAviso('');
        setCargarAlumnoId(id);
        setModalCargar(true);
    };

    const abrirValidar = () => {
        if (!selected.length) {
            setAviso('Selecciona al menos un expediente para validar.');
            return;
        }
        setAviso('');
        setModalValidar(true);
    };

    const abrirObservar = () => {
        if (!selected.length) {
            setAviso('Selecciona al menos un expediente para observar.');
            return;
        }
        setAviso('');
        setModalObservar(true);
    };

    return (
        <div style={ceTheme.pageShell}>
            <CePageHeader
                title="Expedientes de alumnos"
                subtitle="Gestiona, valida y da seguimiento documental a los expedientes académicos de los alumnos."
                updatedAt={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Última actualización: {loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                        <button type="button" onClick={() => void recargar()} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {CeIcons.refreshCw} Actualizar
                        </button>
                    </span>
                }
                actions={(
                    <>
                        {canExp('crear') ? <CeHeaderAction variant="primary" icon={CeIcons.userPlus} label="Crear expediente" onClick={() => setModalCrear(true)} /> : null}
                        {canExp('cargar') ? <CeHeaderAction variant="secondary" icon={CeIcons.upload} label="Cargar documento" onClick={() => abrirCargar()} /> : null}
                        {canExp('validar') ? <CeHeaderAction variant="secondary" icon={CeIcons.check} label="Validar expediente" onClick={abrirValidar} /> : null}
                        {canExp('observar') ? <CeHeaderAction variant="secondary" icon={CeIcons.eye} label="Observar expediente" onClick={abrirObservar} /> : null}
                        {canExp('exportar') ? <CeHeaderAction variant="secondary" icon={CeIcons.download} label={exporting ? 'Exportando…' : 'Exportar'} onClick={() => void exportar()} /> : null}
                    </>
                )}
            />

            <ErrorStateAlert error={error} technicalDetail={technicalDetail} onRetry={recargar} />

            {aviso ? (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: '#EFF6FF', color: '#1E40AF', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{aviso}</span>
                    <button type="button" onClick={() => setAviso('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }} aria-label="Cerrar">×</button>
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
                        <AlumnoKpiCard icon={CeIcons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value={kpi(metricas?.pendientes ?? metricas?.expedientes_pendientes)} trend={apiOk ? `${kpi(metricas?.total_en_alcance)} en tu alcance` : undefined} onClick={() => setFilters({ estatus: 'pendiente' })} active={filters.estatus === 'pendiente'} />
                        <AlumnoKpiCard icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Completos" value={kpi(metricas?.completos)} onClick={() => setFilters({ estatus: 'completo' })} active={filters.estatus === 'completo'} />
                        <AlumnoKpiCard icon={CeIcons.alertTriangle} iconBg="#FEF3C7" iconColor="#BA7517" title="Con observaciones" value={kpi(metricas?.con_observaciones)} onClick={() => setFilters({ estatus: 'observado' })} active={filters.estatus === 'observado'} />
                        <AlumnoKpiCard icon={CeIcons.file} iconBg="#EEEDFE" iconColor="#534AB7" title="Documentos faltantes" value={kpi(metricas?.documentos_faltantes)} onClick={() => setFilters({ estatus: 'documentos_faltantes' })} active={filters.estatus === 'documentos_faltantes'} />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 16, alignItems: 'start' }}>
                <div style={ceTheme.surface}>
                    {selected.length > 0 ? (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', padding: 10, background: '#EFF6FF', borderRadius: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.length} seleccionados</span>
                            {canExp('validar') ? <button type="button" onClick={abrirValidar} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Validar</button> : null}
                            {canExp('observar') ? <button type="button" onClick={abrirObservar} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Observar</button> : null}
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <input
                            type="search"
                            value={filters.search || ''}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            placeholder="Buscar por alumno, matrícula, CURP o folio…"
                            style={{ flex: 1, minWidth: 200, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 13 }}
                        />
                        <button type="button" onClick={() => setFiltrosAbiertos((v) => !v)} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                            Filtros {filtrosActivos > 0 ? `(${filtrosActivos})` : ''}
                        </button>
                        <button type="button" onClick={limpiarFiltros} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer' }}>Limpiar</button>
                    </div>

                    {filtrosAbiertos ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                            <select value={filters.estatus || ''} onChange={(e) => setFilters({ estatus: e.target.value })} style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                {(catalogos.estatus ?? []).map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <select value={filters.programa_id || ''} onChange={(e) => setFilters({ programa_id: e.target.value })}>
                                <option value="">Programa</option>
                                {(catalogos.programas ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <select value={filters.sede_id || ''} onChange={(e) => setFilters({ sede_id: e.target.value })}>
                                <option value="">Sede</option>
                                {(catalogos.sedes ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <select value={filters.documento_faltante || ''} onChange={(e) => setFilters({ documento_faltante: e.target.value })}>
                                <option value="">Documento faltante</option>
                                {(catalogos.documentos_faltantes ?? []).map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                            <select value={filters.con_observaciones || ''} onChange={(e) => setFilters({ con_observaciones: e.target.value })}>
                                <option value="">Con observaciones</option>
                                <option value="1">Sí</option>
                                <option value="0">No</option>
                            </select>
                            <input type="date" value={filters.fecha_desde || ''} onChange={(e) => setFilters({ fecha_desde: e.target.value })} aria-label="Desde" />
                            <input type="date" value={filters.fecha_hasta || ''} onChange={(e) => setFilters({ fecha_hasta: e.target.value })} aria-label="Hasta" />
                            <button type="button" onClick={() => void recargar()} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Aplicar filtros</button>
                        </div>
                    ) : null}

                    {!loading && apiOk && rows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <p style={{ fontWeight: 700 }}>Aún no hay expedientes registrados</p>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Comienza creando un expediente o cargando documentos.</p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                                {canExp('crear') ? <button type="button" onClick={() => setModalCrear(true)} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#185FA5', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Crear primer expediente</button> : null}
                                {canExp('cargar') ? <button type="button" onClick={() => abrirCargar()} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cargar documento</button> : null}
                            </div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
                                        <th style={{ padding: 8 }}>
                                            <input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={() => toggleAll(ids)} />
                                        </th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Folio</th>
                                        <th style={{ textAlign: 'left', padding: 8 }}>Alumno</th>
                                        <th style={{ padding: 8 }}>CURP</th>
                                        <th style={{ padding: 8 }}>Programa</th>
                                        <th style={{ padding: 8 }}>Avance</th>
                                        <th style={{ padding: 8 }}>Actualización</th>
                                        <th style={{ padding: 8 }}>Estatus</th>
                                        <th style={{ padding: 8 }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && !rows.length ? (
                                        <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center' }}>Cargando…</td></tr>
                                    ) : rows.map((r) => (
                                        <tr key={r.alumno_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 8 }}><input type="checkbox" checked={selected.includes(r.alumno_id)} onChange={() => toggleSelect(r.alumno_id)} /></td>
                                            <td style={{ padding: 8 }}><Link to={r.urls?.ver} style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>{r.folio}</Link></td>
                                            <td style={{ padding: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{sanitizeInstitutionalLabel(r.alumno)}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{r.matricula}</div>
                                            </td>
                                            <td style={{ padding: 8, fontSize: 11, fontFamily: 'monospace' }}>{r.curp}</td>
                                            <td style={{ padding: 8, fontSize: 12 }}>{sanitizeInstitutionalLabel(r.programa)}</td>
                                            <td style={{ padding: 8 }}><ExpedienteProgressBar avance={r.avance} /></td>
                                            <td style={{ padding: 8, fontSize: 11, color: '#64748b' }}>{formatDateTime(r.actualizado_en)}</td>
                                            <td style={{ padding: 8 }}><ExpedienteStatusBadge estatus={r.estatus} /></td>
                                            <td style={{ padding: 8 }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                    {canExp('ver') ? <Link to={r.urls?.ver} title="Ver" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 6 }}>{CeIcons.eye}</Link> : null}
                                                    {canExp('cargar') ? <button type="button" title="Cargar" onClick={() => abrirCargar(r.alumno_id)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>{CeIcons.upload}</button> : null}
                                                    {canExp('editar') ? <Link to={r.urls?.editar} title="Editar" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 6 }}>{CeIcons.pencil}</Link> : null}
                                                    {canExp('descargar') ? <Link to={r.urls?.descargar} title="Descargar documentos" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 6 }}>{CeIcons.download}</Link> : null}
                                                    {canExp('observar') ? <button type="button" title="Observar" onClick={() => { setSelected([r.alumno_id]); setModalObservar(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>{CeIcons.alertTriangle}</button> : null}
                                                    {canExp('validar') ? <button type="button" title={r.puede_validar ? 'Validar' : (r.bloqueos_validacion ?? []).join(' ')} disabled={!r.puede_validar} onClick={() => { setSelected([r.alumno_id]); setModalValidar(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: r.puede_validar ? 'pointer' : 'not-allowed', opacity: r.puede_validar ? 1 : 0.4 }}>{CeIcons.check}</button> : null}
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
                        <p style={ceTheme.surfaceTitle}>Documentos requeridos <Link to="/app/control-escolar/expedientes" style={{ fontSize: 12, color: '#185FA5' }}>Ver todos</Link></p>
                        {documentos.map((d) => {
                            const pal = getProgressSeverity(d.pct ?? d.porcentaje ?? 0);
                            return (
                                <div key={d.codigo ?? d.nombre} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                        <span>{d.nombre}</span>
                                        <span style={{ fontWeight: 600 }}>{d.comp ?? `${d.total_completado}/${d.total_requerido}`}</span>
                                    </div>
                                    <div style={{ height: 5, background: '#e2e8f0', borderRadius: 4, marginTop: 4 }}>
                                        <div style={{ height: '100%', width: `${d.pct ?? d.porcentaje ?? 0}%`, background: pal.color, borderRadius: 4 }} />
                                    </div>
                                </div>
                            );
                        })}
                        <p style={{ fontSize: 12, marginTop: 12 }}>Promedio de cumplimiento: <strong>{promedio}%</strong></p>
                    </div>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Actividad reciente</p>
                        {actividad.length === 0 ? <p style={{ fontSize: 12, color: '#94a3b8' }}>Aún no hay actividad registrada.</p> : actividad.map((a) => (
                            <div key={a.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, background: a.severidad === 'success' ? '#16a34a' : a.severidad === 'warning' ? '#CA8A04' : '#185FA5' }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{a.titulo}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{a.expediente_folio ?? a.descripcion} · {a.tiempo_relativo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CrearExpedienteModal open={modalCrear} onClose={() => setModalCrear(false)} onSuccess={recargar} />
            <CargarDocumentoModal open={modalCargar} onClose={() => setModalCargar(false)} alumnoId={cargarAlumnoId} onSuccess={recargar} />
            <ObservarExpedienteModal open={modalObservar} onClose={() => setModalObservar(false)} alumnoIds={selected} onSuccess={recargar} />
            <ValidarExpedienteModal open={modalValidar} onClose={() => setModalValidar(false)} alumnoIds={selected.length ? selected : selectedRows.map((r) => r.alumno_id)} rows={selectedRows.length ? selectedRows : rows.filter((r) => selected.includes(r.alumno_id))} onSuccess={recargar} />
        </div>
    );
}

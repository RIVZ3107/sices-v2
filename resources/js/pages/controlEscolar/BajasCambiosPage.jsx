import React, { useMemo, useState } from 'react';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CeMetricCard,
    CePageHeader,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { ErrorStateAlert } from './alumnos/ErrorStateAlert';
import { userCanAny } from '../../utils/userPermissions';
import { BajaCambioStatusBadge, PriorityBadge } from './bajasCambios/BajaCambioBadges';
import {
    AprobarBajaCambioModal,
    NuevaSolicitudBajaCambioModal,
    ObservarBajaCambioModal,
    RechazarBajaCambioModal,
} from './bajasCambios/BajasCambiosModals';
import { canBc } from './bajasCambios/bajasCambiosPermissions';
import { countAdvancedFilters, getBajaCambioStatusMeta } from './bajasCambios/bajaCambioUx';
import { useBajasCambios } from './bajasCambios/useBajasCambios';

const PERMISOS_TECNICO = ['menus.administrar', 'roles.administrar', 'sistemas.integraciones.ver'];

function Btn({ label, onClick, disabled, loading, variant = 'secondary', color }) {
    const bg = variant === 'primary' ? (color || '#185FA5') : variant === 'danger' ? '#991B1B' : variant === 'success' ? '#0F6E56' : 'white';
    const fg = variant === 'secondary' ? '#0f172a' : '#fff';
    return (
        <button type="button" disabled={disabled || loading} onClick={onClick} title={disabled ? 'No disponible con su rol' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 8, border: variant === 'secondary' ? '1px solid #e2e8f0' : 'none', background: disabled ? '#f1f5f9' : bg, color: disabled ? '#94a3b8' : fg, fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Procesando…' : label}
        </button>
    );
}

export function BajasCambiosPage() {
    const [showMenu, setShowMenu] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [modalNueva, setModalNueva] = useState(false);
    const [tipoNueva, setTipoNueva] = useState('baja_temporal');
    const [modalAprobar, setModalAprobar] = useState(false);
    const [modalRechazar, setModalRechazar] = useState(false);
    const [modalObservar, setModalObservar] = useState(false);
    const [solicitudActiva, setSolicitudActiva] = useState(null);
    const [toast, setToast] = useState('');
    const [exporting, setExporting] = useState(false);
    const [rowBusy, setRowBusy] = useState(null);

    const esTecnico = userCanAny(PERMISOS_TECNICO);

    const {
        loading, error, technicalDetail, filters, draft, setFilters, setDraft, aplicarFiltros,
        limpiarFiltros, recargar, rows, meta, resumen, flujo, riesgo, motivos, recientes,
        actualizadoEn, selected, toggleSelect, toggleAll,
    } = useBajasCambios();

    const advCount = countAdvancedFilters(draft);
    const kpi = (n) => (loading && !resumen ? '…' : formatCeNum(n ?? 0));
    const ids = rows.map((r) => r.id);
    const allSelected = ids.length > 0 && selected.length === ids.length;

    const pipeline = useMemo(() => [
        { key: 'solicitud', label: 'Solicitud', total: flujo?.solicitud_total ?? 0, max: flujo?.maximos_espera?.solicitud ?? 5, avg: flujo?.tiempos_promedio?.solicitud ?? 0 },
        { key: 'revision', label: 'Revisión', total: flujo?.revision_total ?? 0, max: flujo?.maximos_espera?.revision ?? 5, avg: flujo?.tiempos_promedio?.revision ?? 0 },
        { key: 'dictamen', label: 'Dictamen', total: flujo?.dictamen_total ?? 0, max: flujo?.maximos_espera?.dictamen ?? 7, avg: flujo?.tiempos_promedio?.dictamen ?? 0 },
        { key: 'aplicacion', label: 'Aplicación', total: flujo?.aplicacion_total ?? 0, max: flujo?.maximos_espera?.aplicacion ?? 3, avg: flujo?.tiempos_promedio?.aplicacion ?? 0 },
    ], [flujo]);

    const grad = motivos.length > 0
        ? `conic-gradient(${motivos.map((m, i, arr) => {
            const start = (arr.slice(0, i).reduce((s, x) => s + (x.porcentaje ?? x.pct ?? 0), 0) / 100) * 360;
            const end = (arr.slice(0, i + 1).reduce((s, x) => s + (x.porcentaje ?? x.pct ?? 0), 0) / 100) * 360;
            return `${m.color} ${start}deg ${end}deg`;
        }).join(', ')})`
        : 'conic-gradient(#e2e8f0 0deg 360deg)';

    const abrirNueva = (tipo) => { setTipoNueva(tipo); setShowMenu(false); setModalNueva(true); };
    const onSuccess = (msg) => { setToast(msg); void recargar(); };

    const exportar = async () => {
        if (!canBc('exportar')) return;
        setExporting(true);
        try {
            await controlEscolarApi.bajasCambiosExportar(filters);
            setToast('Reporte exportado.');
        } catch (err) {
            setToast(err?.message ?? 'No se pudo exportar.');
        } finally {
            setExporting(false);
        }
    };

    const aplicarFila = async (row) => {
        if (!canBc('aplicar')) return;
        setRowBusy(row.id);
        try {
            await controlEscolarApi.bajasCambiosAplicar(row.id);
            onSuccess('Cambio aplicado en el expediente académico.');
        } catch (err) {
            setToast(err?.message ?? 'No se pudo aplicar.');
        } finally {
            setRowBusy(null);
        }
    };

    const chips = useMemo(() => {
        const list = [];
        if (filters.estatus) list.push({ key: 'e', label: `Estatus: ${getBajaCambioStatusMeta(filters.estatus).label}`, clear: { estatus: '' } });
        if (filters.tipo_cambio) list.push({ key: 't', label: `Tipo: ${filters.tipo_cambio}`, clear: { tipo_cambio: '' } });
        if (filters.etapa) list.push({ key: 'et', label: `Etapa: ${filters.etapa}`, clear: { etapa: '' } });
        return list;
    }, [filters]);

    const empty = !loading && rows.length === 0;

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <CePageHeader
                breadcrumbCurrent="Bajas y cambios de estatus"
                title="Bajas y cambios de estatus"
                subtitle="Administra y da seguimiento a las solicitudes de baja y cambios de estatus de los alumnos."
                updatedAt={(
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                        <button type="button" onClick={() => void recargar()} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Actualizar</button>
                    </span>
                )}
            />

            {toast ? <p style={{ marginBottom: 12, padding: '10px 14px', background: '#ECFDF5', color: '#166534', borderRadius: 8, fontSize: 13 }}>{toast}</p> : null}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <Btn label="Nueva solicitud" variant="primary" disabled={!canBc('crear')} onClick={() => setShowMenu((v) => !v)} />
                    {showMenu && canBc('crear') ? (
                        <div style={{ position: 'absolute', top: 42, left: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 200 }}>
                            {[
                                ['baja_temporal', 'Baja temporal'],
                                ['baja_definitiva', 'Baja definitiva'],
                                ['cambio_grupo', 'Cambio de grupo'],
                                ['cambio_turno', 'Cambio de turno'],
                                ['cambio_programa', 'Cambio de programa'],
                            ].map(([v, l]) => (
                                <button key={v} type="button" onClick={() => abrirNueva(v)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}>{l}</button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <Btn label="Aprobar" variant="success" disabled={!canBc('aprobar') || selected.length === 0} onClick={() => setModalAprobar(true)} />
                <Btn label="Rechazar" variant="danger" disabled={!canBc('rechazar') || selected.length === 0} onClick={() => setModalRechazar(true)} />
                <Btn label="Exportar reporte" disabled={!canBc('exportar')} loading={exporting} onClick={() => void exportar()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {pipeline.map((p, i) => (
                    <button key={p.key} type="button" onClick={() => setFilters({ etapa: p.key })} style={{ ...ceTheme.surface, padding: 14, textAlign: 'left', cursor: 'pointer', border: filters.etapa === p.key ? '2px solid #185FA5' : ceTheme.surface.border, position: 'relative' }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{i + 1}. {p.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, margin: '6px 0' }}>{kpi(p.total)}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Máx. espera: {p.max} días · Prom.: {p.avg} d</div>
                        {i < 3 ? <span style={{ position: 'absolute', right: -8, top: '50%', color: '#cbd5e1' }}>→</span> : null}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <CeMetricCard icon={CeIcons.lock} iconBg="#FEE2E2" iconColor="#DC2626" title="Bajas temporales" value={kpi(resumen?.bajas_temporales)} trend="En alcance operativo" trendColor="#64748b" onClick={() => setFilters({ tipo_cambio: 'baja_temporal' })} />
                        <CeMetricCard icon={CeIcons.boxX} iconBg="#EEEDFE" iconColor="#6B21A8" title="Bajas definitivas" value={kpi(resumen?.bajas_definitivas)} trend="Registros consolidados" trendColor="#64748b" onClick={() => setFilters({ tipo_cambio: 'baja_definitiva' })} />
                        <CeMetricCard icon={CeIcons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Cambios pendientes" value={kpi(resumen?.cambios_pendientes)} trend="Pendientes de revisión" trendColor="#185FA5" onClick={() => setFilters({ estatus: 'en_revision' })} />
                        <CeMetricCard icon={CeIcons.upload} iconBg="#FFEDD5" iconColor="#EA580C" title="Observadas" value={kpi(resumen?.observadas)} trend="Requieren atención" trendColor="#EA580C" onClick={() => setFilters({ estatus: 'observada' })} />
                        <CeMetricCard icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Aprobadas este periodo" value={kpi(resumen?.aprobadas_periodo)} trend="Del ciclo actual" trendColor="#0F6E56" onClick={() => setFilters({ estatus: 'aprobada' })} />
                    </div>

                    {selected.length > 0 ? (
                        <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                            {selected.length} solicitud(es) seleccionada(s)
                        </div>
                    ) : null}

                    <div style={{ ...ceTheme.surface, marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                            <input type="search" placeholder="Buscar alumno, matrícula, CURP o folio…" value={draft.search ?? ''} onChange={(e) => setDraft({ search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()} style={{ flex: '1 1 200px', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13 }} />
                            <select value={draft.estatus ?? ''} onChange={(e) => setDraft({ estatus: e.target.value })} style={{ height: 38, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                                <option value="">Todos los estatus</option>
                                <option value="solicitada">Solicitada</option>
                                <option value="en_revision">En revisión</option>
                                <option value="observada">Observada</option>
                                <option value="aprobada">Aprobada</option>
                                <option value="por_aplicar">Por aplicar</option>
                            </select>
                            <select value={draft.tipo_cambio ?? ''} onChange={(e) => setDraft({ tipo_cambio: e.target.value })} style={{ height: 38, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                                <option value="">Tipo de cambio</option>
                                <option value="baja_temporal">Baja temporal</option>
                                <option value="baja_definitiva">Baja definitiva</option>
                                <option value="cambio_grupo">Cambio de grupo</option>
                                <option value="cambio_turno">Cambio de turno</option>
                                <option value="cambio_programa">Cambio de programa</option>
                            </select>
                            <Btn label={advCount > 0 ? `Más filtros (${advCount})` : 'Más filtros'} onClick={() => setShowAdvanced((v) => !v)} />
                            <Btn label="Aplicar" variant="primary" onClick={aplicarFiltros} />
                            <Btn label="Limpiar" onClick={limpiarFiltros} />
                        </div>
                        {showAdvanced ? (
                            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <select value={draft.etapa ?? ''} onChange={(e) => setDraft({ etapa: e.target.value })} style={{ height: 36, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                                    <option value="">Etapa</option>
                                    {['solicitud', 'revision', 'dictamen', 'aplicacion'].map((e) => <option key={e} value={e}>{e}</option>)}
                                </select>
                                <select value={draft.prioridad ?? ''} onChange={(e) => setDraft({ prioridad: e.target.value })} style={{ height: 36, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                                    <option value="">Prioridad</option>
                                    {['baja', 'media', 'alta', 'critica'].map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={draft.criticas === '1'} onChange={(e) => setDraft({ criticas: e.target.checked ? '1' : '' })} /> Críticas</label>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={draft.vencidas === '1'} onChange={(e) => setDraft({ vencidas: e.target.checked ? '1' : '' })} /> Vencidas</label>
                            </div>
                        ) : null}
                        {chips.length > 0 ? (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                {chips.map((c) => (
                                    <button key={c.key} type="button" onClick={() => setFilters(c.clear)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1e40af' }}>{c.label} ×</button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {error ? <ErrorStateAlert message={error.message} onRetry={() => void recargar()} technicalDetail={esTecnico ? technicalDetail : ''} /> : (
                        <div style={ceTheme.surface}>
                            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Cola de decisiones</h2>
                            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                                {meta.from && meta.to ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados` : `Total: ${formatCeNum(meta.total ?? 0)}`}
                            </p>

                            {loading && rows.length === 0 ? <p style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Cargando solicitudes…</p> : null}

                            {empty ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 8px' }}>No hay solicitudes de bajas o cambios en tu alcance</h3>
                                    <p style={{ color: '#64748b', fontSize: 13 }}>Inicia una nueva solicitud o ajusta los filtros de búsqueda.</p>
                                    <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                                        <Btn label="Nueva solicitud" variant="primary" disabled={!canBc('crear')} onClick={() => setModalNueva(true)} />
                                        <Btn label="Limpiar filtros" onClick={limpiarFiltros} />
                                    </div>
                                </div>
                            ) : null}

                            {!empty && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: 8 }}><input type="checkbox" checked={allSelected} onChange={() => toggleAll(ids)} /></th>
                                                {['Alumno', 'Matrícula', 'Programa', 'Tipo', 'Motivo', 'Fecha', 'Prioridad / Estatus', 'Etapa', 'Último mov.', 'Responsable', 'Acciones'].map((h) => (
                                                    <th key={h} style={{ padding: '8px 6px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: r.vencida ? '#FFF7ED' : undefined }}>
                                                    <td style={{ padding: 8 }}><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12, fontWeight: 600 }}>{r.alumno}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12, color: '#64748b' }}>{r.matricula}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12 }}>{r.programa}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12 }}>{r.tipo_cambio_label}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12, maxWidth: 140 }}>{r.motivo}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 11 }}>{r.fecha_solicitud}</td>
                                                    <td style={{ padding: '8px 6px' }}>
                                                        <PriorityBadge prioridad={r.prioridad} />
                                                        <div style={{ marginTop: 4 }}><BajaCambioStatusBadge estatus={r.estatus} label={r.estatus_label} /></div>
                                                    </td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12, textTransform: 'capitalize' }}>{r.etapa}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 11, color: '#64748b' }}>{r.ultimo_movimiento?.fecha}</td>
                                                    <td style={{ padding: '8px 6px', fontSize: 12 }}>{r.responsable}</td>
                                                    <td style={{ padding: '8px 6px' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {canBc('aprobar') ? <button type="button" style={{ fontSize: 11, border: 'none', background: 'none', color: '#0F6E56', cursor: 'pointer' }} onClick={() => { setSolicitudActiva(r); setSelected([r.id]); setModalAprobar(true); }}>Aprobar</button> : null}
                                                            {canBc('rechazar') ? <button type="button" style={{ fontSize: 11, border: 'none', background: 'none', color: '#991B1B', cursor: 'pointer' }} onClick={() => { setSolicitudActiva(r); setSelected([r.id]); setModalRechazar(true); }}>Rechazar</button> : null}
                                                            {canBc('observar') ? <button type="button" style={{ fontSize: 11, border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer' }} onClick={() => { setSolicitudActiva(r); setModalObservar(true); }}>Observar</button> : null}
                                                            {canBc('aplicar') && ['aprobada', 'por_aplicar'].includes(r.estatus) ? (
                                                                <button type="button" disabled={rowBusy === r.id} style={{ fontSize: 11, border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer' }} onClick={() => void aplicarFila(r)}>{rowBusy === r.id ? '…' : 'Aplicar'}</button>
                                                            ) : null}
                                                            {canBc('revisar') && r.estatus === 'solicitada' ? (
                                                                <button type="button" style={{ fontSize: 11, border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }} onClick={async () => { try { await controlEscolarApi.bajasCambiosRevisar(r.id); onSuccess('En revisión.'); } catch (e) { setToast(e?.message); } }}>Revisar</button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Riesgo operativo</h3>
                        {[
                            ['solicitudes_criticas', 'Solicitudes críticas', { criticas: '1' }],
                            ['solicitudes_vencidas', 'Solicitudes vencidas', { vencidas: '1' }],
                            ['documentacion_incompleta', 'Documentación incompleta', { documentos_pendientes: '1' }],
                            ['impacto_academico_alto', 'Impacto académico alto', {}],
                        ].map(([key, label, filt]) => (
                            <button key={key} type="button" onClick={() => setFilters(filt)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f1f5f9' }}>
                                <span>{label}</span>
                                <strong style={{ color: key === 'solicitudes_criticas' ? '#991B1B' : '#185FA5' }}>{kpi(riesgo?.[key])}</strong>
                            </button>
                        ))}
                        <Btn label="Ver solicitudes críticas" variant="primary" onClick={() => setFilters({ criticas: '1' })} />
                    </div>

                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Motivos frecuentes</h3>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: grad, margin: '0 auto 12px' }} />
                        {motivos.map((m) => (
                            <button key={m.motivo ?? m.label} type="button" onClick={() => setFilters(m.filtro ?? { motivo: m.motivo })} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer' }}>
                                <span>{m.label}</span>
                                <span>{m.porcentaje ?? m.pct}% ({m.total ?? m.count})</span>
                            </button>
                        ))}
                    </div>

                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Cambios recientes</h3>
                        {recientes.length === 0 ? <p style={{ fontSize: 12, color: '#64748b' }}>Sin actividad reciente.</p> : recientes.slice(0, 6).map((c) => (
                            <div key={c.id} style={{ marginBottom: 10, fontSize: 12 }}>
                                <div style={{ fontWeight: 600 }}>{c.text ?? c.tipo_cambio}</div>
                                <div style={{ color: '#64748b' }}>{c.subtext ?? c.alumno} · {c.tiempo_relativo ?? c.date}</div>
                            </div>
                        ))}
                    </div>

                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Atajos rápidos</h3>
                        <Btn label="Nueva solicitud" variant="primary" disabled={!canBc('crear')} onClick={() => setModalNueva(true)} />
                        <div style={{ height: 8 }} />
                        <Btn label="Solicitudes críticas" onClick={() => setFilters({ criticas: '1' })} />
                    </div>
                </aside>
            </div>

            <NuevaSolicitudBajaCambioModal open={modalNueva} tipoInicial={tipoNueva} onClose={() => setModalNueva(false)} onSuccess={onSuccess} />
            <AprobarBajaCambioModal open={modalAprobar} solicitud={solicitudActiva} ids={selected} onClose={() => { setModalAprobar(false); setSolicitudActiva(null); }} onSuccess={onSuccess} />
            <RechazarBajaCambioModal open={modalRechazar} solicitud={solicitudActiva} ids={selected} onClose={() => { setModalRechazar(false); setSolicitudActiva(null); }} onSuccess={onSuccess} />
            <ObservarBajaCambioModal open={modalObservar} solicitud={solicitudActiva} onClose={() => { setModalObservar(false); setSolicitudActiva(null); }} onSuccess={onSuccess} />
        </div>
    );
}

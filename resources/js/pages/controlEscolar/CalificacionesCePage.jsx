import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CeMetricCard,
    CePageHeader,
    ceColors,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { ErrorStateAlert } from './alumnos/ErrorStateAlert';
import { formatDateTime } from '../../utils/expedienteUx';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';
import { CalificacionStatusBadge } from './calificaciones/CalificacionStatusBadge';
import {
    CalificacionCapturaModal,
    CalificacionesHistorialModal,
    ImportarCalificacionesModal,
    SolicitarCorreccionModal,
} from './calificaciones/CalificacionesModals';
import { canCal } from './calificaciones/calificacionesPermissions';
import { useCalificaciones } from './calificaciones/useCalificaciones';

function ActionBtn({ label, icon, onClick, disabled, loading, title, variant = 'secondary' }) {
    const border = variant === 'primary' ? '#185FA5' : '#e2e8f0';
    const color = disabled ? '#94a3b8' : variant === 'primary' ? '#185FA5' : '#0f172a';
    return (
        <button
            type="button"
            title={disabled ? (title || 'No disponible') : title}
            disabled={disabled || loading}
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px',
                borderRadius: 8, border: `1px solid ${border}`, background: 'white',
                fontSize: 13, fontWeight: 500, color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
        >
            <span style={{ display: 'flex', color: disabled ? '#94a3b8' : '#185FA5' }}>{icon}</span>
            {loading ? 'Procesando…' : label}
        </button>
    );
}

export function CalificacionesCePage() {
    const [modalCaptura, setModalCaptura] = useState(false);
    const [modalImportar, setModalImportar] = useState(false);
    const [modalHistorial, setModalHistorial] = useState(false);
    const [modalCorreccion, setModalCorreccion] = useState(false);
    const [grupoActivo, setGrupoActivo] = useState(null);
    const [correccionId, setCorreccionId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [aviso, setAviso] = useState('');

    const {
        loading, error, technicalDetail, filters, setFilters, limpiarFiltros, recargar,
        rows, meta, resumen, avance, pendientes, fechas, ventana, aviso: avisoInst,
        actualizadoEn, selected, toggleSelect, toggleAll,
    } = useCalificaciones();

    const pctGlobal = resumen?.avance_global ?? 0;
    const dist = avance?.distribucion_estatus ?? avance?.estado_captura ?? {};
    const ventanaAbierta = ventana?.abierta !== false;

    const filtrosActivos = useMemo(() => {
        let n = 0;
        if (filters.search?.trim()) n++;
        if (filters.estatus || filters.con_pendientes || filters.con_correcciones) n++;
        return n;
    }, [filters]);

    const abrirCaptura = (key) => {
        if (!canCal('capturar')) return;
        if (!ventanaAbierta) {
            setAviso('La ventana de captura está cerrada.');
            return;
        }
        setGrupoActivo(key || selected[0] || null);
        setModalCaptura(true);
    };

    const exportar = async () => {
        if (!canCal('exportar')) return;
        setExporting(true);
        try {
            await controlEscolarApi.calificacionesExportar(filters);
            setAviso('Archivo exportado correctamente.');
        } catch (err) {
            setAviso(err?.message ?? 'No se pudo exportar.');
        } finally {
            setExporting(false);
        }
    };

    const kpi = (n) => (loading && !resumen ? '…' : formatCeNum(n ?? 0));

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <CePageHeader
                breadcrumbCurrent="Calificaciones"
                title="Calificaciones"
                subtitle="Captura, importa y da seguimiento operativo a las calificaciones por grupo, materia y periodo."
                updatedAt={(
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                        <button type="button" onClick={() => void recargar()} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {CeIcons.refreshCw} Actualizar
                        </button>
                    </span>
                )}
            />

            <div style={{ padding: '12px 16px', borderRadius: 8, background: ventanaAbierta ? '#EFF6FF' : '#FEF3C7', border: `1px solid ${ventanaAbierta ? '#BFDBFE' : '#FDE68A'}`, marginBottom: 16, fontSize: 13, color: ventanaAbierta ? '#1e40af' : '#92400e' }}>
                {avisoInst || 'Captura e importación operativa. La autorización final de correcciones y el cierre global no corresponden a Control Escolar.'}
                {!ventanaAbierta && ventana?.mensaje ? (
                    <p style={{ margin: '8px 0 0', fontWeight: 600 }}>{ventana.mensaje}</p>
                ) : null}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {canCal('capturar') ? (
                        <ActionBtn label="Capturar calificación" icon={CeIcons.pencil} onClick={() => abrirCaptura()} disabled={!ventanaAbierta} title={!ventanaAbierta ? 'Ventana de captura cerrada' : 'Selecciona un grupo o usa acciones por fila'} />
                    ) : null}
                    {canCal('importar') ? (
                        <ActionBtn label="Importar calificaciones" icon={CeIcons.upload} onClick={() => { setGrupoActivo(selected[0] || null); setModalImportar(true); }} disabled={!ventanaAbierta} />
                    ) : null}
                    {canCal('correccion') ? (
                        <ActionBtn label="Solicitar corrección" icon={CeIcons.cornerUpLeft} onClick={() => setModalCorreccion(true)} disabled={!correccionId && !selected.length} />
                    ) : null}
                    {canCal('historial') ? (
                        <ActionBtn label="Ver historial" icon={CeIcons.history} onClick={() => { setGrupoActivo(selected[0] || null); setModalHistorial(true); }} />
                    ) : null}
                </div>
                {canCal('exportar') ? (
                    <ActionBtn label="Exportar" icon={CeIcons.download} onClick={() => void exportar()} loading={exporting} />
                ) : null}
            </div>

            {error ? <ErrorStateAlert message={error.message} onRetry={recargar} technicalDetail={technicalDetail} status={error.status} /> : null}
            {aviso ? <p style={{ marginBottom: 12, padding: 10, background: '#EFF6FF', color: '#1e40af', borderRadius: 8, fontSize: 13 }}>{aviso}</p> : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setFilters({ estatus: 'en_captura' })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flex: '1 1 200px' }}>
                    <CeMetricCard icon={CeIcons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Grupos en captura" value={kpi(resumen?.grupos_en_captura)} trend={resumen?.ciclo_label} trendColor="#185FA5" />
                </button>
                <button type="button" onClick={() => setFilters({})} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flex: '1 1 200px' }}>
                    <CeMetricCard icon={CeIcons.trendingUp} iconBg="#DCFCE7" iconColor="#0F6E56" title="Avance global" value={loading && !resumen ? '…' : `${pctGlobal}%`} trend="Captura y revisión" trendColor="#0F6E56" />
                </button>
                <button type="button" onClick={() => setFilters({ con_pendientes: '1' })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flex: '1 1 200px' }}>
                    <CeMetricCard icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Pendientes de captura" value={kpi(resumen?.pendientes_captura)} trend="Por capturar" trendColor="#BA7517" />
                </button>
                <button type="button" onClick={() => setFilters({ con_correcciones: '1' })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flex: '1 1 200px' }}>
                    <CeMetricCard icon={CeIcons.messageCircle} iconBg="#EEEDFE" iconColor="#534AB7" title="Correcciones solicitadas" value={kpi(resumen?.correcciones_solicitadas)} trend="En flujo institucional" trendColor="#534AB7" />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr) minmax(260px, 1fr)', gap: 16, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Avance de captura</p>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>Progreso global: {pctGlobal}%</p>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, margin: '8px 0 16px' }}>
                            <div style={{ width: `${pctGlobal}%`, height: '100%', background: '#0F6E56', borderRadius: 4 }} />
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Avance por programa</p>
                        {(avance?.avance_por_programa ?? []).map((p) => (
                            <div key={p.programa} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                    <span>{sanitizeInstitutionalLabel(p.programa)}</span>
                                    <span>{p.porcentaje}%</span>
                                </div>
                                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 4 }}>
                                    <div style={{ width: `${p.porcentaje}%`, height: '100%', background: '#185FA5', borderRadius: 2 }} />
                                </div>
                            </div>
                        ))}
                        <p style={{ fontSize: 12, fontWeight: 600, marginTop: 16 }}>Estado de captura</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 11 }}>
                            {[
                                { k: 'completado', c: '#0F6E56' },
                                { k: 'en_captura', c: '#185FA5' },
                                { k: 'pendiente', c: '#BA7517' },
                                { k: 'en_correccion', c: '#534AB7' },
                            ].map(({ k, c }) => (
                                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                                    {k.replace('_', ' ')}: {dist[k] ?? 0}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Listado por grupos / materias</h2>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                type="search"
                                placeholder="Programa, grupo o materia…"
                                value={filters.search}
                                onChange={(e) => setFilters({ search: e.target.value })}
                                style={{ height: 36, width: 220, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px', fontSize: 13 }}
                            />
                            <button type="button" onClick={() => setFilters({})} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 12 }}>
                                Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
                            </button>
                            {filtrosActivos > 0 ? (
                                <button type="button" onClick={limpiarFiltros} style={{ height: 36, fontSize: 12, color: '#185FA5', border: 'none', background: 'transparent', cursor: 'pointer' }}>Limpiar</button>
                            ) : null}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: ceColors.pageBg }}>
                                    <th style={{ padding: 10 }}><input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={toggleAll} /></th>
                                    {['Grupo / Materia', 'Programa', 'Avance', 'Estado', 'Última actualización', 'Acciones'].map((h) => (
                                        <th key={h} style={{ padding: 10, textAlign: h === 'Acciones' ? 'center' : 'left', color: '#64748b', fontSize: 12 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Cargando…</td></tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 32, textAlign: 'center' }}>
                                            <p style={{ fontWeight: 600 }}>No hay grupos o materias disponibles para captura</p>
                                            <p style={{ color: '#64748b', fontSize: 13 }}>Verifica que existan cargas académicas activas en el ciclo escolar.</p>
                                            <Link to="/app/carga-academica" style={{ color: '#185FA5', fontWeight: 600 }}>Ir a carga académica</Link>
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr key={r.grupo_materia_key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 10 }}><input type="checkbox" checked={selected.includes(r.grupo_materia_key)} onChange={() => toggleSelect(r.grupo_materia_key)} /></td>
                                        <td style={{ padding: 10 }}>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{r.materia}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{r.grupo_label} · {r.clave}</p>
                                        </td>
                                        <td style={{ padding: 10 }}>{sanitizeInstitutionalLabel(r.programa)}</td>
                                        <td style={{ padding: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                                                    <div style={{ width: `${r.avance_pct}%`, height: '100%', background: '#185FA5', borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{r.avance_pct}%</span>
                                            </div>
                                            <span style={{ fontSize: 10, color: '#64748b' }}>{r.calificaciones_capturadas}/{r.alumnos_esperados}</span>
                                        </td>
                                        <td style={{ padding: 10 }}><CalificacionStatusBadge estatus={r.estatus} label={r.estatus_label} /></td>
                                        <td style={{ padding: 10, fontSize: 11, color: '#64748b' }}>{formatDateTime(r.ultima_actualizacion)}</td>
                                        <td style={{ padding: 10 }}>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                {canCal('capturar') ? (
                                                    <button type="button" title="Capturar" onClick={() => abrirCaptura(r.grupo_materia_key)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CeIcons.pencil}</button>
                                                ) : null}
                                                {canCal('importar') ? (
                                                    <button type="button" title="Importar" onClick={() => { setGrupoActivo(r.grupo_materia_key); setModalImportar(true); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CeIcons.upload}</button>
                                                ) : null}
                                                {canCal('historial') ? (
                                                    <button type="button" title="Historial" onClick={() => { setGrupoActivo(r.grupo_materia_key); setModalHistorial(true); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CeIcons.history}</button>
                                                ) : null}
                                                {canCal('exportar') ? (
                                                    <button type="button" title="Exportar" onClick={() => controlEscolarApi.calificacionesExportarGrupo(r.grupo_materia_key)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CeIcons.download}</button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#64748b' }}>
                        <span>{meta.from && meta.to ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados` : ''}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" disabled={Number(filters.page) <= 1 || loading} onClick={() => setFilters({ page: String(Math.max(1, Number(filters.page) - 1)) }, { resetPage: false })}>&lt;</button>
                            <span>{meta.current_page ?? filters.page}</span>
                            <button type="button" disabled={loading || (meta.last_page ?? 1) <= Number(filters.page)} onClick={() => setFilters({ page: String(Number(filters.page) + 1) }, { resetPage: false })}>&gt;</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Acciones rápidas</p>
                        {[
                            { label: 'Capturar calificación', fn: () => abrirCaptura(selected[0]), perm: 'capturar' },
                            { label: 'Importar calificaciones', fn: () => { setGrupoActivo(selected[0]); setModalImportar(true); }, perm: 'importar' },
                            { label: 'Solicitar corrección', fn: () => setModalCorreccion(true), perm: 'correccion' },
                            { label: 'Ver historial', fn: () => { setGrupoActivo(selected[0]); setModalHistorial(true); }, perm: 'historial' },
                        ].map((a) => canCal(a.perm) ? (
                            <button key={a.label} type="button" onClick={a.fn} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 0', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#185FA5', fontWeight: 500 }}>
                                › {a.label}
                            </button>
                        ) : null)}
                    </div>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Pendientes de atención</p>
                        {pendientes ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
                                <li><button type="button" onClick={() => setFilters({ con_correcciones: '1' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#185FA5' }}>{pendientes.grupos_con_correcciones_pendientes} grupos con correcciones</button></li>
                                <li><button type="button" onClick={() => setFilters({ con_pendientes: '1' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#185FA5' }}>{pendientes.grupos_pendientes_captura} grupos pendientes de captura</button></li>
                                <li>{pendientes.grupos_por_cerrar_periodo} grupos por cerrar periodo</li>
                            </ul>
                        ) : <p style={{ fontSize: 12, color: '#64748b' }}>—</p>}
                    </div>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Próximas fechas importantes</p>
                        {fechas.length === 0 ? <p style={{ fontSize: 12, color: '#64748b' }}>Sin fechas configuradas.</p> : fechas.map((f) => (
                            <div key={f.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ textAlign: 'center', minWidth: 36 }}>
                                    <div style={{ fontWeight: 700, fontSize: 18 }}>{f.dia}</div>
                                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>{f.mes}</div>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{f.titulo}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{f.descripcion}</p>
                                    <CalificacionStatusBadge estatus={f.estado === 'proximo' ? 'en_captura' : f.estado} label={f.estado} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CalificacionCapturaModal open={modalCaptura} grupoKey={grupoActivo} onClose={() => setModalCaptura(false)} onSuccess={() => { setAviso('Calificaciones guardadas.'); void recargar(); }} ventanaAbierta={ventanaAbierta} />
            <ImportarCalificacionesModal open={modalImportar} grupoKey={grupoActivo} onClose={() => setModalImportar(false)} onSuccess={() => { setAviso('Importación completada.'); void recargar(); }} ventanaAbierta={ventanaAbierta} />
            <CalificacionesHistorialModal open={modalHistorial} grupoKey={grupoActivo} onClose={() => setModalHistorial(false)} />
            <SolicitarCorreccionModal open={modalCorreccion} materiaCursadaId={correccionId} onClose={() => setModalCorreccion(false)} onSuccess={() => { setAviso('Solicitud registrada.'); void recargar(); }} />
        </div>
    );
}

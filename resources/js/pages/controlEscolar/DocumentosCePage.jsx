import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { DocumentoStatusBadge } from './documentos/DocumentoStatusBadge';
import {
    AtenderObservacionDocumentoModal,
    CancelarDocumentoModal,
    EnviarValidacionDocumentoModal,
    IniciarSolicitudDocumentalModal,
} from './documentos/DocumentosModals';
import { canDoc } from './documentos/documentosPermissions';
import { countAdvancedFilters, getDocumentoStatusMeta } from './documentos/documentoUx';
import { useDocumentosEscolares } from './documentos/useDocumentosEscolares';
import { userCanAny } from '../../utils/userPermissions';

const PERMISOS_ADMIN_TECNICO = ['menus.administrar', 'roles.administrar', 'sistemas.integraciones.ver'];

function ActionBtn({ label, onClick, disabled, loading, title, variant = 'secondary', icon }) {
    const border = variant === 'primary' ? '#185FA5' : '#e2e8f0';
    const color = disabled ? '#94a3b8' : variant === 'primary' ? '#fff' : '#0f172a';
    const bg = variant === 'primary' ? '#185FA5' : 'white';
    return (
        <button
            type="button"
            title={disabled ? (title || 'No disponible con su rol') : title}
            disabled={disabled || loading}
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px',
                borderRadius: 8, border: `1px solid ${border}`, background: bg,
                fontSize: 13, fontWeight: 500, color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
        >
            {icon ? <span style={{ display: 'flex' }}>{icon}</span> : null}
            {loading ? 'Procesando…' : label}
        </button>
    );
}

export function DocumentosCePage() {
    const navigate = useNavigate();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [modalIniciar, setModalIniciar] = useState(false);
    const [modalEnviar, setModalEnviar] = useState(false);
    const [modalAtender, setModalAtender] = useState(false);
    const [modalCancelar, setModalCancelar] = useState(false);
    const [docActivo, setDocActivo] = useState(null);
    const [toast, setToast] = useState('');
    const [exporting, setExporting] = useState(false);
    const [rowLoading, setRowLoading] = useState(null);

    const esAdminTecnico = userCanAny(PERMISOS_ADMIN_TECNICO);

    const {
        loading, error, technicalDetail, filters, draft, setFilters, setDraft, aplicarFiltros,
        limpiarFiltros, recargar, rows, meta, resumen, pendientes, fechas, tipos, aviso, actualizadoEn,
    } = useDocumentosEscolares();

    const advCount = countAdvancedFilters(draft);
    const kpi = (n) => (loading && !resumen ? '…' : formatCeNum(n ?? 0));

    const chips = useMemo(() => {
        const list = [];
        if (filters.estatus) list.push({ key: 'estatus', label: `Estatus: ${getDocumentoStatusMeta(filters.estatus).label}`, clear: { estatus: '' } });
        if (filters.periodo_id) list.push({ key: 'periodo', label: `Periodo: ${filters.periodo_id}`, clear: { periodo_id: '' } });
        if (filters.tipo_documento_id) list.push({ key: 'tipo', label: `Tipo: ${filters.tipo_documento_id}`, clear: { tipo_documento_id: '' } });
        if (filters.search?.trim()) list.push({ key: 'search', label: `Búsqueda: ${filters.search}`, clear: { search: '' } });
        return list;
    }, [filters]);

    const onSuccess = (msg) => {
        setToast(msg);
        void recargar();
    };

    const exportar = async () => {
        if (!canDoc('exportar')) return;
        setExporting(true);
        try {
            await controlEscolarApi.documentosExportar(filters);
            setToast('Archivo exportado correctamente.');
        } catch (err) {
            setToast(err?.message ?? 'No se pudo exportar.');
        } finally {
            setExporting(false);
        }
    };

    const descargarFila = async (row) => {
        if (!canDoc('descargar')) return;
        setRowLoading(row.id);
        try {
            await controlEscolarApi.documentosDescargar(row.id);
            setToast('Documento descargado.');
        } catch (err) {
            setToast(err?.message ?? 'No se pudo descargar el documento.');
        } finally {
            setRowLoading(null);
        }
    };

    const empty = !loading && rows.length === 0;

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <CePageHeader
                breadcrumbCurrent="Documentos escolares"
                title="Documentos escolares"
                subtitle="Solicitudes, envíos, revisiones y documentos institucionales generados para los alumnos."
                updatedAt={(
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                        <button type="button" onClick={() => void recargar()} style={{ border: 'none', background: 'transparent', color: '#185FA5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Actualizar
                        </button>
                    </span>
                )}
            />

            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 16, fontSize: 13, color: '#1e40af' }}>
                {aviso || 'Control Escolar solo inicia solicitudes documentales con tipos autorizados. El ciclo, procesamiento, firma y resultado final corresponden a etapas posteriores.'}
            </div>

            {toast ? (
                <p style={{ marginBottom: 12, padding: '10px 14px', background: '#ECFDF5', color: '#166534', borderRadius: 8, fontSize: 13 }}>{toast}</p>
            ) : null}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <ActionBtn label="Iniciar solicitud documental" variant="primary" disabled={!canDoc('crear')} onClick={() => setModalIniciar(true)} />
                <ActionBtn label="Solicitudes en captura" disabled={!canDoc('ver')} onClick={() => setFilters({ estatus: 'en_captura' })} />
                <ActionBtn label="Pendientes de revisión" disabled={!canDoc('ver')} onClick={() => setFilters({ estatus: 'enviada_validacion' })} />
                <ActionBtn label="Expedientes" disabled={!canDoc('expedientes')} onClick={() => navigate('/app/control-escolar/expedientes')} />
                <ActionBtn label="Exportar" disabled={!canDoc('exportar')} loading={exporting} onClick={() => void exportar()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
                <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                        <CeMetricCard icon={CeIcons.file} iconBg="#EEEDFE" iconColor="#534AB7" title="Solicitudes en captura" value={kpi(resumen?.solicitudes_en_captura)} trend="Sin alumnos pendientes" trendColor="#64748b" onClick={canDoc('ver') ? () => setFilters({ estatus: 'en_captura' }) : undefined} />
                        <CeMetricCard icon={CeIcons.checkCircle} iconBg="#FEF3C7" iconColor="#BA7517" title="Enviadas a validación" value={kpi(resumen?.enviadas_validacion)} trend="Con el verificador" trendColor="#BA7517" onClick={canDoc('ver') ? () => setFilters({ estatus: 'enviada_validacion' }) : undefined} />
                        <CeMetricCard icon={CeIcons.upload} iconBg="#FFEDD5" iconColor="#EA580C" title="Observadas" value={kpi(resumen?.observadas)} trend="Requieren corrección" trendColor="#EA580C" onClick={canDoc('ver') ? () => setFilters({ estatus: 'observada' }) : undefined} />
                        <CeMetricCard icon={CeIcons.file} iconBg="#DCFCE7" iconColor="#0F6E56" title="Autorizadas / Generadas" value={kpi(resumen?.autorizadas_generadas)} trend="Listas para entrega" trendColor="#0F6E56" onClick={canDoc('ver') ? () => setFilters({ estatus: 'autorizada_generada' }) : undefined} />
                    </div>

                    <div style={{ ...ceTheme.surface, marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <input
                                    type="search"
                                    placeholder="Buscar por alumno, matrícula, CURP o documento…"
                                    value={draft.search ?? ''}
                                    onChange={(e) => setDraft({ search: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                                    style={{ width: '100%', height: 38, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', fontSize: 13 }}
                                />
                            </div>
                            <select value={draft.estatus ?? ''} onChange={(e) => setDraft({ estatus: e.target.value })} style={{ height: 38, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, minWidth: 160 }}>
                                <option value="">Todos los estatus</option>
                                <option value="en_captura">En captura</option>
                                <option value="enviada_validacion">Enviada a validación</option>
                                <option value="observada">Observada</option>
                                <option value="autorizada_generada">Autorizada / Generada</option>
                                <option value="rechazada_cancelada">Rechazada / Cancelada</option>
                            </select>
                            <input type="text" placeholder="Periodo (ID)" value={draft.periodo_id ?? ''} onChange={(e) => setDraft({ periodo_id: e.target.value })} style={{ height: 38, width: 100, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 8px', fontSize: 13 }} />
                            <ActionBtn label={advCount > 0 ? `Más filtros (${advCount})` : 'Más filtros'} onClick={() => setShowAdvanced((v) => !v)} />
                            <ActionBtn label="Aplicar filtros" variant="primary" onClick={aplicarFiltros} />
                            <ActionBtn label="Limpiar" onClick={limpiarFiltros} />
                        </div>
                        {showAdvanced ? (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                                <select value={draft.tipo_documento_id ?? ''} onChange={(e) => setDraft({ tipo_documento_id: e.target.value })} style={{ height: 36, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                                    <option value="">Tipo de documento</option>
                                    {(tipos ?? []).map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
                                </select>
                                <input type="date" value={draft.fecha_desde ?? ''} onChange={(e) => setDraft({ fecha_desde: e.target.value })} style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                                <input type="date" value={draft.fecha_hasta ?? ''} onChange={(e) => setDraft({ fecha_hasta: e.target.value })} style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={draft.solo_mis_solicitudes === '1'} onChange={(e) => setDraft({ solo_mis_solicitudes: e.target.checked ? '1' : '' })} />
                                    Solo mis solicitudes
                                </label>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={draft.con_observaciones === '1'} onChange={(e) => setDraft({ con_observaciones: e.target.checked ? '1' : '' })} />
                                    Con observaciones
                                </label>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={draft.a_punto_de_vencer === '1'} onChange={(e) => setDraft({ a_punto_de_vencer: e.target.checked ? '1' : '' })} />
                                    A punto de vencer
                                </label>
                            </div>
                        ) : null}
                        {chips.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                {chips.map((c) => (
                                    <button key={c.key} type="button" onClick={() => setFilters(c.clear)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1e40af', cursor: 'pointer' }}>
                                        {c.label} ×
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {error ? (
                        <ErrorStateAlert message={error.message} onRetry={() => void recargar()} technicalDetail={esAdminTecnico ? technicalDetail : ''} />
                    ) : (
                        <div style={ceTheme.surface}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Solicitudes y documentos</h2>
                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                    {meta.from && meta.to ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados` : `Total: ${formatCeNum(meta.total ?? 0)}`}
                                </span>
                            </div>

                            {loading && rows.length === 0 ? (
                                <p style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Cargando solicitudes…</p>
                            ) : null}

                            {empty ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>No hay solicitudes documentales en tu alcance</h3>
                                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Inicia una solicitud documental autorizada para un alumno o ajusta los filtros de búsqueda.</p>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <ActionBtn label="Iniciar solicitud documental" variant="primary" disabled={!canDoc('crear')} onClick={() => setModalIniciar(true)} />
                                        <ActionBtn label="Limpiar filtros" onClick={limpiarFiltros} />
                                    </div>
                                </div>
                            ) : null}

                            {!empty && (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                                        <thead>
                                            <tr>
                                                {['Tipo', 'Alumno', 'Matrícula', 'Periodo', 'Estatus', 'Fecha solicitud', 'Último movimiento', 'Acciones'].map((h) => (
                                                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600 }}>{r.tipo_documento ?? r.tipo}</td>
                                                    <td style={{ padding: '10px 8px', fontSize: 12 }}>{r.alumno}</td>
                                                    <td style={{ padding: '10px 8px', fontSize: 12, color: '#64748b' }}>{r.matricula}</td>
                                                    <td style={{ padding: '10px 8px', fontSize: 12 }}>{r.periodo}</td>
                                                    <td style={{ padding: '10px 8px' }}><DocumentoStatusBadge estatus={r.estatus} label={r.estatus_label} /></td>
                                                    <td style={{ padding: '10px 8px', fontSize: 12 }}>{r.fecha_solicitud}</td>
                                                    <td style={{ padding: '10px 8px', fontSize: 11, color: '#64748b' }}>
                                                        <div>{r.ultimo_movimiento?.descripcion ?? '—'}</div>
                                                        <div>{r.ultimo_movimiento?.fecha ?? ''}</div>
                                                    </td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            {canDoc('ver') ? (
                                                                <Link to={r.detalle_url ?? '#'} style={{ fontSize: 12, color: '#185FA5', fontWeight: 600 }}>Ver</Link>
                                                            ) : null}
                                                            {(r.acciones_permitidas ?? []).includes('enviar_validacion') && canDoc('enviar') ? (
                                                                <button type="button" style={{ fontSize: 12, border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer' }} onClick={() => { setDocActivo(r); setModalEnviar(true); }}>Enviar</button>
                                                            ) : null}
                                                            {(r.acciones_permitidas ?? []).includes('atender_observacion') && canDoc('atender') ? (
                                                                <button type="button" style={{ fontSize: 12, border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer' }} onClick={() => { setDocActivo(r); setModalAtender(true); }}>Atender</button>
                                                            ) : null}
                                                            {r.descargable && canDoc('descargar') ? (
                                                                <button type="button" disabled={rowLoading === r.id} style={{ fontSize: 12, border: 'none', background: 'none', color: '#185FA5', cursor: 'pointer' }} onClick={() => void descargarFila(r)}>
                                                                    {rowLoading === r.id ? '…' : 'Descargar'}
                                                                </button>
                                                            ) : null}
                                                            {(r.acciones_permitidas ?? []).includes('cancelar') && canDoc('cancelar') ? (
                                                                <button type="button" style={{ fontSize: 12, border: 'none', background: 'none', color: '#991B1B', cursor: 'pointer' }} onClick={() => { setDocActivo(r); setModalCancelar(true); }}>Cancelar</button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: 12, color: '#64748b' }}>Página {meta.current_page ?? 1} de {meta.last_page ?? 1}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button type="button" disabled={loading || (meta.current_page ?? 1) <= 1} onClick={() => setFilters({ page: String(Math.max(1, (Number(filters.page) || 1) - 1)) }, { resetPage: false })} style={{ minWidth: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>‹</button>
                                    <button type="button" disabled={loading || (meta.current_page ?? 1) >= (meta.last_page ?? 1)} onClick={() => setFilters({ page: String((Number(filters.page) || 1) + 1) }, { resetPage: false })} style={{ minWidth: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}>›</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Acciones rápidas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { label: 'Iniciar solicitud documental', ok: canDoc('crear'), fn: () => setModalIniciar(true) },
                                { label: 'Solicitudes en captura', ok: canDoc('ver'), fn: () => setFilters({ estatus: 'en_captura' }) },
                                { label: 'Pendientes de revisión', ok: canDoc('ver'), fn: () => setFilters({ estatus: 'enviada_validacion' }) },
                                { label: 'Expedientes', ok: canDoc('expedientes'), fn: () => navigate('/app/control-escolar/expedientes') },
                                { label: 'Exportar solicitudes', ok: canDoc('exportar'), fn: () => void exportar() },
                            ].map((a) => (
                                <button key={a.label} type="button" disabled={!a.ok} onClick={a.fn} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 12, fontWeight: 500, color: a.ok ? '#185FA5' : '#94a3b8', cursor: a.ok ? 'pointer' : 'not-allowed' }}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {canDoc('pendientes') ? (
                        <div style={ceTheme.surface}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Pendientes de atención</h3>
                            {[
                                { key: 'enviadas_validacion', label: 'Enviadas a validación', estatus: 'enviada_validacion' },
                                { key: 'observadas', label: 'Observadas', estatus: 'observada' },
                                { key: 'a_punto_de_vencer', label: 'A punto de vencer', estatus: null, extra: { a_punto_de_vencer: '1' } },
                                { key: 'requieren_correccion', label: 'Requieren corrección', estatus: 'observada' },
                            ].map((p) => (
                                <button key={p.key} type="button" onClick={() => setFilters(p.estatus ? { estatus: p.estatus, ...p.extra } : p.extra)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f1f5f9' }}>
                                    <span>{p.label}</span>
                                    <span style={{ fontWeight: 700, color: '#185FA5' }}>{kpi(pendientes?.[p.key])}</span>
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div style={ceTheme.surface}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Próximas fechas importantes</h3>
                        {fechas.length === 0 ? <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Sin fechas configuradas para el ciclo activo.</p> : (
                            fechas.slice(0, 4).map((f) => (
                                <div key={f.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <div style={{ width: 44, textAlign: 'center', background: '#F8FAFC', borderRadius: 8, padding: '6px 0' }}>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{f.dia}</div>
                                        <div style={{ fontSize: 10, textTransform: 'capitalize', color: '#64748b' }}>{f.mes}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{f.titulo}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{f.descripcion}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>

            <IniciarSolicitudDocumentalModal open={modalIniciar} tipos={tipos} onClose={() => setModalIniciar(false)} onSuccess={onSuccess} />
            <EnviarValidacionDocumentoModal open={modalEnviar} documento={docActivo} onClose={() => { setModalEnviar(false); setDocActivo(null); }} onSuccess={onSuccess} />
            <AtenderObservacionDocumentoModal open={modalAtender} documento={docActivo} onClose={() => { setModalAtender(false); setDocActivo(null); }} onSuccess={onSuccess} />
            <CancelarDocumentoModal open={modalCancelar} documento={docActivo} onClose={() => { setModalCancelar(false); setDocActivo(null); }} onSuccess={onSuccess} />
        </div>
    );
}

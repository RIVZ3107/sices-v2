import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeIcons,
    CeMetricCard,
    CePriorityBadge,
    CeQuickAction,
    CeStatusBadge,
    ceAvatarStyle,
    ceColors,
    ceInitials,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';

function formatFecha(iso) {
    if (!iso) return { date: '—', time: '' };
    try {
        const d = new Date(iso);
        return {
            date: new Intl.DateTimeFormat('es-MX', { dateStyle: 'short' }).format(d),
            time: new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(d),
        };
    } catch {
        return { date: '—', time: '' };
    }
}

export function InscripcionesCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.inscripciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar el control de inscripciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const fechas = payload?.fechas_importantes ?? [];
    const reglaMatricula = payload?.regla_matricula ?? '';

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Control de inscripciones</h1>
                    {CeIcons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/expedientes?tab=ingreso', label: 'Nueva inscripción', icon: CeIcons.userPlus, color: '#0F6E56' },
                        { to: '/app/control-escolar/inscripciones', label: 'Validar documentos', icon: CeIcons.scrollText, color: '#534AB7' },
                        { to: '/app/control-escolar/inscripciones', label: 'Confirmar inscripción', icon: CeIcons.check, color: '#0F6E56' },
                        { to: '/app/control-escolar/inscripciones', label: 'Imprimir comprobante', icon: CeIcons.file, color: '#185FA5' },
                        { to: '/app/control-escolar/inscripciones?filtros=1', label: 'Filtros', icon: CeIcons.filter, color: '#64748b' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span style={{ color: '#0f172a' }}>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link
                    to="/app/control-escolar/reportes"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{CeIcons.download}</span> Exportar
                </Link>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            {reglaMatricula ? (
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    <strong style={{ color: ceColors.text }}>Regla de matrícula:</strong> {reglaMatricula}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard icon={CeIcons.file} iconBg="#DBEAFE" iconColor="#185FA5" title="Inscripciones nuevas" value={formatCeNum(metricas.nuevas)} trend={`${formatCeNum(metricas.total_alcance)} en tu alcance`} trendColor="#64748b" />
                <CeMetricCard icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Por validar" value={formatCeNum(metricas.por_validar)} />
                <CeMetricCard icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Confirmadas" value={formatCeNum(metricas.confirmadas)} />
                <CeMetricCard icon={CeIcons.eye} iconBg="#EEEDFE" iconColor="#534AB7" title="Observadas" value={formatCeNum(metricas.observadas)} />
            </div>
                        
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Inscripciones <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Buscar por alumno, folio o programa..."
                                    style={{
                                        height: 36, width: 280,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{ height: 36, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Alumno', 'Programa', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: h === 'Acciones' ? 'center' : 'left',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0',
                                                whiteSpace: 'nowrap',
                                                background: ceColors.pageBg
                                            }}
                                        >
                                            {h !== 'Acciones' ? `${h} ⇅` : h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando inscripciones…
                                        </td>
                                    </tr>
                                ) : !loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay inscripciones en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : rows.map((r, i) => {
                                    const expedienteUrl = r.expediente_url ?? `/app/alumnos/${r.alumno_id}/expediente`;
                                    return (
                                    <tr
                                        key={r.folio ?? r.inscripcion_id ?? i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 500, color: '#64748b' }}>
                                            {r.folio}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div
                                                    style={{
                                                        ...ceAvatarStyle(i),
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                    }}
                                                >
                                                    {ceInitials(r.alumno)}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{formatFecha(r.fecha).date}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{formatFecha(r.fecha).time}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, title: 'Revisar', color: '#185FA5', bg: '#EFF6FF' },
                                                    { icon: CeIcons.scrollText, title: 'Validar', color: '#534AB7', bg: '#F5F3FF' },
                                                    { icon: CeIcons.check, title: 'Confirmar', color: '#0F6E56', bg: '#F0FDF4' },
                                                    { icon: CeIcons.file, title: 'Imprimir', color: '#185FA5', bg: '#F8FAFC' },
                                                    { icon: CeIcons.folder, title: 'Ver expediente', color: '#185FA5', bg: '#EFF6FF' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        title={btn.title}
                                                        style={{ 
                                                            width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, background: btn.bg, cursor: 'pointer', flexShrink: 0 
                                                        }}
                                                    >
                                                        {btn.icon}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados`
                                : 'Sin resultados'}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
                                    opacity: page <= 1 || loading ? 0.5 : 1,
                                }}
                            >
                                «
                            </button>
                            <span style={{ alignSelf: 'center', fontSize: 13, color: '#475569', padding: '0 8px' }}>
                                {meta.current_page ?? page} / {meta.last_page ?? 1}
                            </span>
                            <button
                                type="button"
                                disabled={page >= (meta.last_page ?? 1) || loading}
                                onClick={() => setPage((p) => p + 1)}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                    fontSize: 13, cursor: page >= (meta.last_page ?? 1) || loading ? 'not-allowed' : 'pointer',
                                    opacity: page >= (meta.last_page ?? 1) || loading ? 0.5 : 1,
                                }}
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Pasos del proceso de inscripción</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                            {[
                                { num: 1, color: '#185FA5', title: 'Registro de datos', desc: 'Captura de información del aspirante.', icon: CeIcons.file },
                                { num: 2, color: '#BA7517', title: 'Carga de documentos', desc: 'Subir y revisar documentos requeridos.', icon: CeIcons.file },
                                { num: 3, color: '#534AB7', title: 'Validación', desc: 'Revisión y validación de documentos.', icon: CeIcons.scrollText },
                                { num: 4, color: '#0F6E56', title: 'Confirmación', desc: 'Confirmar la inscripción y generar comprobante.', icon: CeIcons.checkCircle }
                            ].map((step) => (
                                <div key={step.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                                        {step.num}
                                    </div>
                                    <div>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                            <span style={{ color: step.color }}>{step.icon}</span> {step.title}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>
                            Próximas fechas importantes
                            <Link to="/app/calendario" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                {CeIcons.clock} Ver calendario
                            </Link>
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {fechas.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: i < fechas.length - 1 ? 16 : 0, borderBottom: i < fechas.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{f.fecha}</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{f.mes}</span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{f.titulo}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>{f.sub}</p>
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        <CeStatusBadge>{f.badge}</CeStatusBadge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}
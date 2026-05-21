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

export function DocumentosCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.documentos({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar los documentos.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const plantillas = payload?.plantillas_frecuentes ?? [];
    const accesos = payload?.accesos_rapidos ?? [];

    const ACCESO_ICONS = [CeIcons.settings, CeIcons.scrollText, CeIcons.lock];

        const getTipoIcon = (color) => {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        );
    };

    return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Documentos y constancias</h1>
                    {CeIcons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{CeIcons.refreshCw}</span> Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '/app/documentos/nuevo', label: 'Generar constancia', icon: CeIcons.file, color: '#534AB7' },
                        { to: '/app/documentos/bandejas/por-rol', label: 'Historial académico', icon: CeIcons.folder, color: '#185FA5' },
                        { to: '/app/importaciones', label: 'Boleta', icon: CeIcons.file, color: '#0F6E56' },
                        { to: '/app/control-escolar/trayectoria', label: 'Kardex PDF', icon: CeIcons.checkCircle, color: '#BA7517' },
                        { to: '/app/documentos/nuevo', label: 'Subir documento', icon: CeIcons.upload, color: '#185FA5' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>
                <Link
                    to="/app/documentos/bandejas/por-rol"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#0f172a', display: 'flex' }}>{CeIcons.more}</span> Más opciones
                </Link>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard
                    icon={CeIcons.file} iconBg="#EEEDFE" iconColor="#534AB7"
                    title="Documentos generados hoy"
                    value={loading && !payload ? '…' : formatCeNum(metricas.generados_hoy)}
                    trend={metricas.generados_hoy_trend ?? 'Registros del día en tu alcance'}
                    trendColor={metricas.generados_hoy_trend_color ?? '#0F6E56'}
                />
                <CeMetricCard
                    icon={CeIcons.checkCircle} iconBg="#FEF3C7" iconColor="#BA7517"
                    title="Pendientes de revisión"
                    value={loading && !payload ? '…' : formatCeNum(metricas.pendientes_revision)}
                    trend={metricas.pendientes_validacion_trend ?? 'En bandeja institucional'}
                    trendColor={metricas.pendientes_validacion_trend_color ?? '#BA7517'}
                />
                <CeMetricCard
                    icon={CeIcons.upload} iconBg="#DBEAFE" iconColor="#185FA5"
                    title="Consultas públicas activas"
                    value={loading && !payload ? '…' : formatCeNum(metricas.consultas_publicas)}
                    trend="Con token de consulta"
                    trendColor="#185FA5"
                />
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                    <Link
                        to="/app/documentos/bandejas/por-rol"
                        style={{ position: 'absolute', top: 16, right: 16, fontSize: 12, fontWeight: 500, color: ceColors.primary, textDecoration: 'none', zIndex: 1 }}
                    >
                        Ver bandejas
                    </Link>
                    <CeMetricCard
                        icon={CeIcons.file}
                        iconBg="#DCFCE7"
                        iconColor="#0F6E56"
                        title="Plantillas disponibles"
                        value={loading && !payload ? '…' : formatCeNum(metricas.plantillas_disponibles)}
                        trend="Catálogo operativo"
                        trendColor="#94a3b8"
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            <span style={{ color: '#64748b' }}>{CeIcons.scrollText}</span> Documentos emitidos
                        </h2>
                        
                        <input
                            type="search"
                            placeholder="Buscar documento o alumno…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                height: 32, width: 220, padding: '0 10px',
                                border: '1px solid #e2e8f0', borderRadius: 8,
                                fontSize: 12, color: '#0f172a', background: 'white',
                            }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Tipo', 'Alumno', 'Fecha', 'Estatus', 'Descarga', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: (h === 'Descarga' || h === 'Acciones') ? 'center' : 'left',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0',
                                                whiteSpace: 'nowrap',
                                                background: ceColors.pageBg
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando documentos…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay documentos en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r, i) => (
                                    <tr
                                        key={r.id ?? i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <div style={{ marginTop: 2 }}>{getTipoIcon(r.color_tipo ?? r.colorTipo)}</div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.tipo || r.nombre}</p>
                                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.sub_tipo ?? r.subTipo ?? 'Documento'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula || r.id}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora || '00:00 a. m.'}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            {(r.descarga_disponible || r.descargable) ? (
                                                <Link to={r.detalle_url ?? '#'} style={{ display: 'inline-flex', color: '#185FA5', textDecoration: 'none' }}>
                                                    {CeIcons.download}
                                                </Link>
                                            ) : (
                                                <span style={{ color: '#cbd5e1' }}>{CeIcons.download}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.download, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.send, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.xIcon, color: '#991B1B', bg: '#FEE2E2', border: '#FEE2E2' }
                                                ].map((btn, idx) => (
                                                    <Link
                                                        key={idx}
                                                        to={idx === 0 || idx === 1 ? (r.detalle_url ?? '#') : '#'}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: 6,
                                                            background: btn.bg, border: `1px solid ${btn.border}`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: btn.color, cursor: 'pointer', textDecoration: 'none',
                                                        }}
                                                    >
                                                        {btn.icon}
                                                    </Link>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados`
                                : `Total: ${formatCeNum(meta.total ?? 0)} resultados`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    disabled={page <= 1 || loading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    style={{
                                        minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                        border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                        fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
                                    }}
                                >
                                    &lt;
                                </button>
                                <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#185FA5', color: 'white', fontSize: 13, padding: '0 8px' }}>
                                    {meta.current_page ?? page}
                                </span>
                                <button
                                    type="button"
                                    disabled={loading || (meta.last_page ?? 1) <= page}
                                    onClick={() => setPage((p) => p + 1)}
                                    style={{
                                        minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                        border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                                        fontSize: 13, cursor: (meta.last_page ?? 1) <= page ? 'not-allowed' : 'pointer', opacity: (meta.last_page ?? 1) <= page ? 0.5 : 1,
                                    }}
                                >
                                    &gt;
                                </button>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                {perPage} por página
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Paneles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Plantillas y accesos rápidos */}
                    <div style={ceTheme.surface}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Plantillas y accesos rápidos</p>
                            <Link to="/app/documentos/bandejas/por-rol" style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todas</Link>
                        </div>
                        
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, margin: 0 }}>Plantillas frecuentes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, marginBottom: 20 }}>
                            {plantillas.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ color: '#534AB7', display: 'flex' }}>
                                            {CeIcons.file}
                                        </div>
                                        <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{p.nombre}</p>
                                    </div>
                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{p.versiones}</span>
                                </div>
                            ))}
                        </div>

                        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, margin: 0 }}>Accesos rápidos</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                            {accesos.map((a, i) => (
                                <Link key={i} to={a.ruta ?? '#'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', paddingBottom: 10, borderBottom: i < accesos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ display: 'flex', color: '#185FA5' }}>{ACCESO_ICONS[i % ACCESO_ICONS.length]}</span>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: '#185FA5' }}>{a.nombre}</span>
                                    </div>
                                    <span style={{ color: '#94a3b8', fontSize: 14 }}>›</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ¿Necesitas ayuda? */}
                    <div style={ceTheme.surface}>
                        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>
                            <span style={{ color: '#185FA5' }}>{CeIcons.infoCircle}</span> ¿Necesitas ayuda?
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                            Consulta la guía de documentos o contacta al soporte.
                        </p>
                        <Link
                            to="#"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 36, padding: '0 16px', borderRadius: 8,
                                background: 'white', border: '1px solid #185FA5',
                                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#185FA5'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{CeIcons.scrollText}</span> Ir a la guía
                        </Link>
                    </div>

                </div>
            </div>

         
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}
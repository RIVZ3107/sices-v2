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

export function SolicitudesCePage() {
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
            const res = await controlEscolarApi.solicitudes({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las solicitudes.');
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
    const tipos = payload?.tipos_solicitud ?? [];
    const comentarios = payload?.comentarios_recientes ?? [];
    const lastPage = Math.max(1, Number(meta.last_page) || 1);

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Solicitudes y trámites</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Administra y da seguimiento a las solicitudes y trámites de los alumnos.
                    </p>
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
                        { to: '/app/solicitudes-matricula', label: 'Nueva solicitud', icon: CeIcons.plus, color: '#185FA5' },
                        { to: '/app/control-escolar/documentos', label: 'Revisar', icon: CeIcons.eye, color: '#185FA5' },
                        { to: '/app/solicitudes-matricula', label: 'Enviar', icon: CeIcons.check, color: '#0F6E56' },
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
                    to="/app/control-escolar/solicitudes?filtros=1"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{CeIcons.filter}</span> Filtros
                </Link>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard 
                    icon={CeIcons.file} iconBg="#DBEAFE" iconColor="#185FA5" 
                    title="Pendientes" value={formatCeNum(metricas.pendientes)}
                    trend={metricas.pendientes_trend ?? '—'}
                    trendColor={metricas.pendientes_trend_color ?? '#64748b'}
                />
                <CeMetricCard 
                    icon={CeIcons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Urgentes" value={formatCeNum(metricas.urgentes)}
                    trend={metricas.urgentes_trend ?? '—'}
                    trendColor={metricas.urgentes_trend_color ?? '#991B1B'}
                />
                <CeMetricCard 
                    icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="En revisión" value={formatCeNum(metricas.en_revision)}
                    trend={metricas.en_revision_trend ?? '—'}
                    trendColor={metricas.en_revision_trend_color ?? '#BA7517'}
                />
                <CeMetricCard 
                    icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" 
                    title="Resueltas" value={formatCeNum(metricas.resueltas)}
                    trend={metricas.resueltas_trend ?? '—'}
                    trendColor={metricas.resueltas_trend_color ?? '#0F6E56'}
                />
            </div>

            <div style={{ padding: '12px 16px', background: '#F8FAFC', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', marginBottom: 24 }}>
                Desde aquí se canalizan trámites de constancias, cambios y revisiones. Use la bandeja de <Link to="/app/solicitudes-matricula" style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>solicitudes de matrícula</Link> para el flujo específico hacia Educación Superior.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                                Todas las solicitudes <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                            </h2>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                {meta.from && meta.to
                                    ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} solicitudes`
                                    : `Total: ${formatCeNum(meta.total ?? 0)} solicitudes`}
                            </p>
                        </div>
                        
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                {CeIcons.search}
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar en la tabla..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    height: 36, width: 250,
                                    paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, color: '#0f172a', background: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: ceColors.pageBg, width: 40 }}>
                                        <input type="checkbox" style={{ borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                    </th>
                                    {['Folio', 'Tipo', 'Alumno', 'Prioridad', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 10px',
                                                textAlign: h === 'Acciones' ? 'center' : 'left',
                                                fontSize: 11,
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
                                        <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando solicitudes…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay solicitudes registradas en tu alcance.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr
                                        key={r.clave ?? r.folio}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                                            <input type="checkbox" style={{ borderRadius: 4, border: '1px solid #cbd5e1' }} />
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                                            <Link to={r.detalle_url ?? '#'} style={{ color: '#185FA5', textDecoration: 'none' }}>{r.folio}</Link>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.tipo}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.id}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.prioridad}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.hora}</p>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.users, color: '#185FA5', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.check, color: '#0F6E56', bg: 'white', border: '#e2e8f0' },
                                                    { icon: CeIcons.xIcon, color: '#991B1B', bg: '#FEE2E2', border: '#FEE2E2' },
                                                    { icon: CeIcons.messageCircle, color: '#185FA5', bg: 'white', border: '#e2e8f0' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{ 
                                                            width: 26, height: 26, borderRadius: 6, 
                                                            background: btn.bg, border: `1px solid ${btn.border}`, 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                            color: btn.color, cursor: 'pointer', flexShrink: 0
                                                        }}
                                                    >
                                                        {btn.icon}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white',
                                    color: '#475569', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                    opacity: page <= 1 ? 0.5 : 1,
                                }}
                            >
                                &lt;
                            </button>
                            <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#185FA5', color: 'white', fontSize: 13, padding: '0 8px' }}>
                                {page}
                            </span>
                            <button
                                type="button"
                                disabled={page >= lastPage || loading}
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                style={{
                                    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                    border: '1px solid #e2e8f0', background: 'white',
                                    color: '#475569', fontSize: 13, cursor: page >= lastPage ? 'not-allowed' : 'pointer',
                                    opacity: page >= lastPage ? 0.5 : 1,
                                }}
                            >
                                &gt;
                            </button>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            Página {page} de {lastPage}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Tipos de solicitud</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                            {tipos.length === 0 ? (
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Sin datos por categoría.</p>
                            ) : null}
                            {tipos.map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: i < tipos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <span style={{ fontSize: 13, color: '#475569' }}>{t.tipo}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', background: '#DBEAFE', padding: '2px 8px', borderRadius: 6 }}>{t.n}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="#" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los tipos ›
                        </Link>
                    </div>

                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Comentarios recientes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {comentarios.length === 0 ? (
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Sin comentarios recientes.</p>
                            ) : null}
                            {comentarios.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, borderBottom: i < comentarios.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div
                                        style={{
                                            ...ceAvatarStyle(i + 3), // offset color
                                            width: 32, height: 32, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        }}
                                    >
                                        {ceInitials(c.autor)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                                {c.autor} <span style={{ fontWeight: 400, color: '#64748b' }}>({c.rol})</span>
                                            </p>
                                            <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: 8 }}>{c.tiempo}</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: '#475569', margin: '4px 0', lineHeight: 1.4 }}>
                                            {c.texto}
                                        </p>
                                        <Link to={c.url ?? '#'} style={{ fontSize: 11, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                            Ver solicitud {c.folio}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="#" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los comentarios ›
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
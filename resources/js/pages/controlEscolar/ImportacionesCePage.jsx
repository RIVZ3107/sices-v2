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

export function ImportacionesCePage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.importaciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las importaciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page]);

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
    const errores = payload?.errores_frecuentes ?? [];
    const total = Number(meta.total) || 0;
    const lastPage = Math.max(1, Number(meta.last_page) || 1);
    const from = meta.from ?? (total === 0 ? 0 : 1);
    const to = meta.to ?? rows.length;

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Importaciones académicas</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Calificaciones, kardex y altas masivas. Sin confirmación con errores críticos abiertos.
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
                        { to: '/app/importaciones', label: 'Nueva importación', icon: CeIcons.plus, color: '#185FA5' },
                        { to: '/app/importaciones', label: 'Subir archivo', icon: CeIcons.upload, color: '#0F6E56' },
                        { to: '/app/importaciones', label: 'Prevalidar', icon: CeIcons.check, color: '#BA7517' },
                        { to: '/app/importaciones', label: 'Conciliar', icon: CeIcons.refreshCw, color: '#534AB7' },
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
                    to="/app/importaciones"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 8,
                        background: 'white', border: '1px solid #e2e8f0',
                        fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                    }}
                >
                    <span style={{ color: '#991B1B', display: 'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </span>
                    Ver errores
                </Link>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard
                    icon={CeIcons.folder} iconBg="#DBEAFE" iconColor="#185FA5"
                    title="Importaciones recientes" value={formatCeNum(metricas.recientes)}
                    trend={metricas.recientes_trend ?? 'Últimos 30 días'} trendColor={metricas.recientes_trend_color ?? '#185FA5'}
                />
                <CeMetricCard
                    icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56"
                    title="Prevalidadas" value={formatCeNum(metricas.prevalidadas)}
                    trend={metricas.prevalidadas_trend ?? 'Listas para conciliar'} trendColor={metricas.prevalidadas_trend_color ?? '#0F6E56'}
                />
                <CeMetricCard
                    icon={CeIcons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B"
                    title="Con errores" value={formatCeNum(metricas.con_errores)}
                    trend={metricas.con_errores_trend ?? 'Requieren corrección'} trendColor={metricas.con_errores_trend_color ?? '#991B1B'}
                />
                <CeMetricCard
                    icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517"
                    title="Pendientes" value={formatCeNum(metricas.pendientes)}
                    trend={metricas.pendientes_trend ?? 'En cola operativa'} trendColor={metricas.pendientes_trend_color ?? '#BA7517'}
                />
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                    No se permite <strong style={{ fontWeight: 600 }}>confirmar</strong> una importación mientras existan <strong style={{ fontWeight: 600 }}>errores críticos</strong> sin corregir.
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Historial de importaciones <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar archivo o folio..."
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
                            <button type="button" style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer' }}>
                                <span style={{ display: 'flex', alignItems: 'center', color: '#185FA5' }}>{CeIcons.filter}</span> Filtros
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Archivo / Origen', 'Alumno / Programa', 'Registros', 'Errores', 'Estado', 'Acciones'].map((h) => (
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
                                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando importaciones…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay importaciones para mostrar.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                                            <Link to={r.detalle_url ?? '/app/importaciones'} style={{ color: '#185FA5', textDecoration: 'none' }}>{r.folio}</Link>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.archivo}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.alumno}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{formatCeNum(r.registros)}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, fontWeight: r.errores > 0 ? 700 : 500, color: r.errores > 0 ? '#991B1B' : '#64748b' }}>
                                            {formatCeNum(r.errores)}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estado}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                <Link
                                                    to={r.detalle_url ?? '/app/importaciones'}
                                                    title="Ver detalle"
                                                    style={{
                                                        width: 26, height: 26, borderRadius: 6,
                                                        background: 'white', border: '1px solid #e2e8f0',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#185FA5', flexShrink: 0,
                                                    }}
                                                >
                                                    {CeIcons.eye}
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {total === 0 ? 'Sin importaciones' : `Mostrando ${from} a ${to} de ${formatCeNum(total)} importaciones`}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                            >
                                &lt;
                            </button>
                            <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600 }}>
                                {page}
                            </span>
                            <button
                                type="button"
                                disabled={page >= lastPage}
                                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, cursor: page >= lastPage ? 'not-allowed' : 'pointer', opacity: page >= lastPage ? 0.5 : 1 }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Errores frecuentes</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                            {errores.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sin errores registrados en el alcance.</p>
                            ) : (
                                errores.map((e) => (
                                    <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: 13, color: '#475569' }}>{e.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>{formatCeNum(e.n)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link to="/app/importaciones" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', textAlign: 'center', width: '100%' }}>
                            Ver todos los errores ›
                        </Link>
                    </div>

                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Flujo de importación</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                            {[
                                { num: 1, color: '#185FA5', title: 'Carga de archivo', desc: 'Selección de plantilla y subida.' },
                                { num: 2, color: '#BA7517', title: 'Prevalidación', desc: 'Sintáctica y de catálogos.' },
                                { num: 3, color: '#534AB7', title: 'Conciliación', desc: 'Cruce con expedientes y trayectoria.' },
                                { num: 4, color: '#0F6E56', title: 'Confirmación', desc: 'Bloqueada si hay errores críticos.' }
                            ].map((step) => (
                                <div key={step.num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: step.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>
                                        {step.num}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{step.title}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeErrorBanner,
    CeIcons,
    CeMetricsStrip,
    CePageHeader,
    CeStatusBadge,
    CeToolbarLinks,
    ceColors,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';

const TYPE_ICONS = {
    lock: CeIcons.lock,
    boxX: CeIcons.boxX,
    users: CeIcons.users,
    clock: CeIcons.clock,
    graduationCap: CeIcons.graduationCap,
};

export function BajasCambiosPage() {
    const [search, setSearch] = useState('');
    const [estatusFiltro, setEstatusFiltro] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.bajasCambios({
                search: search.trim() || undefined,
                estatus: estatusFiltro || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las bajas y cambios.');
        } finally {
            setLoading(false);
        }
    }, [search, estatusFiltro, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search, estatusFiltro]);

    const metricas = payload?.metricas ?? {};
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const motivosDonut = payload?.motivos_frecuentes ?? [];
    const cambiosRecientes = payload?.cambios_recientes ?? [];
    const grad = motivosDonut.length > 0
        ? `conic-gradient(${motivosDonut.map((m, i, arr) => {
            const start = (arr.slice(0, i).reduce((s, x) => s + x.pct, 0) / 100) * 360;
            const end = (arr.slice(0, i + 1).reduce((s, x) => s + x.pct, 0) / 100) * 360;
            return `${m.color} ${start}deg ${end}deg`;
        }).join(', ')})`
        : 'conic-gradient(#e2e8f0 0deg 360deg)';

    const toolbarActions = [
        { label: 'Nueva baja', icon: CeIcons.plus, color: ceColors.primary },
        { label: 'Cambio de grupo', icon: CeIcons.users, color: ceColors.primary },
        { label: 'Cambio de turno', icon: CeIcons.clock, color: ceColors.success },
        { label: 'Cambio de programa', icon: CeIcons.graduationCap, color: ceColors.purple },
        { label: 'Aprobar', icon: CeIcons.check, color: ceColors.success },
        { label: 'Rechazar', icon: CeIcons.xIcon, color: ceColors.danger },
    ];

    return (
        <div style={ceTheme.pageShell}>
            <CePageHeader
                title="Bajas y cambios de estatus"
                updatedAt={loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
            />

            <CeToolbarLinks
                actions={toolbarActions}
                trailing={(
                    <Link to="#" style={ceTheme.toolbarAction}>
                        <span style={{ color: ceColors.muted, display: 'flex' }}>{CeIcons.download}</span>
                        Exportar v
                    </Link>
                )}
            />

            {error ? <CeErrorBanner>{error}</CeErrorBanner> : null}

            <CeMetricsStrip
                metrics={[
                    {
                        key: 'bajas_temp',
                        icon: CeIcons.lock,
                        iconBg: '#FEE2E2',
                        iconColor: '#DC2626',
                        title: 'Bajas temporales',
                        value: loading && !payload ? '…' : formatCeNum(metricas.bajas_temporales),
                        trend: 'En tu alcance operativo',
                        trendColor: ceColors.muted,
                    },
                    {
                        key: 'bajas_def',
                        icon: CeIcons.boxX,
                        iconBg: '#F3E8FF',
                        iconColor: '#6B21A8',
                        title: 'Bajas definitivas',
                        value: loading && !payload ? '…' : formatCeNum(metricas.bajas_definitivas),
                        trend: 'Registros consolidados',
                        trendColor: ceColors.muted,
                    },
                    {
                        key: 'cambios',
                        icon: CeIcons.users,
                        iconBg: '#DBEAFE',
                        iconColor: ceColors.primary,
                        title: 'Cambios pendientes',
                        value: loading && !payload ? '…' : formatCeNum(metricas.cambios_pendientes),
                        trend: 'Pendientes o en revisión',
                        trendColor: ceColors.warn,
                    },
                    {
                        key: 'observadas',
                        icon: CeIcons.alertTriangle,
                        iconBg: '#FFEDD5',
                        iconColor: '#EA580C',
                        title: 'Solicitudes observadas',
                        value: loading && !payload ? '…' : formatCeNum(metricas.solicitudes_observadas),
                        trend: 'Requieren atención',
                        trendColor: ceColors.danger,
                    },
                ]}
            />

            <div style={ceTheme.splitLayout340}>
                <div style={ceTheme.surface}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: ceColors.text, margin: 0 }}>
                            Solicitudes de bajas y cambios {CeIcons.infoCircle}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <select
                                value={estatusFiltro}
                                onChange={(e) => setEstatusFiltro(e.target.value)}
                                style={ceTheme.selectFilter}
                            >
                                <option value="">Todos los estatus</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En revisión">En revisión</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Observada">Observada</option>
                                <option value="Rechazada">Rechazada</option>
                            </select>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar en la tabla..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        ...ceTheme.inputSearch,
                                        height: 36,
                                        width: 220,
                                        paddingLeft: 34,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Alumno', 'Tipo de cambio', 'Motivo', 'Fecha', 'Estatus', 'Acciones'].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                ...ceTheme.thCompact,
                                                fontSize: 11,
                                                textAlign: h === 'Acciones' ? 'center' : 'left',
                                                whiteSpace: 'nowrap',
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
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: ceColors.muted, fontSize: 13 }}>
                                            Cargando solicitudes…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: ceColors.muted, fontSize: 13 }}>
                                            No hay bajas o cambios registrados en tu alcance.
                                        </td>
                                    </tr>
                                ) : null}
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        style={ceTheme.tr}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = ceColors.rowHover; }}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={ceTheme.tdCompact}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: ceColors.text, margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: ceColors.muted, margin: '2px 0 0 0' }}>{r.matricula}</p>
                                        </td>
                                        <td style={ceTheme.tdCompact}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#475569' }}>
                                                <span style={{ color: r.type_color ?? r.typeColor }}>
                                                    {TYPE_ICONS[r.type_key] ?? CeIcons.lock}
                                                </span>
                                                {r.tipo}
                                            </div>
                                        </td>
                                        <td style={{ ...ceTheme.tdCompact, color: '#475569' }}>{r.motivo}</td>
                                        <td style={ceTheme.tdCompact}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{r.fecha}</p>
                                            <p style={{ fontSize: 11, color: ceColors.mutedLight, margin: '2px 0 0 0' }}>{r.hora}</p>
                                        </td>
                                        <td style={ceTheme.tdCompact}>
                                            <CeStatusBadge tone={r.tone}>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={ceTheme.tdCompact}>
                                            <div style={{ ...ceTheme.rowActions, justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, color: ceColors.primary },
                                                    { icon: CeIcons.check, color: ceColors.success },
                                                    { icon: CeIcons.xIcon, color: ceColors.danger },
                                                    { icon: CeIcons.pencil, color: ceColors.primary },
                                                    { icon: CeIcons.history, color: ceColors.primary },
                                                ].map((btn, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            ...ceTheme.iconBtn,
                                                            width: 26,
                                                            height: 26,
                                                            borderRadius: 6,
                                                            color: btn.color,
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

                    <div style={{ ...ceTheme.cardFooterBetween, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${ceColors.rowBorder}` }}>
                        <span>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} resultados`
                                : `Total: ${formatCeNum(meta.total ?? 0)} resultados`}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{
                                    ...ceTheme.btnSm,
                                    minWidth: 32,
                                    height: 32,
                                    opacity: page <= 1 ? 0.5 : 1,
                                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                &lt;
                            </button>
                            <span style={{ minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: ceColors.primary, color: 'white', fontSize: 13, padding: '0 8px' }}>
                                {meta.current_page ?? page}
                            </span>
                            <button
                                type="button"
                                disabled={loading || (meta.last_page ?? 1) <= page}
                                onClick={() => setPage((p) => p + 1)}
                                style={{
                                    ...ceTheme.btnSm,
                                    minWidth: 32,
                                    height: 32,
                                    opacity: (meta.last_page ?? 1) <= page ? 0.5 : 1,
                                    cursor: (meta.last_page ?? 1) <= page ? 'not-allowed' : 'pointer',
                                }}
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>

                <div style={ceTheme.sidebarStackSm}>
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Motivos frecuentes</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                            <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'white' }} />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                {motivosDonut.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                                            <span style={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{m.label}</span>
                                        </div>
                                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{m.pct}% <span style={{ color: '#94a3b8', fontWeight: 400 }}>({m.count})</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={ceTheme.surface}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: ceColors.text, margin: 0 }}>Cambios recientes</p>
                            <Link to="#" style={{ fontSize: 11, fontWeight: 500, color: ceColors.primary, textDecoration: 'none' }}>Ver todos</Link>
                        </div>

                        <div style={{ position: 'relative', paddingLeft: 10 }}>
                            <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {cambiosRecientes.map((c, i) => (
                                    <div key={i} style={{ position: 'relative', paddingLeft: 24 }}>
                                        <div style={{ position: 'absolute', left: 1, top: 4, width: 8, height: 8, borderRadius: '50%', background: c.color, border: '2px solid white' }} />
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 2px 0' }}>{c.text}</p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>{c.subtext}</p>
                                        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{c.date}</p>
                                    </div>
                       
                       ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

          
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: ceColors.mutedLight }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}
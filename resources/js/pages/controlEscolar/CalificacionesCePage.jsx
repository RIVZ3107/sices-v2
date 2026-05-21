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

export function CalificacionesCePage() {
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
            const res = await controlEscolarApi.calificaciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar las calificaciones.');
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
    const grupos = payload?.grupos ?? [];
    const calificaciones = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const avanceGlobal = payload?.avance_global?.porcentaje ?? metricas.avance_global_pct ?? 0;
    const avanceDescripcion = payload?.avance_global?.descripcion ?? '';

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Calificaciones</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Captura e importación operativa. La autorización final de correcciones y el cierre global no corresponden a Control Escolar.
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
                        { to: '/app/coordinador/dashboard', label: 'Capturar calificación', icon: CeIcons.pencil, color: '#185FA5' },
                        { to: '/app/importaciones', label: 'Importar calificaciones', icon: CeIcons.upload, color: '#0F6E56' },
                        { to: '/app/control-escolar/calificaciones', label: 'Solicitar corrección', icon: CeIcons.cornerUpLeft, color: '#BA7517' },
                        { to: '/app/control-escolar/calificaciones', label: 'Ver historial', icon: CeIcons.history, color: '#534AB7' },
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
                <p style={{ marginBottom: 16, padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard icon={CeIcons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Grupos en captura" value={loading && !payload ? '…' : formatCeNum(metricas.grupos_en_captura)} trend={metricas.ciclo_label ?? 'Ciclo activo'} trendColor="#185FA5" />
                <CeMetricCard icon={CeIcons.trendingUp} iconBg="#DCFCE7" iconColor="#0F6E56" title="Avance global" value={loading && !payload ? '…' : `${avanceGlobal}%`} trend="Captura en alcance operativo" trendColor="#0F6E56" />
                <CeMetricCard icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Pendientes de captura" value={loading && !payload ? '…' : formatCeNum(metricas.pendientes_captura)} trend="Por cerrar periodo" trendColor="#BA7517" />
                <CeMetricCard icon={CeIcons.messageCircle} iconBg="#EEEDFE" iconColor="#534AB7" title="Correcciones solicitadas" value={loading && !payload ? '…' : formatCeNum(metricas.correcciones_solicitadas)} trend="En flujo con Dirección" trendColor="#534AB7" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
                
                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Avance de captura</p>
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Progreso global</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>{avanceGlobal}%</span>
                        </div>
                        <div style={{ height: 8, width: '100%', background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, avanceGlobal))}%`, background: '#0F6E56', borderRadius: 4 }} />
                        </div>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.4 }}>
                            {avanceDescripcion || `${avanceGlobal}% de las calificaciones han sido capturadas en el alcance operativo.`}
                        </p>
                    </div>
                </div>

                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Estado por Grupos / Materias</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        {grupos.length === 0 && !loading ? (
                            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sin grupos con carga académica en tu alcance.</p>
                        ) : null}
                        {grupos.map((g, index) => (
                            <div key={`${g.grupo}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: index < grupos.length - 1 ? 12 : 0, borderBottom: index < grupos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{g.grupo}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{g.sede}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: (g.avance_pct ?? g.avancePct) === 100 ? '#0F6E56' : '#185FA5', margin: 0 }}>
                                        {g.avance_pct ?? g.avancePct ?? 0}% capturado
                                    </p>
                                    <p style={{ fontSize: 11, color: g.pendientes > 0 ? '#BA7517' : '#64748b', margin: '2px 0 0 0' }}>
                                        {g.pendientes} pendientes
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
                
                <div style={ceTheme.surface}>
                    <p style={ceTheme.surfaceTitle}>Acciones rápidas</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <Link to="/app/importaciones" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Abrir importación académica
                        </Link>
                        <Link to="/app/observaciones" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Ver observaciones de captura
                        </Link>
                        <Link to="/app/expedientes" style={{ fontSize: 13, fontWeight: 500, color: '#185FA5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#94a3b8' }}>›</span> Abrir expediente 360
                        </Link>
                    </div>
                </div>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Calificaciones del grupo seleccionado
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar alumno..."
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
                            <button style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer' }}>
                                <span style={{ display: 'flex', alignItems: 'center', color: '#185FA5' }}>{CeIcons.filter}</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Alumno', 'Matrícula', 'Materia', 'Calificación', 'Estatus', 'Acciones'].map((h) => (
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
                                {loading && calificaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            Cargando calificaciones…
                                        </td>
                                    </tr>
                                ) : null}
                                {!loading && calificaciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay calificaciones en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : null}
                                {calificaciones.map((r, i) => (
                                    <tr
                                        key={r.matricula + r.materia}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
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
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{r.matricula}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.materia}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 14, fontWeight: 700, color: r.calif === '—' || r.calif === '-' ? '#94a3b8' : '#0f172a' }}>
                                            {r.calif}
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                <div title="Ver detalles" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', background: '#EFF6FF', cursor: 'pointer', flexShrink: 0 }}>
                                                    {CeIcons.eye}
                                                </div>
                                                <div title="Editar calificación" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5', background: '#F8FAFC', cursor: 'pointer', flexShrink: 0 }}>
                                                    {CeIcons.pencil}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} registros`
                                : `Total: ${formatCeNum(meta.total ?? 0)} registros`}
                        </span>
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
                    </div>
                </div>

            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}
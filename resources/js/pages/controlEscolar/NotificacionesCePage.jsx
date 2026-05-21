import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import { getUser } from '../../authStore';
import { DireccionNotificacionesPage } from '../direccion/DireccionNotificacionesPage';
import {
    CeIcons,
    CeMetricCard,
    CePriorityBadge,
    ceColors,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';

const TIPO_ICON_COLORS = {
    alert_triangle: '#991B1B',
    file_text: '#534AB7',
    clock: '#BA7517',
    info: '#185FA5',
    settings: '#64748b',
    check_circle: '#0F6E56',
};

function iconoPorTipo(tipo) {
    const map = {
        alert_triangle: CeIcons.alertTriangle,
        file_text: CeIcons.file,
        clock: CeIcons.clock,
        info: CeIcons.infoCircle,
        settings: CeIcons.settings,
        check_circle: CeIcons.checkCircle,
    };
    return map[tipo] ?? CeIcons.infoCircle;
}

function iconoCategoria(label) {
    const l = String(label).toLowerCase();
    if (l.includes('document')) return CeIcons.file;
    if (l.includes('inscrip')) return CeIcons.clock;
    if (l.includes('reinscrip')) return CeIcons.refreshCw;
    if (l.includes('solicitud')) return CeIcons.alertTriangle;
    if (l.includes('sistema')) return CeIcons.zap;
    return CeIcons.file;
}

export function NotificacionesCePage() {
    const roles = getUser()?.roles ?? [];
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [categoria, setCategoria] = useState('todas');
    const [selectedId, setSelectedId] = useState(null);
    const perPage = 8;

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await controlEscolarApi.notificaciones({
                search: search.trim() || undefined,
                categoria: categoria !== 'todas' ? categoria : undefined,
                page,
                per_page: perPage,
                notificacion_id: selectedId ?? undefined,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudieron cargar las notificaciones.');
        } finally {
            setLoading(false);
        }
    }, [search, page, categoria, selectedId]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    useEffect(() => {
        setPage(1);
    }, [search, categoria]);

    if (!roles.includes('control_escolar_escuela') && roles.includes('director_escuela')) {
        return <DireccionNotificacionesPage />;
    }

    const metricas = payload?.metricas ?? {};
    const categorias = payload?.categorias ?? [];
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};
    const detalle = payload?.detalle ?? null;
    const total = Number(meta.total) || 0;
    const lastPage = Math.max(1, Number(meta.last_page) || 1);
    const from = meta.from ?? (total === 0 ? 0 : 1);
    const to = meta.to ?? rows.length;

    return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Centro de notificaciones</h1>
                        <span style={{ color: '#185FA5' }}>{CeIcons.bell}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{CeIcons.clock}</span>
                        Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                        <button
                            type="button"
                            onClick={() => void cargar()}
                            style={{ marginLeft: 8, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, display: 'flex' }}
                            aria-label="Actualizar"
                        >
                            {CeIcons.refreshCw}
                        </button>
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { to: '#', label: 'Marcar todas leídas', icon: CeIcons.check, color: '#0f172a' },
                        { to: '#', label: 'Filtrar', icon: CeIcons.filter, color: '#0f172a' },
                        { to: '#', label: 'Preferencias de notificación', icon: CeIcons.settings, color: '#0f172a' },
                    ].map(({ to, label, icon, color }) => (
                        <Link
                            key={label}
                            to={to}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                height: 38, padding: '0 16px', borderRadius: 8,
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                fontSize: 13, fontWeight: 600, textDecoration: 'none', color: color
                            }}
                        >
                            <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    ))}
                    <Link
                        to="#"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            height: 38, padding: '0 16px', borderRadius: 8,
                            background: 'white', border: '1px solid #e2e8f0',
                            fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#0f172a'
                        }}
                    >
                        <span style={{ color: '#185FA5', display: 'flex' }}>{CeIcons.download}</span> Exportar
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard 
                    icon={CeIcons.bell} iconBg="#185FA5" iconColor="white" 
                    title="No leídas" value={formatCeNum(metricas.no_leidas)}
                    trend={metricas.no_leidas_trend ?? '—'} 
                />
                <CeMetricCard 
                    icon={CeIcons.alertTriangle} iconBg="#FEE2E2" iconColor="#991B1B" 
                    title="Críticas" value={formatCeNum(metricas.criticas)}
                    trend={metricas.criticas_trend ?? 'requieren atención'} 
                />
                <CeMetricCard 
                    icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" 
                    title="Recordatorios" value={formatCeNum(metricas.recordatorios)}
                    trend={metricas.recordatorios_trend ?? 'pendientes de seguimiento'} 
                />
                <CeMetricCard 
                    icon={CeIcons.zap} iconBg="#534AB7" iconColor="white" 
                    title="Automáticas" value={formatCeNum(metricas.automaticas)}
                    trend={metricas.automaticas_trend ?? 'generadas por el sistema'} 
                />
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991B1B', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 320px', gap: 16, alignItems: 'start' }}>

                <div style={{ ...ceTheme.surface, padding: '16px 0' }}>
                    <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ color: '#64748b' }}>{CeIcons.filter}</span>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Categor├¡as</h2>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {categorias.map((cat) => {
                            const active = categoria === (cat.key ?? 'todas');
                            const icon = iconoCategoria(cat.label);
                            return (
                            <li key={cat.key ?? cat.label} style={{ padding: '4px 12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setCategoria(cat.key ?? 'todas')}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: 8,
                                        background: active ? '#EFF6FF' : 'transparent',
                                        color: active ? '#185FA5' : '#475569',
                                        fontWeight: active ? 600 : 500,
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: active ? '#185FA5' : '#94a3b8' }}>{icon}</span>
                                        <span style={{ fontSize: 13 }}>{cat.label}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#185FA5' : '#64748b' }}>{formatCeNum(cat.n)}</span>
                                </button>
                            </li>
                            );
                        })}
                    </ul>

                </div>
                <div style={{ ...ceTheme.surface, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Notificaciones ({formatCeNum(total)})
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                                {CeIcons.search}
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar notificación..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    height: 36, width: 220, paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Tipo', 'Mensaje', 'Usuario/Alumno relacionado', 'Fecha Ôçà', 'Prioridad', 'Estatus', ''].map((h, i) => (
                                        <th
                                            key={i}
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: h === '' ? 'center' : 'left',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0',
                                                whiteSpace: 'nowrap',
                                                background: '#f8fafc'
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((n) => {
                                    const selected = selectedId === n.id || (!selectedId && detalle?.id === n.id);
                                    const color = TIPO_ICON_COLORS[n.tipo] ?? '#185FA5';
                                    return (
                                    <tr
                                        key={n.id}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer', background: selected ? '#f8fafc' : 'white' }}
                                        onClick={() => setSelectedId(n.id)}
                                    >
                                        <td style={{ padding: '16px', width: 40, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {!n.leida ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0 }} /> : <div style={{ width: 8, height: 8, flexShrink: 0 }} />}
                                                <span style={{ color }}>{iconoPorTipo(n.tipo)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{n.titulo}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.subtitulo}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{n.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{n.matricula || '—'}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{n.fecha}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{n.hora}</p>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <CePriorityBadge>{n.prioridad}</CePriorityBadge>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: !n.leida ? '#185FA5' : '#94a3b8' }}>
                                                {!n.leida ? 'No leída' : 'Leída'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{ color: '#94a3b8' }}>{CeIcons.more}</span>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {total === 0 ? 'Sin notificaciones' : `Mostrando ${from} a ${to} de ${formatCeNum(total)} notificaciones`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                            <div style={{ fontSize: 12, color: '#64748b' }}>{perPage} por p├ígina</div>
                        </div>
                    </div>
                </div>

                <div style={{ ...ceTheme.surface, position: 'sticky', top: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Detalle de la notificación</h2>
                        <span style={{ color: '#64748b', cursor: 'pointer' }}>{CeIcons.xIcon}</span>
                    </div>

                    {!detalle ? (
                        <p style={{ fontSize: 13, color: '#64748b' }}>Selecciona una notificación para ver el detalle.</p>
                    ) : (
                        <>
                            {detalle.prioridad === 'Alta' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, color: '#991B1B', marginBottom: 16 }}>
                                    <span>{CeIcons.alertTriangle}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>Alta prioridad</span>
                                </div>
                            ) : null}
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{detalle.titulo}</h3>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 12px 0' }}>{detalle.subtitulo}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{CeIcons.users}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Alumno relacionado</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.alumno}{detalle.matricula ? ` (${detalle.matricula})` : ''}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{CeIcons.folder}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Categor├¡a</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.categoria}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{CeIcons.clock}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fecha y hora</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.fecha}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#64748b', marginTop: 2 }}>{CeIcons.infoCircle}</span>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px 0' }}>Fuente</p>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0 }}>{detalle.fuente}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Detalle</p>
                            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.4, margin: 0, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                {detalle.motivo || detalle.subtitulo}
                            </p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 6px 0' }}>Acciones recomendadas</p>
                            <ul style={{ fontSize: 12, color: '#475569', margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
                                {(detalle.acciones ?? []).map((a) => <li key={a}>{a}</li>)}
                            </ul>
                        </div>

                            {detalle.expediente_url ? (
                                <Link
                                    to={detalle.expediente_url}
                                    style={{
                                        display: 'block', width: '100%', height: 40, lineHeight: '40px', borderRadius: 8,
                                        background: '#185FA5', color: 'white', fontSize: 13, fontWeight: 600,
                                        textAlign: 'center', textDecoration: 'none', marginBottom: 24,
                                    }}
                                >
                                    Ir al expediente del alumno
                                </Link>
                            ) : null}
                        </>
                    )}
                </div>

            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}

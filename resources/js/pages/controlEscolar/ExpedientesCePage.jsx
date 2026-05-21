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

const ACTIVITY_STYLES = { 
    upload: { color: '#185FA5', bg: '#DBEAFE' },
    obs: { color: '#534AB7', bg: '#EEEDFE' },
    check: { color: '#0F6E56', bg: '#DCFCE7' },
};
function actividadIcon(type) {
    if (type === 'obs') return CeIcons.eye;
    if (type === 'check') return CeIcons.check;
    return CeIcons.upload;
}

export function ExpedientesCePage() {
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
            const res = await controlEscolarApi.expedientes({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar el listado de expedientes.');
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
    const documentos = payload?.documentos_requeridos ?? [];
    const actividad = payload?.actividad_reciente ?? [];
    const promedioDocs = payload?.promedio_documentos_completos ?? 0;

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Expedientes de alumnos</h1>
                    {CeIcons.shieldCheck}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { to: '/app/expedientes', label: 'Crear expediente', icon: CeIcons.userPlus, color: '#185FA5' },
                        { to: '/app/documentos/bandejas/por-rol', label: 'Cargar documento', icon: CeIcons.upload, color: '#0F6E56' },
                        { to: '/app/control-escolar/expedientes', label: 'Validar expediente operativo', icon: CeIcons.check, color: '#534AB7' },
                        { to: '/app/observaciones', label: 'Observar', icon: CeIcons.eye, color: '#BA7517' },
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
                    <span style={{ color: '#534AB7', display: 'flex' }}>{CeIcons.download}</span> Exportar
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard icon={CeIcons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value={formatCeNum(metricas.pendientes)} trend={`${formatCeNum(metricas.total_alcance)} en tu alcance`} />
                <CeMetricCard icon={CeIcons.checkCircle} iconBg="#DCFCE7" iconColor="#0F6E56" title="Completos" value={formatCeNum(metricas.completos)} />
                <CeMetricCard icon={CeIcons.eye} iconBg="#FEF3C7" iconColor="#BA7517" title="Con observaciones" value={formatCeNum(metricas.con_observaciones)} />
                <CeMetricCard icon={CeIcons.file} iconBg="#EEEDFE" iconColor="#534AB7" title="Documentos faltantes" value={formatCeNum(metricas.documentos_faltantes)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Listado de expedientes</h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    {CeIcons.search}
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar por alumno, folio o programa..."
                                    style={{
                                        height: 36, width: 320,
                                        paddingLeft: 34, paddingRight: 12,
                                        border: '1px solid #e2e8f0', borderRadius: 8,
                                        fontSize: 13, color: '#0f172a', background: 'white',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                            <button style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 500, color: '#0f172a', cursor: 'pointer' }}>
                                <span style={{ color: '#185FA5', display: 'flex', alignItems: 'center' }}>{CeIcons.filter}</span> Filtros
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folio', 'Alumno', 'Programa', 'Última actualización', 'Estatus', 'Acciones'].map((h) => (
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
                                {rows.map((r) => (
                                    <tr
                                        key={r.folio}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                                            {r.folio}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{r.alumno}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula}</p>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{r.actualizado}</p>
                                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>{r.usuario}</p>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, color: '#185FA5', bg: '#EFF6FF' },
                                                    { icon: CeIcons.pencil, color: '#185FA5', bg: '#F8FAFC' },
                                                    { icon: CeIcons.upload, color: '#0F6E56', bg: '#DCFCE7' },
                                                    { icon: CeIcons.download, color: '#534AB7', bg: '#F5F3FF' },
                                                    { icon: CeIcons.check, color: '#0F6E56', bg: '#F0FDF4' }
                                                ].map((btn, idx) => (
                                                    <div 
                                                        key={idx} 
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
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Mostrando 1 a 8 de 58 expedientes</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['<', '1', '2', '3', '4', '5', '>'].map((p, idx) => (
                                    <button
                                        key={idx}
                                        style={{
                                            minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6,
                                            border: p === '1' ? 'none' : '1px solid #e2e8f0',
                                            background: p === '1' ? '#185FA5' : 'white',
                                            color: p === '1' ? 'white' : '#475569',
                                            fontSize: 13, cursor: 'pointer',
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                                Mostrar 
                                <select style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}>
                                    <option>10</option>
                                    <option>25</option>
                                    <option>50</option>
                                </select> 
                                por página
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Paneles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Documentos Requeridos */}
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>
                            Documentos requeridos
                            <Link to="/app/documentos" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todos</Link>
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', paddingBottom: 8, borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                            <span>Documento</span>
                            <span style={{ textAlign: 'center' }}>Requerido</span>
                            <span style={{ textAlign: 'right' }}>Completado</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                            {documentos.map((d, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', alignItems: 'center', padding: '10px 0', borderBottom: i < documentos.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 500 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${d.ok ? '#0F6E56' : '#BA7517'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {d.ok ? CeIcons.check : CeIcons.xIcon}
                                        </div>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombre}</span>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>{d.req}</div>
                                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: d.ok ? '#475569' : '#BA7517' }}>{d.comp}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: '#64748b' }}>Promedio de documentos completos</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>84%</span>
                            </div>
                            <div style={{ height: 6, width: '100%', background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: 6, width: '84%', background: '#0F6E56', borderRadius: 4 }} />
                            </div>
                        </div>
                    </div>

                    {/* Actividad Reciente */}
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>
                            Actividad reciente
                            <Link to="/app/actividad" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todo</Link>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {actividad.map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {a.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                            {a.title} <span style={{ fontWeight: 600, color: '#0f172a' }}>{a.bold}</span>
                                        </p>
                                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0 0' }}>{a.time}</p>
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
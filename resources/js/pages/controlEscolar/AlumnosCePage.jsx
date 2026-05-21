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

export function AlumnosCePage() {
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
            const res = await controlEscolarApi.alumnos({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar la gestión de alumnos.');
        } finally {
            setLoading(false);
        }
    }, [search, page, perPage]);

    useEffect(() => {
        const t = setTimeout(() => void cargar(), search.trim() ? 350 : 0);
        return () => clearTimeout(t);
    }, [cargar]);

    const metricas = payload?.metricas ?? {};
    const recientes = payload?.recientes ?? [];
    const rows = payload?.listado?.data ?? [];
    const meta = payload?.listado?.meta ?? {};

        return (
        <div style={{ ...ceTheme.pageShell }}>

                
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestión de alumnos</h1>
                    {CeIcons.shieldCheck}
                </div>

                    
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        Actualizado: {loading && !payload ? '…' : formatCeActualizado(payload?.actualizado_en)}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { to: '/app/alumnos/crear', label: 'Nuevo alumno', icon: CeIcons.userPlus, color: '#185FA5' },
                            { to: '/app/control-escolar/importaciones', label: 'Importar', icon: CeIcons.upload, color: '#0F6E56' },
                            { to: '/app/control-escolar/reportes', label: 'Exportar', icon: CeIcons.download, color: '#534AB7' },
                            { to: '/app/control-escolar/alumnos?filtros=1', label: 'Filtros', icon: CeIcons.filter, color: '#185FA5' },
                            { to: '/app/control-escolar/solicitudes', label: 'Más opciones', icon: CeIcons.more, color: '#64748b' },
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
                </div>
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard icon={CeIcons.users} iconBg="#DBEAFE" iconColor="#185FA5" title="Alumnos activos" value={formatCeNum(metricas.alumnos_activos)} trend={`${formatCeNum(metricas.total_alcance)} en tu alcance`} trendColor="#64748b" />
                <CeMetricCard icon={CeIcons.clock} iconBg="#FEF3C7" iconColor="#BA7517" title="Baja temporal" value={formatCeNum(metricas.baja_temporal)} trendColor="#64748b" />
                <CeMetricCard icon={CeIcons.school} iconBg="#F3E8FF" iconColor="#6B21A8" title="Egresados" value={formatCeNum(metricas.egresados)} trendColor="#64748b" />
                <CeMetricCard icon={CeIcons.alertTriangle} iconBg="#FFEDD5" iconColor="#C2410C" title="Expedientes incompletos" value={formatCeNum(metricas.expedientes_incompletos)} trendColor="#64748b" />
            </div>

            
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

               
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>Acciones rápidas</p>
                        <div style={{ marginTop: 8 }}>
                            <CeQuickAction to="/app/alumnos/crear" iconBg="#DBEAFE" iconColor="#185FA5" icon={CeIcons.userPlus} label="Nuevo alumno" sub="Registrar un nuevo alumno" />
                            <CeQuickAction to="/app/control-escolar/importaciones" iconBg="#DCFCE7" iconColor="#0F6E56" icon={CeIcons.upload} label="Importar alumnos" sub="Carga masiva desde archivo" />
                            <CeQuickAction to="/app/control-escolar/documentos" iconBg="#F3E8FF" iconColor="#6B21A8" icon={CeIcons.file} label="Generar constancia" sub="Generar constancias en lote" />
                            <CeQuickAction to="/app/control-escolar/trayectoria" iconBg="#FFEDD5" iconColor="#C2410C" icon={CeIcons.scrollText} label="Kardex" sub="Consultar kardex por alumno" />
                            <CeQuickAction to="/app/control-escolar/reinscripciones" iconBg="#DCFCE7" iconColor="#0F6E56" icon={CeIcons.refreshCw} label="Reinscribir alumnos" sub="Iniciar proceso de reinscripción" />
                        </div>
                    </div>

                    
                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>
                            Alumnos recientes
                            <Link to="/app/control-escolar/alumnos" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                                Ver todos
                            </Link>
                        </p>
                        <div style={{ marginTop: 8 }}>
                            {recientes.map((a, i) => (
                                <div
                                    key={a.alumno_id ?? a.matricula ?? i}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '12px 0',
                                        borderBottom: i < recientes.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            ...ceAvatarStyle(i),
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                                        }}
                                    >
                                        {ceInitials(a.nombre)}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {a.nombre}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>
                                            {a.matricula} · {a.programa}
                                        </p>
                                        <div style={{ marginTop: 6 }}>
                                            <CeStatusBadge>{a.estatus}</CeStatusBadge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                
                <div style={ceTheme.surface}>
                    {/* Table top bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
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
                                placeholder="Buscar por nombre, matrícula o programa..."
                                style={{
                                    height: 36, width: 320,
                                    paddingLeft: 34, paddingRight: 12,
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, color: '#0f172a', background: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                            Mostrar
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{ height: 32, border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', fontSize: 13, background: 'white', color: '#0f172a', outline: 'none' }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            registros
                        </div>
                    </div>

                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Matrícula', 'Nombre', 'Programa', 'Semestre', 'Estatus', 'Acciones'].map((h) => (
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
                                            Cargando alumnos…
                                        </td>
                                    </tr>
                                ) : !loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay alumnos en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : rows.map((r, i) => {
                                    const expedienteUrl = r.expediente_url ?? `/app/alumnos/${r.alumno_id}/expediente`;
                                    return (
                                    <tr
                                        key={r.alumno_id ?? r.matricula ?? i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px 10px' }}>
                                            <Link to={expedienteUrl} style={{ color: '#185FA5', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                                {r.matricula}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{r.nombre}</td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#475569' }}>{r.programa}</td>
                                        <td style={{ padding: '12px 10px', fontSize: 13, color: '#64748b' }}>{r.periodo}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { to: expedienteUrl, icon: CeIcons.eye, bg: '#EFF6FF', title: 'Ver expediente' },
                                                    { to: `/app/alumnos/${r.alumno_id}/captura-guiado`, icon: CeIcons.pencil, bg: '#F8FAFC', title: 'Editar' },
                                                    { to: `/app/alumnos/${r.alumno_id}/trayectoria`, icon: CeIcons.upload, bg: '#FFFBEB', title: 'Trayectoria' },
                                                    { to: '/app/control-escolar/reinscripciones', icon: CeIcons.refreshCw, bg: '#F0FDF4', title: 'Reinscripción' },
                                                    { to: '/app/control-escolar/documentos', icon: CeIcons.file, bg: '#F5F3FF', title: 'Documentos' },
                                                ].map(({ to, icon, bg, title }) => (
                                                    <Link
                                                        key={title}
                                                        to={to}
                                                        title={title}
                                                        style={{
                                                            width: 28, height: 28,
                                                            borderRadius: 6,
                                                            background: bg,
                                                            border: '1px solid #e2e8f0',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0,
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        {icon}
                                                    </Link>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );})}
                            </tbody>
                        </table>
                    </div>

                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {meta.from && meta.to
                                ? `Mostrando ${meta.from} a ${meta.to} de ${formatCeNum(meta.total)} registros`
                                : 'Sin registros'}
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
            </div>

            
            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}

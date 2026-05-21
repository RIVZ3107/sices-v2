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

export function ReinscripcionesCePage() {
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
            const res = await controlEscolarApi.reinscripciones({
                search: search.trim() || undefined,
                page,
                per_page: perPage,
            });
            setPayload(res?.data ?? null);
        } catch (err) {
            setPayload(null);
            setError(err?.message ?? 'No se pudo cargar la gestión de reinscripciones.');
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
    const motivosBloqueo = payload?.motivos_bloqueo ?? [];
    const reglaContinuidad = payload?.regla_continuidad ?? '';

        return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestión de reinscripciones</h1>
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
                        { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', icon: CeIcons.refreshCw, color: '#0F6E56' },
                        { to: '/app/control-escolar/reinscripciones', label: 'Desbloquear', icon: CeIcons.lock, color: '#BA7517' },
                        { to: '/app/control-escolar/reinscripciones', label: 'Generar ficha', icon: CeIcons.file, color: '#534AB7' },
                        { to: '/app/control-escolar/reinscripciones?filtros=1', label: 'Filtros', icon: CeIcons.filter, color: '#64748b' },
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

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <CeMetricCard icon={CeIcons.refreshCw} iconBg="#DBEAFE" iconColor="#185FA5" title="Reinscripciones en proceso" value={formatCeNum(metricas.en_proceso)} trend={`${formatCeNum(metricas.total_alcance)} en tu alcance`} trendUp={false} />
                <CeMetricCard icon={CeIcons.lock} iconBg="#FEF3C7" iconColor="#BA7517" title="Bloqueadas" value={formatCeNum(metricas.bloqueadas)} trend="Seguimiento académico" trendUp={true} />
                <CeMetricCard icon={CeIcons.school} iconBg="#DCFCE7" iconColor="#0F6E56" title="Completadas" value={formatCeNum(metricas.completadas)} trend="Continuidad confirmada" trendUp={true} />
                <CeMetricCard icon={CeIcons.alertTriangle} iconBg="#EEEDFE" iconColor="#534AB7" title="Adeudos detectados" value={formatCeNum(metricas.adeudos)} trend="Solo bloqueos académicos" trendUp={false} />
            </div>

            {error ? (
                <p style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13 }}>
                    {error}
                </p>
            ) : null}

            {reglaContinuidad ? (
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    {reglaContinuidad}
                </p>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                            Lista de reinscripciones <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>ⓘ</span>
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
                                    placeholder="Buscar por alumno, folio o periodo..."
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
                                    {['Folio', 'Alumno', 'Periodo', 'Motivo Bloqueo', 'Estatus', 'Acciones'].map((h) => (
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
                                            Cargando reinscripciones…
                                        </td>
                                    </tr>
                                ) : !loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                                            No hay reinscripciones en tu alcance con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : rows.map((r, i) => {
                                    const expedienteUrl = r.expediente_url ?? `/app/alumnos/${r.alumno_id}/expediente`;
                                    return (
                                    <tr
                                        key={r.folio ?? r.reinscripcion_id ?? i}
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
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
                                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0 0' }}>{r.matricula}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#475569' }}>{r.periodo}</td>
                                        <td style={{ padding: '14px 10px', fontSize: 13, color: '#64748b' }}>{r.motivo === '—' ? 'Ninguno' : r.motivo}</td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <CeStatusBadge>{r.estatus}</CeStatusBadge>
                                        </td>
                                        <td style={{ padding: '14px 10px' }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                                {[
                                                    { icon: CeIcons.eye, title: 'Revisar', color: '#185FA5', bg: '#EFF6FF' },
                                                    { icon: CeIcons.refreshCw, title: 'Reinscribir', color: '#0F6E56', bg: '#DCFCE7' },
                                                    { icon: CeIcons.lock, title: 'Desbloquear', color: '#BA7517', bg: '#FEF3C7' },
                                                    { icon: CeIcons.file, title: 'Imprimir', color: '#534AB7', bg: '#F5F3FF' },
                                                    { icon: CeIcons.folder, title: 'Expediente', color: '#185FA5', bg: '#F8FAFC', link: expedienteUrl }
                                                ].map((btn, idx) => (
                                                    btn.link ? (
                                                        <Link
                                                            key={idx}
                                                            to={btn.link}
                                                            title={btn.title}
                                                            style={{
                                                                width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: btn.color, background: btn.bg, cursor: 'pointer', flexShrink: 0,
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            {btn.icon}
                                                        </Link>
                                                    ) : (
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
                                                    )
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
                        <p style={ceTheme.surfaceTitle}>
                            Motivos de bloqueo
                            <Link to="/app/control-escolar/reinscripciones" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver todos</Link>
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {motivosBloqueo.length === 0 ? (
                                <li style={{ fontSize: 12, color: '#64748b', padding: '8px 0' }}>Sin bloqueos académicos registrados.</li>
                            ) : null}
                            {motivosBloqueo.map((m, i) => (
                                <li key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < motivosBloqueo.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{m.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#185FA5', background: '#DBEAFE', padding: '2px 8px', borderRadius: 6 }}>{m.n}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={ceTheme.surface}>
                        <p style={ceTheme.surfaceTitle}>
                            Flujo de reinscripción
                            <Link to="/app/guias" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>Ver guía</Link>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
                            {[
                                { num: 1, color: '#185FA5', title: 'Solicitud iniciada', desc: 'Alumno solicita reinscripción.' },
                                { num: 2, color: '#BA7517', title: 'Validación y revisión', desc: 'Revisión de documentos y adeudos.' },
                                { num: 3, color: '#534AB7', title: 'Aprobación / Desbloqueo', desc: 'Se autoriza el proceso.' },
                                { num: 4, color: '#0F6E56', title: 'Reinscripción completada', desc: 'Alumno reinscrito exitosamente.' }
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
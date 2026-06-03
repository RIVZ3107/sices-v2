import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardResumen } from './useDashboardResumen';
import {
    CeIcons,
    CeMetricCard,
    CeStatusBadge,
    ceColors,
    ceTheme,
} from '../../components/controlEscolar';
import { InstitutionalEmptyState } from '../../components/ui/InstitutionalEmptyState';
import {
    CE_DASHBOARD_EMPTY_ACTIONS,
    EMPTY_BY_ROLE,
    MSG_CARGA_TABLERO,
    institutionalDistribucionTitulo,
    sanitizeInstitutionalLabel,
    sanitizeInstitutionalMessage,
} from '../../utils/uxInstitucional';

const PROCESOS_POR_PAGINA = 5;

const MAS_OPCIONES = [
    { to: '/app/importaciones', label: 'Importaciones históricas' },
    { to: '/app/control-escolar/observaciones', label: 'Observaciones' },
    { to: '/app/control-escolar/reportes', label: 'Reportes' },
    { to: '/app/control-escolar/expedientes', label: 'Expedientes' },
    { to: '/app/certificacion/solicitud', label: 'Solicitud documental' },
];

function buildDonutGradient(segmentos, total) {
    if (!total || !Array.isArray(segmentos) || segmentos.length === 0) {
        return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    let acc = 0;
    const parts = segmentos.map((s) => {
        const start = acc;
        const span = (s.count / total) * 360;
        acc += span;
        return `${s.color} ${start}deg ${acc}deg`;
    });

    return `conic-gradient(${parts.join(', ')})`;
}

function formatFechaInstitucional(iso) {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function severidadAtencion(sev) {
    if (sev === 'error') {
        return { bg: '#FEE2E2', border: '#FECACA', icon: '#991B1B', iconBg: '#FEE2E2' };
    }
    if (sev === 'warning') {
        return { bg: '#FEF3C7', border: '#FDE68A', icon: '#92400E', iconBg: '#FEF3C7' };
    }
    return { bg: '#EDE9FE', border: '#DDD6FE', icon: '#5B21B6', iconBg: '#EDE9FE' };
}

function CeAtencionPrioritaria({ items }) {
    if (!items?.length) {
        return null;
    }

    const detalleHref = items[0]?.href ?? '/app/control-escolar/reportes';

    return (
        <div
            style={{
                marginBottom: 24,
                padding: '16px 20px',
                borderRadius: 12,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#991B1B' }}>Atención prioritaria</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        {items.map((item) => {
                            const pal = severidadAtencion(item.severidad);
                            return (
                                <Link
                                    key={item.key}
                                    to={item.href}
                                    style={{
                                        display: 'flex',
                                        gap: 10,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: '#fff',
                                        border: `1px solid ${pal.border}`,
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <span style={{ color: pal.icon, display: 'flex', flexShrink: 0, marginTop: 2 }}>
                                        {item.severidad === 'warning' ? CeIcons.alertTriangle : item.severidad === 'info' ? CeIcons.lock : CeIcons.alert}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.titulo}</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.descripcion}</div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <Link
                    to={detalleHref}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 8,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#185FA5',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                >
                    Ver detalles
                </Link>
            </div>
        </div>
    );
}

function CeAccionesRapidas() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuAbierto) {
            return undefined;
        }
        const cerrar = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [menuAbierto]);

    const btnSec = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 38,
        padding: '0 16px',
        borderRadius: 8,
        background: 'white',
        border: '1px solid #e2e8f0',
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        color: '#0f172a',
    };

    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
                to="/app/control-escolar/inscripciones"
                style={{
                    ...btnSec,
                    background: '#185FA5',
                    border: '1px solid #185FA5',
                    color: '#fff',
                    fontWeight: 600,
                }}
            >
                <span style={{ display: 'flex', color: '#fff' }}>{CeIcons.scrollText}</span>
                Nueva inscripción
            </Link>
            {[
                { to: '/app/alumnos/crear', label: 'Nuevo alumno', icon: CeIcons.userPlus, color: '#185FA5' },
                { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', icon: CeIcons.refreshCw, color: '#0F6E56' },
                { to: '/app/certificacion/solicitud', label: 'Generar constancia', icon: CeIcons.file, color: '#534AB7' },
                { to: '/app/control-escolar/trayectoria', label: 'Kardex', icon: CeIcons.graduationCap, color: '#BA7517' },
            ].map(({ to, label, icon, color }) => (
                <Link key={label} to={to} style={btnSec}>
                    <span style={{ color, display: 'flex' }}>{icon}</span>
                    {label}
                </Link>
            ))}
            <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => setMenuAbierto((v) => !v)}
                    style={{ ...btnSec, cursor: 'pointer', fontFamily: 'inherit' }}
                    aria-expanded={menuAbierto}
                    aria-haspopup="true"
                >
                    <span style={{ color: '#64748b', display: 'flex' }}>{CeIcons.more}</span>
                    Más opciones
                </button>
                {menuAbierto ? (
                    <div
                        role="menu"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            minWidth: 220,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                            zIndex: 40,
                            padding: 4,
                        }}
                    >
                        {MAS_OPCIONES.map((op) => (
                            <Link
                                key={op.to}
                                to={op.to}
                                role="menuitem"
                                onClick={() => setMenuAbierto(false)}
                                style={{
                                    display: 'block',
                                    padding: '10px 12px',
                                    fontSize: 13,
                                    color: '#334155',
                                    textDecoration: 'none',
                                    borderRadius: 6,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {op.label}
                            </Link>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function CeProcesosRecientes({ procesos }) {
    const [pagina, setPagina] = useState(1);
    const total = procesos.length;
    const totalPaginas = Math.max(1, Math.ceil(total / PROCESOS_POR_PAGINA));
    const paginaSegura = Math.min(pagina, totalPaginas);

    const filas = useMemo(() => {
        const start = (paginaSegura - 1) * PROCESOS_POR_PAGINA;
        return procesos.slice(start, start + PROCESOS_POR_PAGINA);
    }, [procesos, paginaSegura]);

    if (total === 0) {
        return <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sin procesos pendientes en su alcance.</p>;
    }

    const th = { fontSize: 11, fontWeight: 600, color: '#64748b', padding: '8px 6px', textAlign: 'left' };

    return (
        <>
            <div style={{ overflowX: 'auto', margin: '12px -20px 0', padding: '0 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <th style={th}>Proceso</th>
                            <th style={th}>Código</th>
                            <th style={th}>Tipo</th>
                            <th style={th}>Estatus</th>
                            <th style={th}>Fecha</th>
                            <th style={{ ...th, textAlign: 'right', width: 48 }}> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((row, idx) => (
                            <tr key={`${row.codigo ?? row.matricula}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 6px', fontSize: 12, fontWeight: 600, color: '#0f172a', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sanitizeInstitutionalLabel(row.proceso)}
                                </td>
                                <td style={{ padding: '10px 6px', fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                                    {sanitizeInstitutionalLabel(row.codigo ?? row.matricula)}
                                </td>
                                <td style={{ padding: '10px 6px', fontSize: 11, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {sanitizeInstitutionalLabel(row.tipo ?? row.tramite)}
                                </td>
                                <td style={{ padding: '10px 6px' }}>
                                    <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                </td>
                                <td style={{ padding: '10px 6px', fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {formatFechaInstitucional(row.fecha)}
                                </td>
                                <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                                    <Link
                                        to={row.expediente_url ?? '/app/control-escolar/solicitudes'}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background: '#EFF6FF',
                                            border: '1px solid #BFDBFE',
                                            color: '#185FA5',
                                            textDecoration: 'none',
                                        }}
                                        title="Ver detalle"
                                    >
                                        {CeIcons.eye}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Mostrando {filas.length} de {total} procesos
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setPagina(n)}
                            style={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: 6,
                                border: n === paginaSegura ? '1px solid #185FA5' : '1px solid #e2e8f0',
                                background: n === paginaSegura ? '#185FA5' : '#fff',
                                color: n === paginaSegura ? '#fff' : '#64748b',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

export function ControlEscolarDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();

    const data = fullPayload;
    const loading = fullPayload === null && !error;
    const m = data?.metricas ?? {};
    const contexto = data?.contexto ?? {};
    const distribucion = data?.alumnos_distribucion ?? { total: 0, segmentos: [], tipo: 'estatus' };
    const atencion = data?.atencion_prioritaria ?? [];

    const expedPend = Number(m.matriculas_incompletas ?? 0);
    const insVal = Number(m.inscripciones_pendientes ?? 0);
    const cargasPend = Number(m.cargas_academicas_pendientes ?? 0);
    const reinBloq = Number(m.reinscripciones_bloqueadas ?? 0);
    const califPend = Number(m.calificaciones_pendientes ?? 0);
    const docGen = Number(m.solicitudes_en_revision ?? 0);
    const solCorr = Number(m.documentos_con_observaciones ?? 0);
    const importErrores = Number(m.importaciones_con_errores ?? 0);

    const cicloLabel = sanitizeInstitutionalLabel(
        contexto.ciclo_escolar ? `Ciclo escolar ${contexto.ciclo_escolar}` : null,
        '',
    );
    const sedeLabel = contexto.sede ? sanitizeInstitutionalLabel(contexto.sede) : '';

    const misPendientes = useMemo(
        () => [
            { label: 'Inscripciones por validar', n: insVal, to: '/app/control-escolar/inscripciones' },
            { label: 'Reinscripciones bloqueadas', n: reinBloq, to: '/app/control-escolar/reinscripciones' },
            { label: 'Documentos por generar', n: docGen, to: '/app/control-escolar/documentos' },
            { label: 'Solicitudes de corrección', n: solCorr, to: '/app/control-escolar/solicitudes' },
            { label: 'Expedientes incompletos', n: expedPend, to: '/app/control-escolar/expedientes' },
        ],
        [insVal, reinBloq, docGen, solCorr, expedPend],
    );

    const procesos = useMemo(() => {
        if (!Array.isArray(data?.procesos_recientes)) {
            return [];
        }
        return data.procesos_recientes;
    }, [data]);

    const segmentos = distribucion.segmentos ?? [];
    const totalDonut = Number(distribucion.total ?? 0);
    const donutTitulo = institutionalDistribucionTitulo(distribucion.tipo);
    const errorInstitucional = error ? sanitizeInstitutionalMessage(error) : '';

    const actualizado = data?.actualizado_en
        ? formatFechaInstitucional(data.actualizado_en)
        : formatFechaInstitucional(new Date().toISOString());

    if (loading) {
        return (
            <div style={{ ...ceTheme.pageShell }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                    {CeIcons.shieldCheck}
                </div>
                <div style={ceTheme.surface}>
                    <p style={{ fontSize: 13, color: '#64748b' }}>Cargando datos del tablero operativo...</p>
                </div>
            </div>
        );
    }

    if (error && data === null) {
        return (
            <div style={{ ...ceTheme.pageShell }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                    {CeIcons.shieldCheck}
                </div>
                <div style={ceTheme.surface}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>No fue posible cargar el tablero</p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{errorInstitucional || MSG_CARGA_TABLERO}</p>
                </div>
            </div>
        );
    }

    const subtituloPartes = [
        'Operación académica escolar para Educación Normal y UPN',
        sedeLabel || null,
        cicloLabel || null,
    ].filter(Boolean);

    return (
        <div style={{ ...ceTheme.pageShell }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{subtituloPartes.join(' · ')}</p>
                    {contexto.total_alumnos_alcance > 0 ? (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                            {contexto.total_alumnos_alcance.toLocaleString('es-MX')} alumnos en su alcance territorial
                        </p>
                    ) : null}
                </div>
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    <span style={{ color: '#94a3b8' }}>{CeIcons.clock}</span>
                    Última actualización {actualizado}
                </p>
            </div>

            {errorInstitucional ? (
                <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 13, color: '#92400E', marginBottom: 24 }}>
                    {errorInstitucional}
                </div>
            ) : null}

            <CeAtencionPrioritaria items={atencion} />

            {totalDonut === 0 ? (
                <div style={{ marginBottom: 24 }}>
                    <InstitutionalEmptyState
                        title={EMPTY_BY_ROLE.control_escolar_alumnos.title}
                        description={EMPTY_BY_ROLE.control_escolar_alumnos.description}
                        action={
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {CE_DASHBOARD_EMPTY_ACTIONS.map((a) => (
                                    <Link
                                        key={a.to}
                                        to={a.to}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            height: 36,
                                            padding: '0 14px',
                                            borderRadius: 8,
                                            background: '#185FA5',
                                            color: '#fff',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {a.label}
                                    </Link>
                                ))}
                            </div>
                        }
                    />
                </div>
            ) : null}

            <CeAccionesRapidas />

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <CeMetricCard icon={CeIcons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value={expedPend} trend={`${m.trayectorias_listas_para_certificar ?? 0} listos para certificar`} trendColor={ceColors.primary} />
                <CeMetricCard icon={CeIcons.scrollText} iconBg="#DCFCE7" iconColor="#0F6E56" title="Inscripciones por validar" value={insVal} trend={`${m.alumnos_activos ?? 0} alumnos activos`} trendColor={ceColors.success} />
                <CeMetricCard icon={CeIcons.lock} iconBg="#FEF3C7" iconColor="#BA7517" title="Cargas académicas pendientes" value={cargasPend} trend={importErrores > 0 ? `${importErrores} importaciones con error` : 'Sin importaciones con error'} trendColor={importErrores > 0 ? ceColors.warn : ceColors.muted} />
                <CeMetricCard icon={CeIcons.file} iconBg="#F3E8FF" iconColor="#6B21A8" title="Calificaciones pendientes" value={califPend} trend={`${m.aspirantes_pendientes ?? 0} aspirantes`} trendColor={ceColors.purple} />
                <CeMetricCard icon={CeIcons.alertTriangle} iconBg="#FEF3C7" iconColor="#BA7517" title="Documentos / solicitudes" value={solCorr + docGen} trend={`${solCorr} con observaciones`} trendColor={ceColors.warn} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
                <div style={ceTheme.surface}>
                    <div style={ceTheme.surfaceTitle}>Mis pendientes</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {misPendientes.map((p) => (
                            <li key={p.label}>
                                <Link
                                    to={p.to}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 0',
                                        borderBottom: '1px solid #f1f5f9',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                    }}
                                >
                                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.n}</span>
                                        <span style={{ color: '#185FA5', display: 'flex' }}>{CeIcons.chevronRight}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link to="/app/control-escolar/expedientes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver todos mis pendientes ›
                    </Link>
                </div>

                <div style={ceTheme.surface}>
                    <div style={ceTheme.surfaceTitle}>{donutTitulo}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '10px 0' }}>
                        <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', background: buildDonutGradient(segmentos, totalDonut), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{totalDonut.toLocaleString('es-MX')}</span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxHeight: 220, overflowY: 'auto' }}>
                            {segmentos.map((r) => (
                                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                        <span style={{ color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {sanitizeInstitutionalLabel(r.label)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                                        <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', width: 32 }}>{r.count}</span>
                                        <span style={{ color: '#94a3b8', textAlign: 'right', width: 44 }}>({r.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/reportes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver reporte completo ›
                    </Link>
                </div>

                <div style={ceTheme.surface}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={ceTheme.surfaceTitle}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>Procesos recientes</span>
                        </div>
                        <Link to="/app/control-escolar/solicitudes" style={{ fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none' }}>
                            Ver todos
                        </Link>
                    </div>
                    <CeProcesosRecientes procesos={procesos} />
                    <Link to="/app/control-escolar/solicitudes" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver todos los procesos ›
                    </Link>
                </div>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>
        </div>
    );
}

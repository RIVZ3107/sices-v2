import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardResumen } from './useDashboardResumen';
import {
    CeIcons,
    CeMetricCard,
    CeStatusBadge,
    ceColors,
    ceTheme,
} from '../../components/controlEscolar';

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

export function ControlEscolarDashboardPage() {
    const { error, fullPayload } = useDashboardResumen();

    const data = fullPayload;
    const loading = fullPayload === null && !error;
    const m = data?.metricas ?? {};
    const contexto = data?.contexto ?? {};
    const distribucion = data?.alumnos_distribucion ?? { total: 0, segmentos: [], tipo: 'estatus' };

    const expedPend = Number(m.matriculas_incompletas ?? 0);
    const insVal = Number(m.inscripciones_pendientes ?? 0);
    const reinBloq = Number(m.cargas_academicas_pendientes ?? 0);
    const docGen = Number(m.calificaciones_pendientes ?? 0);
    const solCorr = Number(m.documentos_con_observaciones ?? 0) + Number(m.solicitudes_en_revision ?? 0);

    const misPendientes = useMemo(
        () => [
            {
                label: 'Inscripciones por validar',
                n: insVal,
                to: '/app/control-escolar/inscripciones',
            },
            {
                label: 'Reinscripciones bloqueadas',
                n: reinBloq,
                to: '/app/control-escolar/reinscripciones',
            },
            {
                label: 'Documentos por generar',
                n: docGen,
                to: '/app/control-escolar/documentos',
            },
            {
                label: 'Solicitudes de corrección',
                n: solCorr,
                to: '/app/control-escolar/solicitudes',
            },
            {
                label: 'Expedientes incompletos',
                n: expedPend,
                to: '/app/control-escolar/expedientes',
            },
        ],
        [insVal, reinBloq, docGen, solCorr, expedPend]
    );

    const procesos = useMemo(() => {
        if (Array.isArray(data?.procesos_recientes) && data.procesos_recientes.length > 0) {
            return data.procesos_recientes;
        }

        return [];
    }, [data]);

    const segmentos = distribucion.segmentos ?? [];
    const totalDonut = Number(distribucion.total ?? 0);
    const donutTitulo = distribucion.tipo === 'escenario_demo'
        ? 'Expedientes por escenario (demo)'
        : 'Alumnos por estatus';

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
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#991B1B' }}>Error de carga</p>
                    <p style={{ fontSize: 13, color: '#991B1B', marginBottom: 12 }}>{error}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                        Ejecute el seeder demo: <code style={{ fontSize: 11 }}>php artisan db:seed --class=CertificacionControlEscolarDemoSeeder</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...ceTheme.pageShell }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard Control Escolar</h1>
                        {CeIcons.shieldCheck}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Operación académica escolar para Educación Normal y UPN.
                        {contexto.sede ? ` · ${contexto.sede}` : ''}
                        {contexto.ciclo_escolar ? ` · ${contexto.ciclo_escolar}` : ''}
                    </p>
                    {contexto.total_alumnos_alcance > 0 ? (
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                            {contexto.total_alumnos_alcance.toLocaleString('es-MX')} alumnos en su alcance territorial
                        </p>
                    ) : null}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        <span style={{ color: '#94a3b8' }}>{CeIcons.clock}</span>
                        Actualizado: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {error ? (
                <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 13, color: '#92400E', marginBottom: 24 }}>
                    {error}
                </div>
            ) : null}

            {totalDonut === 0 ? (
                <div style={{ padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13, color: '#1E40AF', marginBottom: 24 }}>
                    No hay alumnos en alcance. Ejecute{' '}
                    <code style={{ fontSize: 12 }}>php artisan db:seed --class=CertificacionControlEscolarDemoSeeder</code>{' '}
                    e inicie sesión como <strong>control.escolar@sices.local</strong>.
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {[
                    { to: '/app/alumnos/crear', label: 'Nuevo alumno', icon: CeIcons.userPlus, color: '#185FA5' },
                    { to: '/app/expedientes?tab=ingreso', label: 'Nueva inscripción', icon: CeIcons.scrollText, color: '#0F6E56' },
                    { to: '/app/control-escolar/reinscripciones', label: 'Reinscribir alumno', icon: CeIcons.refreshCw, color: '#0F6E56' },
                    { to: '/app/control-escolar/documentos', label: 'Generar constancia', icon: CeIcons.file, color: '#534AB7' },
                    { to: '/app/control-escolar/trayectoria', label: 'Kardex', icon: CeIcons.graduationCap, color: '#BA7517' },
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
                            fontSize: 13, fontWeight: 500, textDecoration: 'none', color: '#0f172a'
                        }}
                    >
                        <span style={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</span>
                        <span>{label}</span>
                    </Link>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                <CeMetricCard icon={CeIcons.folder} iconBg="#DBEAFE" iconColor="#185FA5" title="Expedientes pendientes" value={expedPend} trend={`${m.trayectorias_listas_para_certificar ?? 0} listos para certificar`} trendColor={ceColors.primary} />
                <CeMetricCard icon={CeIcons.scrollText} iconBg="#DCFCE7" iconColor="#0F6E56" title="Inscripciones por validar" value={insVal} trend={`${m.alumnos_activos ?? 0} alumnos activos`} trendColor={ceColors.success} />
                <CeMetricCard icon={CeIcons.lock} iconBg="#FEE2E2" iconColor="#991B1B" title="Cargas académicas pendientes" value={reinBloq} trend={`${m.importaciones_con_errores ?? 0} importaciones con error`} trendColor={ceColors.errorText} />
                <CeMetricCard icon={CeIcons.file} iconBg="#F3E8FF" iconColor="#6B21A8" title="Calificaciones pendientes" value={docGen} trend={`${m.aspirantes_pendientes ?? 0} aspirantes`} trendColor={ceColors.purple} />
                <CeMetricCard icon={CeIcons.alertTriangle} iconBg="#FEF3C7" iconColor="#BA7517" title="Documentos / solicitudes" value={solCorr} trend={`${m.documentos_con_observaciones ?? 0} con observaciones`} trendColor={ceColors.warn} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>

                
                <div style={ceTheme.surface}>
                    <div style={ceTheme.surfaceTitle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Mis pendientes</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {misPendientes.map((p) => (
                            <li
                                key={p.label}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}
                            >
                                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{p.label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.n}</span>
                                    <Link to={p.to} style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', textDecoration: 'none', background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                                        Ir
                                    </Link>
                                </div>
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
                                <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                                    {totalDonut.toLocaleString('es-MX')}
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>Total</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxHeight: 220, overflowY: 'auto' }}>
                            {segmentos.map((r) => (
                                <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                        <span style={{ color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                                        <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right', width: 32 }}>{r.count}</span>
                                        <span style={{ color: '#94a3b8', textAlign: 'right', width: 44 }}>({r.pct}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Link to="/app/control-escolar/alumnos" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#185FA5', textDecoration: 'none', marginTop: 16 }}>
                        Ver reporte completo ›
                    </Link>
                </div>

                <div style={ceTheme.surface}>
                    <div style={ceTheme.surfaceTitle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Procesos recientes</span>
                    </div>
                    {procesos.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Sin procesos pendientes en su alcance.</p>
                    ) : (
                        <div style={{ overflowX: 'auto', margin: '16px -20px 0', padding: '0 20px' }}>
                        
                            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#64748b' }}>Alumno</div>
                                <div style={{ width: 100, fontSize: 11, fontWeight: 600, color: '#64748b' }}>Estatus</div>
                                <div style={{ width: 40, fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'right' }}>Acción</div>
                            </div>
                          
                            {procesos.slice(0, 6).map((row, idx) => (
                                <div key={`${row.alumno}-${idx}`} style={{ display: 'flex', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                            {row.alumno}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>{row.matricula}</div>
                                        {row.tramite ? (
                                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                                {row.tramite}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div style={{ width: 100 }}>
                                        <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                    </div>
                                    <div style={{ width: 40, textAlign: 'right' }}>
                                        <Link
                                            to={row.expediente_url ?? '/app/control-escolar/expedientes'}
                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'white', border: '1px solid #e2e8f0', color: '#185FA5', textDecoration: 'none' }}
                                            title="Ver detalle"
                                        >
                                            {CeIcons.eye}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
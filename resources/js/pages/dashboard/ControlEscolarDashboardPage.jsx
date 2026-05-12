import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { CeShell } from '../../components/controlEscolar/CeShell';
import { CeInstSurface, CeStatusBadge } from '../../components/controlEscolar/CeShell';
import {
    CE_DASHBOARD_ESTATUS_ALUMNOS,
    CE_DEMO_PROCESOS_RECIENTES,
    ceTotalAlumnosEstatus,
} from '../../data/controlEscolarDemoData';
import { useDashboardResumen } from './useDashboardResumen';

function buildDonutGradient() {
    const segs = CE_DASHBOARD_ESTATUS_ALUMNOS;
    const total = ceTotalAlumnosEstatus();

    if (!total) {
        return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }

    let acc = 0;

    const parts = segs.map((s) => {
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

    const expedPend = Math.max(Number(m.matriculas_incompletas ?? 0), 12);
    const insVal = Math.max(Number(m.inscripciones_pendientes ?? 0), 28);
    const reinBloq = Math.max(Number(m.cargas_academicas_pendientes ?? 0), 14);
    const docGen = Math.max(Number(m.calificaciones_pendientes ?? 0), 18);
    const solCorr = Math.max(Number(m.documentos_con_observaciones ?? 0), 7);

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
        if (Array.isArray(data?.documentos_en_proceso) && data.documentos_en_proceso.length > 0) {
            return data.documentos_en_proceso.map((r) => ({
                alumno: r.alumno ?? '—',
                matricula: r.matricula ?? '—',
                tramite: 'Seguimiento documental / expediente',
                fecha: new Date().toLocaleDateString('es-MX'),
                estatus: r.estado ?? 'En proceso',
            }));
        }

        return CE_DEMO_PROCESOS_RECIENTES;
    }, [data]);

    const actions = [
        {
            to: '/app/alumnos/crear',
            label: 'Nuevo alumno',
            variant: 'primary',
            icon: 'userPlus',
        },
        {
            to: '/app/control-escolar/inscripciones',
            label: 'Nueva inscripción',
            variant: 'success',
            icon: 'clipboardList',
        },
        {
            to: '/app/control-escolar/reinscripciones',
            label: 'Reinscribir alumno',
            variant: 'success',
            icon: 'refreshCw',
        },
        {
            to: '/app/control-escolar/documentos',
            label: 'Generar constancia',
            variant: 'purple',
            icon: 'fileText',
        },
        {
            to: '/app/control-escolar/trayectoria',
            label: 'Kardex',
            variant: 'orange',
            icon: 'graduationCap',
        },
        {
            to: '/app/control-escolar/solicitudes',
            label: 'Más opciones',
            variant: 'muted',
            icon: 'moreHorizontal',
        },
    ];

    const metrics = [
        {
            title: 'Expedientes pendientes',
            value: expedPend,
            trend: '↓ 6% vs. ciclo anterior',
            tone: 'blue',
        },
        {
            title: 'Inscripciones por validar',
            value: insVal,
            trend: '↑ 4% vs. ciclo anterior',
            tone: 'green',
        },
        {
            title: 'Reinscripciones bloqueadas',
            value: reinBloq,
            trend: '↑ 2% vs. ciclo anterior',
            tone: 'red',
        },
        {
            title: 'Documentos por generar',
            value: docGen,
            trend: '↓ 3% vs. ciclo anterior',
            tone: 'purple',
        },
        {
            title: 'Solicitudes de corrección',
            value: solCorr,
            trend: '↑ 1% vs. ciclo anterior',
            tone: 'orange',
        },
    ];

    const totalDonut = ceTotalAlumnosEstatus();

    if (loading) {
        return (
            <CeShell
                title="Dashboard Control Escolar"
                subtitle="Cargando información operativa del ciclo escolar..."
                actions={[]}
                metrics={[]}
                rightPanel={null}
            >
                <CeInstSurface title="Cargando">
                    <p className="text-sm text-slate-500">
                        Preparando tablero operativo de Control Escolar.
                    </p>
                </CeInstSurface>
            </CeShell>
        );
    }

    if (error && data === null) {
        return (
            <CeShell
                title="Dashboard Control Escolar"
                subtitle="No fue posible cargar la información operativa."
                actions={[]}
                metrics={[]}
                rightPanel={null}
            >
                <CeInstSurface title="Error de carga">
                    <p className="text-sm text-red-600">{error}</p>
                </CeInstSurface>
            </CeShell>
        );
    }

    return (
        <CeShell
            title="Dashboard Control Escolar"
            subtitle="Operación académica escolar para Educación Normal y UPN. La matrícula oficial la asigna Educación Superior; aquí se prepara expediente, inscripción, trayectoria y documentos operativos."
            actions={actions}
            metrics={metrics}
            rightPanel={null}
        >
            {error ? (
                <CeInstSurface title="Aviso">
                    <p className="text-sm text-amber-700">{error}</p>
                </CeInstSurface>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
                <CeInstSurface title="Mis pendientes">
                    <ul className="grid gap-2">
                        {misPendientes.map((p) => (
                            <li
                                key={p.label}
                                className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm"
                            >
                                <span className="text-slate-700">{p.label}</span>

                                <span className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{p.n}</span>
                                    <Link to={p.to} className="text-xs font-semibold text-sky-700">
                                        Ir
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <Link to="/app/control-escolar/expedientes" className="ce-link-more">
                        Ver todos mis pendientes &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Alumnos por estatus">
                    <div className="ce-donut-wrap">
                        <div className="ce-donut" style={{ background: buildDonutGradient() }}>
                            <div className="ce-donut-inner">
                                <span className="ce-donut-total">
                                    {totalDonut.toLocaleString('es-MX')}
                                </span>
                                <span className="ce-donut-label">Total</span>
                            </div>
                        </div>

                        <div className="ce-legend">
                            {CE_DASHBOARD_ESTATUS_ALUMNOS.map((r) => (
                                <div key={r.key} className="ce-legend-row">
                                    <span>
                                        <span style={{ color: r.color }}>●</span> {r.label}
                                    </span>
                                    <span>
                                        {r.count.toLocaleString('es-MX')} ({r.pct}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/app/control-escolar/alumnos" className="ce-link-more">
                        Ver reporte completo &gt;
                    </Link>
                </CeInstSurface>

                <CeInstSurface title="Procesos recientes">
                    <div className="ce-table-wrap">
                        <table className="inst-table min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-2 py-2 text-left">Alumno</th>
                                    <th className="px-2 py-2 text-left">Trámite</th>
                                    <th className="px-2 py-2 text-left">Fecha</th>
                                    <th className="px-2 py-2 text-left">Estatus</th>
                                    <th className="px-2 py-2 text-left">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {procesos.slice(0, 6).map((row, idx) => (
                                    <tr
                                        key={`${row.alumno}-${idx}`}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-2 py-2">
                                            <div className="font-medium text-slate-900">
                                                {row.alumno}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {row.matricula}
                                            </div>
                                        </td>

                                        <td className="px-2 py-2 text-slate-700">
                                            {row.tramite}
                                        </td>

                                        <td className="px-2 py-2 text-slate-600">
                                            {row.fecha}
                                        </td>

                                        <td className="px-2 py-2">
                                            <CeStatusBadge>{row.estatus}</CeStatusBadge>
                                        </td>

                                        <td className="px-2 py-2">
                                            <Link
                                                to="/app/control-escolar/expedientes"
                                                className="text-xs font-semibold text-sky-700"
                                            >
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Link to="/app/control-escolar/solicitudes" className="ce-link-more">
                        Ver todos los procesos &gt;
                    </Link>
                </CeInstSurface>
            </div>
        </CeShell>
    );
}
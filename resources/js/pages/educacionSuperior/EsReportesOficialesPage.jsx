import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { educacionSuperiorApi } from '../../api/educacionSuperior';
import {
    EsCard,
    EsHeaderAction,
    EsPageLayout,
    EsProgressBar,
    EsSidePanel,
    EsTable,
    esColors,
    esMetricTones,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';

const TABLE_HEADERS = ['Reporte', 'Descripción', 'Última generación', 'Responsable', 'Acciones'];

function ReporteRow({ r }) {
    return (
        <tr style={esTheme.tr}>
            <td style={{ ...esTheme.td, ...esTheme.tdPrimary }}>{r.clave}</td>
            <td style={{ ...esTheme.td, ...esTheme.tdEmphasis }}>{r.nombre}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{r.ultima_generacion ?? '—'}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{r.responsable ?? '—'}</td>
            <td style={esTheme.td}>
                <div style={esTheme.rowActions}>
                    <Link to={r.ruta} style={esTheme.btnSmPrimary}>
                        Generar
                    </Link>
                    <Link to={r.ruta} style={esTheme.btnSmMuted}>
                        Descargar
                    </Link>
                </div>
            </td>
        </tr>
    );
}

export function EsReportesOficialesPage() {
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await educacionSuperiorApi.reportesOficiales();
            setPayload(res?.data ?? null);
        } catch (e) {
            setPayload(null);
            setError(e?.message ?? 'No se pudieron cargar los reportes oficiales.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const metricasRaw = payload?.metricas ?? {};
    const reportes = Array.isArray(payload?.reportes) ? payload.reportes : [];
    const indicadores = Array.isArray(payload?.indicadores) ? payload.indicadores : [];

    const metrics = useMemo(
        () => [
            {
                iconKey: 'report',
                ...esMetricTones.blue,
                title: 'Reportes generados',
                value: formatEsNum(metricasRaw.reportes_generados),
                trend: `${formatEsNum(metricasRaw.total_catalogo)} en catálogo oficial`,
                trendPrefix: '',
            },
            {
                iconKey: 'users',
                ...esMetricTones.green,
                title: 'Matrícula oficial',
                value: formatEsNum(metricasRaw.matricula_oficial),
                trend: 'Alumnos con estatus activo',
                trendPrefix: '',
            },
            {
                iconKey: 'graduate',
                ...esMetricTones.purple,
                title: 'Egresados',
                value: formatEsNum(metricasRaw.egresados),
                trend: 'Candidatos a egreso / trayectoria',
                trendPrefix: '',
            },
            {
                iconKey: 'file',
                ...esMetricTones.yellow,
                title: 'Certificados emitidos',
                value: formatEsNum(metricasRaw.certificados_emitidos),
                trend: 'Documentos firmados en el sistema',
                trendPrefix: '',
            },
            {
                iconKey: 'alert',
                ...esMetricTones.red,
                title: 'Pendientes',
                value: formatEsNum(metricasRaw.pendientes),
                trend: 'Revisión normativa y solicitudes',
                trendPrefix: '',
            },
        ],
        [metricasRaw],
    );

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando reportes oficiales..." title="" />;
    }

    if (error && reportes.length === 0) {
        return (
            <EsPageLayout
                error={error}
                title="Reportes oficiales"
                breadcrumbCurrent="Reportes oficiales"
                largeTitle
            />
        );
    }

    return (
        <EsPageLayout
            title="Reportes oficiales"
            subtitle="Genera, consulta y da seguimiento a los reportes oficiales requeridos por las autoridades educativas."
            breadcrumbCurrent="Reportes oficiales"
            largeTitle
            metrics={metrics}
            error={error || undefined}
            showSplit={false}
            actions={
                <>
                    <EsHeaderAction to="/app/educacion-superior/reportes-oficiales" icon="plus" label="Generar reporte" variant="primary" />
                    <EsHeaderAction icon="pdf" label="Exportar PDF" />
                    <EsHeaderAction icon="excel" label="Exportar Excel" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
        >
            <div style={esTheme.splitLayout}>
                <EsCard overflowHidden>
                    <div style={esTheme.cardHeaderLg}>
                        <div>
                            <h3 style={esTheme.sectionTitle}>Listado de reportes oficiales</h3>
                            <p style={esTheme.sectionSubtitle}>Reportes institucionales y estadísticos oficiales</p>
                        </div>
                        <Link to="/app/admin/reportes-basicos" style={esTheme.linkAccentMd}>
                            Ver todos
                        </Link>
                    </div>
                    <EsTable
                        headers={TABLE_HEADERS}
                        emptyColSpan={TABLE_HEADERS.length}
                        emptyMessage={
                            reportes.length === 0 ? 'No hay reportes configurados en el catálogo.' : null
                        }
                    >
                        {reportes.map((r) => (
                            <ReporteRow key={r.clave} r={r} />
                        ))}
                    </EsTable>
                </EsCard>

                <EsSidePanel title="Indicadores">
                    <div style={esTheme.sidebarStackSm}>
                        {indicadores.length === 0 ? (
                            <p style={esTheme.emptyHint}>Sin indicadores disponibles</p>
                        ) : (
                            indicadores.map((item) => (
                                <EsProgressBar
                                    key={item.title}
                                    label={item.title}
                                    value={item.value}
                                    total={item.total}
                                    barColor={item.color}
                                />
                            ))
                        )}
                    </div>
                </EsSidePanel>
            </div>
        </EsPageLayout>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { catalogosApi } from '../../api/catalogos';
import {
    EsCard,
    EsHeaderAction,
    EsIcons,
    EsPageLayout,
    EsSearchInput,
    EsSidePanel,
    EsStatusBadge,
    EsTable,
    esColors,
    esMetricTones,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';
import { useEducacionSuperiorMetricas } from '../../hooks/useEducacionSuperiorMetricas';
import { fetchEducacionSuperiorCatalog } from '../../lib/educacionSuperiorCache';

const TABLE_HEADERS = ['Plan', 'Versión', 'Programa', 'Créditos', 'Materias', 'Estatus', 'Acciones'];
const ROW_ACTION_ICONS = ['eye', 'pencil', 'compare'];

function estatusPlan(plan) {
    if (plan.estatus === 'vigente' || plan.activo === true) {
        return <EsStatusBadge color="green">Vigente</EsStatusBadge>;
    }
    if ((plan.materias ?? 0) === 0) {
        return <EsStatusBadge color="red">Pendiente</EsStatusBadge>;
    }
    return <EsStatusBadge color="yellow">En revisión</EsStatusBadge>;
}

export function EsPlanesPage() {
    const { metricas: metricasDash } = useEducacionSuperiorMetricas();
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        fetchEducacionSuperiorCatalog('planes-estudio', () => catalogosApi.planesEstudio())
            .then((planesRes) => {
                if (cancelled) return;
                setPlanes(Array.isArray(planesRes?.data) ? planesRes.data : []);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudieron cargar los planes de estudio.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const stats = useMemo(() => {
        const vigentes = planes.filter((p) => p.estatus === 'vigente' || p.activo === true).length;
        const enRevision = planes.filter((p) => p.estatus !== 'vigente' && p.activo !== true).length;
        const materiasTotal = planes.reduce((sum, p) => sum + (Number(p.materias) || 0), 0);
        const pendientes = planes.filter((p) => (p.materias ?? 0) === 0 || !p.activo).length;
        return { vigentes, enRevision, materiasTotal, pendientes };
    }, [planes]);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return planes;
        return planes.filter((p) =>
            [p.nombre, p.clave, p.version, p.programa, p.programa_clave].filter(Boolean).join(' ').toLowerCase().includes(q),
        );
    }, [planes, search]);

    const porPrograma = useMemo(() => {
        const counts = {};
        for (const p of planes) {
            const label = String(p.programa ?? '').trim() || 'Sin programa';
            counts[label] = (counts[label] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [planes]);

    const historial = useMemo(() => [...planes].slice(0, 4), [planes]);

    const metrics = [
        { iconKey: 'book', ...esMetricTones.blue, title: 'Planes vigentes', value: formatEsNum(metricasDash.planes_estudio_vigentes ?? stats.vigentes), trend: 'Catálogo vigente', trendPrefix: '' },
        { iconKey: 'clock', ...esMetricTones.yellow, title: 'Planes en revisión', value: formatEsNum(stats.enRevision), trend: 'Planes inactivos', trendPrefix: '' },
        { iconKey: 'graduation', ...esMetricTones.purple, title: 'Materias asociadas', value: formatEsNum(stats.materiasTotal), trend: 'En plan_materias', trendPrefix: '' },
        { iconKey: 'alert', ...esMetricTones.red, title: 'Actualizaciones pendientes', value: formatEsNum(stats.pendientes), trend: 'Sin materias o inactivos', trendPrefix: '' },
    ];

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando planes de estudio..." title="" />;
    }

    if (error && planes.length === 0) {
        return <EsPageLayout error={error} title="Planes de estudio" breadcrumbCurrent="Planes de estudio" largeTitle />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Planes de estudio"
            title="Planes de estudio"
            largeTitle
            metrics={metrics}
            metricsWide
            error={error || undefined}
            actions={
                <>
                    <EsHeaderAction to="/app/admin/catalogos" icon="plus" label="Nuevo plan" variant="primary" />
                    <EsHeaderAction icon="book" label="Nueva versión" />
                    <EsHeaderAction icon="export" label="Exportar" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
            sidebar={
                <>
                    <EsSidePanel title="Historial de versiones">
                        {historial.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin planes en el catálogo.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {historial.map((plan) => (
                                    <div key={plan.id}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: esColors.text }}>{plan.nombre}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>
                                            Versión {plan.version || plan.clave} · {plan.programa}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </EsSidePanel>
                    <EsSidePanel title="Distribución por programa">
                        {porPrograma.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin datos de distribución.</p>
                        ) : (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {porPrograma.map(([label, count]) => (
                                    <li key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#475569', paddingRight: 8 }}>{label}</span>
                                        <span style={{ fontWeight: 700, color: esColors.text }}>{formatEsNum(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </EsSidePanel>
                </>
            }
        >
            <EsCard overflowHidden>
                <div style={esTheme.cardHeader}>
                    <h3 style={esTheme.sectionTitle}>Listado de planes de estudio</h3>
                    <EsSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar plan o programa..." />
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={
                        filtrados.length === 0
                            ? search.trim()
                                ? 'No hay planes que coincidan con la búsqueda.'
                                : 'No hay planes de estudio registrados.'
                            : null
                    }
                >
                    {filtrados.map((plan) => (
                        <tr key={plan.id} style={esTheme.tr}>
                            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{plan.nombre}</td>
                            <td style={esTheme.td}>
                                <EsStatusBadge color="blue">{plan.version || plan.clave || '—'}</EsStatusBadge>
                            </td>
                            <td style={{ ...esTheme.td, color: esColors.muted }}>{plan.programa || '—'}</td>
                            <td style={{ ...esTheme.td, color: esColors.text }}>{formatEsNum(plan.creditos)}</td>
                            <td style={{ ...esTheme.td, color: esColors.text }}>{formatEsNum(plan.materias)}</td>
                            <td style={esTheme.td}>{estatusPlan(plan)}</td>
                            <td style={{ ...esTheme.td, textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                    {ROW_ACTION_ICONS.map((icon) => (
                                        <button key={icon} type="button" style={esTheme.iconBtn} title={icon}>
                                            {EsIcons[icon]}
                                        </button>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </EsTable>
                <div style={esTheme.cardFooter}>
                    Mostrando {formatEsNum(filtrados.length)} de {formatEsNum(planes.length)} planes
                </div>
            </EsCard>
        </EsPageLayout>
    );
}

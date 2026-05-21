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

const TABLE_HEADERS = ['Clave', 'Programa', 'Nivel', 'Institución', 'Estatus', 'Acciones'];
const ROW_ACTION_ICONS = ['eye', 'pencil', 'link'];

function estatusPrograma(estatus) {
    if (estatus === 'activo') {
        return <EsStatusBadge color="green">Activo</EsStatusBadge>;
    }
    return <EsStatusBadge color="yellow">Inactivo</EsStatusBadge>;
}

function nivelBadgeColor(nivelClave) {
    const c = String(nivelClave ?? '').toUpperCase();
    if (c.includes('LIC') || c.includes('LICEN')) return 'purple';
    if (c.includes('MAE') || c.includes('POS')) return 'blue';
    return 'purple';
}

export function EsProgramasPage() {
    const { metricas: metricasDash } = useEducacionSuperiorMetricas();
    const [programas, setProgramas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        fetchEducacionSuperiorCatalog('programas', () => catalogosApi.programas())
            .then((progRes) => {
                if (cancelled) return;
                setProgramas(Array.isArray(progRes?.data) ? progRes.data : []);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudieron cargar los programas académicos.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const stats = useMemo(() => {
        const activos = programas.filter((p) => p.estatus === 'activo' || p.activo === true).length;
        const enRevision = programas.filter((p) => p.estatus === 'inactivo' || p.activo === false).length;
        const planesVigentes = programas.reduce((sum, p) => sum + (Number(p.planes_vigentes) || 0), 0);
        return { activos, enRevision, planesVigentes };
    }, [programas]);

    const filtrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return programas;
        return programas.filter((p) =>
            [p.clave, p.nombre, p.nivel, p.institucion, p.subsistema].filter(Boolean).join(' ').toLowerCase().includes(q),
        );
    }, [programas, search]);

    const porNivel = useMemo(() => {
        const counts = {};
        for (const p of programas) {
            const label = String(p.nivel ?? '').trim() || 'Sin nivel';
            counts[label] = (counts[label] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [programas]);

    const recientes = useMemo(() => [...programas].slice(0, 5), [programas]);

    const metrics = [
        { iconKey: 'graduation', ...esMetricTones.blue, title: 'Programas activos', value: formatEsNum(stats.activos), trend: 'Catálogo vigente', trendPrefix: '' },
        { iconKey: 'clock', ...esMetricTones.yellow, title: 'En revisión', value: formatEsNum(stats.enRevision), trend: 'Programas inactivos', trendPrefix: '' },
        { iconKey: 'file', ...esMetricTones.green, title: 'Planes vigentes', value: formatEsNum(metricasDash.planes_estudio_vigentes ?? stats.planesVigentes), trend: 'Asociados a programas', trendPrefix: '' },
        { iconKey: 'users', ...esMetricTones.purple, title: 'Matrícula total', value: formatEsNum(metricasDash.alumnos_activos ?? 0), trend: 'Alumnos activos', trendPrefix: '' },
    ];

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando programas académicos..." title="" />;
    }

    if (error && programas.length === 0) {
        return <EsPageLayout error={error} title="Programas académicos" breadcrumbCurrent="Programas académicos" largeTitle />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Programas académicos"
            title="Programas académicos"
            subtitle="Administración de programas académicos registrados en el sistema."
            largeTitle
            metrics={metrics}
            metricsWide
            error={error || undefined}
            showSplit={false}
            actions={
                <>
                    <EsHeaderAction to="/app/programas/nuevo" icon="plus" label="Nuevo programa" variant="primary" />
                    <EsHeaderAction icon="link" label="Asignar institución" />
                    <EsHeaderAction icon="export" label="Exportar" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
        >
            <EsCard overflowHidden>
                <div style={esTheme.cardHeader}>
                    <EsSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar programa..." width={320} />
                    <span style={{ fontSize: 12, color: esColors.muted, alignSelf: 'center' }}>
                        {formatEsNum(filtrados.length)} de {formatEsNum(programas.length)} programas
                    </span>
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={
                        filtrados.length === 0
                            ? search.trim()
                                ? 'No hay programas que coincidan con la búsqueda.'
                                : 'No hay programas registrados.'
                            : null
                    }
                >
                    {filtrados.map((prog) => (
                        <tr key={prog.id} style={esTheme.tr}>
                            <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{prog.clave || '—'}</td>
                            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{prog.nombre}</td>
                            <td style={esTheme.td}>
                                <EsStatusBadge color={nivelBadgeColor(prog.nivel_clave)}>{prog.nivel || '—'}</EsStatusBadge>
                            </td>
                            <td style={{ ...esTheme.td, color: esColors.muted }}>{prog.institucion || '—'}</td>
                            <td style={esTheme.td}>{estatusPrograma(prog.estatus)}</td>
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
                    Mostrando {formatEsNum(filtrados.length)} de {formatEsNum(programas.length)} programas
                </div>
            </EsCard>

            <div style={esTheme.panelsGrid}>
                <EsSidePanel title="Programas por nivel">
                    {porNivel.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin datos de distribución.</p>
                    ) : (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {porNivel.map(([label, count]) => (
                                <li key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: '#475569', paddingRight: 8 }}>{label}</span>
                                    <span style={{ fontWeight: 700, color: esColors.text }}>{formatEsNum(count)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </EsSidePanel>
                <EsSidePanel title="Cambios recientes">
                    {recientes.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin programas en el catálogo.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {recientes.map((p) => (
                                <div key={p.id}>
                                    <p style={{ margin: 0, fontSize: 13, color: esColors.text, fontWeight: 500 }}>{p.nombre}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>
                                        {p.clave} · {p.estatus === 'activo' ? 'Activo' : 'Inactivo'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </EsSidePanel>
            </div>
        </EsPageLayout>
    );
}

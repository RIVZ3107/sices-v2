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

const TABLE_HEADERS = ['CCT', 'Sede / Plantel', 'Institución', 'Estatus', 'Acciones'];

function estatusBadge(estatus) {
    if (estatus === 'A') {
        return <EsStatusBadge color="green">Activa</EsStatusBadge>;
    }
    if (estatus === 'B') {
        return <EsStatusBadge color="red">Baja</EsStatusBadge>;
    }
    return <EsStatusBadge color="yellow">{estatus || '—'}</EsStatusBadge>;
}

function sedeRequiereValidacion(sede) {
    const cct = String(sede?.cct ?? '').trim();
    const municipio = String(sede?.municipio_nombre ?? '').trim();
    return !cct || !municipio;
}

export function EsSedesPage() {
    const { metricas: metricasDash } = useEducacionSuperiorMetricas();
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        fetchEducacionSuperiorCatalog('sedes', () => catalogosApi.sedes())
            .then((sedRes) => {
                if (cancelled) return;
                setSedes(Array.isArray(sedRes?.data) ? sedRes.data : []);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudieron cargar las sedes.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const stats = useMemo(() => {
        const activas = sedes.filter((s) => s.estatus === 'A').length;
        const conCct = sedes.filter((s) => String(s.cct ?? '').trim()).length;
        const porValidar = sedes.filter(sedeRequiereValidacion).length;
        const inactivas = sedes.filter((s) => s.estatus === 'B').length;
        return { activas, conCct, porValidar, inactivas };
    }, [sedes]);

    const filtradas = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return sedes;
        return sedes.filter((s) =>
            [s.cct, s.nombre, s.institucion, s.subsistema, s.municipio_nombre].filter(Boolean).join(' ').toLowerCase().includes(q),
        );
    }, [sedes, search]);

    const distribucionRegion = useMemo(() => {
        const counts = {};
        for (const s of sedes) {
            const label = String(s.municipio_nombre ?? '').trim() || 'Sin municipio';
            counts[label] = (counts[label] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [sedes]);

    const validacionesProximas = useMemo(() => sedes.filter(sedeRequiereValidacion).slice(0, 4), [sedes]);

    const metrics = [
        { iconKey: 'building', ...esMetricTones.blue, title: 'Sedes activas', value: formatEsNum(stats.activas), trend: 'Catálogo vigente', trendPrefix: '' },
        { iconKey: 'shield', ...esMetricTones.yellow, title: 'Planteles por validar', value: formatEsNum(stats.porValidar), trend: 'Sin CCT o municipio', trendPrefix: '' },
        { iconKey: 'mapPin', ...esMetricTones.green, title: 'CCT registrados', value: formatEsNum(stats.conCct), trend: 'Con clave de centro de trabajo', trendPrefix: '' },
        { iconKey: 'alert', ...esMetricTones.red, title: 'Incidencias', value: formatEsNum(metricasDash.alertas_normativas ?? stats.inactivas), trend: 'Bajas o alertas normativas', trendPrefix: '' },
    ];

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando sedes y planteles..." title="" />;
    }

    if (error && sedes.length === 0) {
        return <EsPageLayout error={error} title="Sedes y planteles" breadcrumbCurrent="Sedes / Planteles" largeTitle />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Sedes / Planteles"
            title="Sedes y planteles"
            largeTitle
            metrics={metrics}
            metricsWide
            error={error || undefined}
            actions={
                <>
                    <EsHeaderAction to="/app/sedes/nueva" icon="plus" label="Nueva sede" variant="primary" />
                    <EsHeaderAction icon="user" label="Asignar responsable" />
                    <EsHeaderAction icon="export" label="Exportar" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
            sidebar={
                <>
                    <EsSidePanel title="Distribución por municipio">
                        {distribucionRegion.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin datos de distribución.</p>
                        ) : (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {distribucionRegion.map(([label, count]) => (
                                    <li key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#475569', paddingRight: 8 }}>{label}</span>
                                        <span style={{ fontWeight: 700, color: esColors.text }}>{formatEsNum(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </EsSidePanel>
                    <EsSidePanel title="Validaciones próximas">
                        {validacionesProximas.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>No hay planteles pendientes de validación.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {validacionesProximas.map((sede) => (
                                    <div key={sede.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: esColors.text }}>{sede.nombre}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>{sede.cct || 'Sin CCT'}</p>
                                        </div>
                                        <EsStatusBadge color="yellow">Por validar</EsStatusBadge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </EsSidePanel>
                </>
            }
        >
            <EsCard overflowHidden>
                <div style={esTheme.cardHeader}>
                    <EsSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sede o CCT..." width={320} />
                    <span style={{ fontSize: 12, color: esColors.muted }}>
                        {formatEsNum(filtradas.length)} de {formatEsNum(sedes.length)} resultados
                    </span>
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={
                        filtradas.length === 0
                            ? search.trim()
                                ? 'No hay sedes que coincidan con la búsqueda.'
                                : 'No hay sedes registradas.'
                            : null
                    }
                >
                    {filtradas.map((sede) => (
                        <tr key={sede.id} style={esTheme.tr}>
                            <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{sede.cct || '—'}</td>
                            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{sede.nombre}</td>
                            <td style={{ ...esTheme.td, color: esColors.muted }}>{sede.institucion || '—'}</td>
                            <td style={esTheme.td}>{estatusBadge(sede.estatus)}</td>
                            <td style={{ ...esTheme.td, textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                    <button type="button" style={esTheme.iconBtn} title="Ver detalle">{EsIcons.eye}</button>
                                    <button type="button" style={esTheme.iconBtn} title="Editar">{EsIcons.pencil}</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </EsTable>
                <div style={esTheme.cardFooter}>
                    Mostrando {formatEsNum(filtradas.length)} de {formatEsNum(sedes.length)} registros
                </div>
            </EsCard>
        </EsPageLayout>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const TABLE_HEADERS = ['Clave', 'Institución', 'Subsistema', 'Estatus', 'Acciones'];

function subsistemaLabel(subsistemasMap, subsistemaId) {
    if (!subsistemaId) return '—';
    return subsistemasMap[subsistemaId] ?? `Subsistema #${subsistemaId}`;
}

export function EsInstitucionesPage() {
    const { metricas: metricasEs } = useEducacionSuperiorMetricas();
    const [instituciones, setInstituciones] = useState([]);
    const [subsistemasMap, setSubsistemasMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Promise.all([
            fetchEducacionSuperiorCatalog('instituciones', () => catalogosApi.instituciones()),
            fetchEducacionSuperiorCatalog('subsistemas', () => catalogosApi.subsistemas()),
        ])
            .then(([insRes, subRes]) => {
                if (cancelled) return;
                const ins = Array.isArray(insRes?.data) ? insRes.data : [];
                const subs = Array.isArray(subRes?.data) ? subRes.data : [];
                setInstituciones(ins);
                setSubsistemasMap(
                    Object.fromEntries(
                        subs.map((s) => [s.id, s.nombre || s.nombre_corto || s.clave || `Subsistema ${s.id}`]),
                    ),
                );
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudieron cargar las instituciones.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const filtradas = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return instituciones;
        return instituciones.filter((item) => {
            const sub = subsistemaLabel(subsistemasMap, item.subsistema_id).toLowerCase();
            return (
                String(item.clave ?? '').toLowerCase().includes(q)
                || String(item.nombre ?? '').toLowerCase().includes(q)
                || sub.includes(q)
            );
        });
    }, [instituciones, search, subsistemasMap]);

    const distribucionSubsistema = useMemo(() => {
        const counts = {};
        for (const item of instituciones) {
            const label = subsistemaLabel(subsistemasMap, item.subsistema_id);
            counts[label] = (counts[label] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [instituciones, subsistemasMap]);

    const metrics = [
        { iconKey: 'building', ...esMetricTones.blue, title: 'Instituciones activas', value: formatEsNum(instituciones.length), trend: 'Catálogo vigente', trendPrefix: '' },
        { iconKey: 'mapPin', ...esMetricTones.teal, title: 'Sedes registradas', value: formatEsNum(metricasEs.sedes_registradas ?? 0), trend: 'Registro nacional', trendPrefix: '' },
        { iconKey: 'graduationCap', ...esMetricTones.purple, title: 'Programas asociados', value: formatEsNum(metricasEs.programas_academicos_vigentes ?? 0), trend: 'Programas vigentes', trendPrefix: '' },
        { iconKey: 'alert', ...esMetricTones.red, title: 'Alertas institucionales', value: formatEsNum(metricasEs.alertas_normativas ?? 0), trend: 'Validación normativa', trendPrefix: '' },
    ];

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando instituciones..." title="" />;
    }

    if (error && instituciones.length === 0) {
        return <EsPageLayout error={error} title="Gestión de instituciones" breadcrumbCurrent="Instituciones" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Instituciones"
            title="Gestión de instituciones"
            metrics={metrics}
            metricsWide
            error={error || undefined}
            actions={
                <>
                    <Link to="/app/instituciones/nueva" style={esTheme.btnPrimary}>
                        {EsIcons.plus} Nueva institución
                    </Link>
                    <EsHeaderAction icon="upload" label="Importar" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
            sidebar={
                <>
                    <EsSidePanel title="Distribución por subsistema">
                        {distribucionSubsistema.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin datos de distribución.</p>
                        ) : (
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {distribucionSubsistema.map(([label, count]) => (
                                    <li key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: '#475569', paddingRight: 8 }}>{label}</span>
                                        <span style={{ fontWeight: 700, color: esColors.text }}>{formatEsNum(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </EsSidePanel>
                    <EsSidePanel title="Actividad reciente">
                        <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                            Catálogo cargado desde la base de datos ({formatEsNum(instituciones.length)} instituciones activas).
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>Actualizado al abrir la vista</p>
                    </EsSidePanel>
                </>
            }
        >
            <EsCard overflowHidden>
                <div
                    style={{
                        padding: 16,
                        borderBottom: `1px solid ${esColors.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <EsSearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar institución..." />
                    <span style={{ fontSize: 12, color: esColors.muted, alignSelf: 'center' }}>
                        {formatEsNum(filtradas.length)} de {formatEsNum(instituciones.length)} registros
                    </span>
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={
                        filtradas.length === 0
                            ? search.trim()
                                ? 'No hay instituciones que coincidan con la búsqueda.'
                                : 'No hay instituciones registradas.'
                            : null
                    }
                >
                    {filtradas.map((item) => (
                        <tr key={item.id} style={esTheme.tr}>
                            <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{item.clave || '—'}</td>
                            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{item.nombre}</td>
                            <td style={{ ...esTheme.td, color: esColors.muted }}>{subsistemaLabel(subsistemasMap, item.subsistema_id)}</td>
                            <td style={esTheme.td}>
                                <EsStatusBadge status="activa">Activa</EsStatusBadge>
                            </td>
                            <td style={{ ...esTheme.td, textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                    <button type="button" style={esTheme.iconBtn} title="Ver detalle">
                                        {EsIcons.eye}
                                    </button>
                                    <button type="button" style={esTheme.iconBtn} title="Editar">
                                        {EsIcons.pencil}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </EsTable>
            </EsCard>
        </EsPageLayout>
    );
}

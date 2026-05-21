import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
import { EsCard, EsHeaderAction, EsPageLayout, EsProgressBar, EsSearchInput, EsSidePanel, EsStatusBadge, EsTable, esColors, esMetricTones, esTheme, formatEsNum } from '../../components/educacionSuperior';
import { useEducacionSuperiorMetricas } from '../../hooks/useEducacionSuperiorMetricas';

const TABLE_HEADERS = ['Folio', 'Alumno', 'Institución', 'Programa', 'Fase actual', 'Estatus', 'Acciones'];

const TIPO_DOC_LABELS = {
    certificado: 'Certificado',
    titulo: 'Título',
    constancia: 'Constancia',
    kardex: 'Kardex',
};

function labelTipoDocumento(tipo) {
    if (!tipo) return '—';
    return TIPO_DOC_LABELS[tipo] ?? String(tipo).replace(/_/g, ' ');
}

function faseCertificacion(d) {
    if (d.estado_firma === 'firmado') {
        return { label: 'Documento firmado', color: 'green' };
    }
    if (d.listo_para_firma) {
        return { label: 'Listo para firma', color: 'purple' };
    }
    if (d.estado_workflow === 'aprobado' && !d.folio_interno) {
        return { label: 'Asignación folio', color: 'purple' };
    }
    if (d.estado_workflow === 'aprobado') {
        return { label: 'Revisión documental', color: 'yellow' };
    }
    if (d.estado_workflow === 'rechazado') {
        return { label: 'Incidencia normativa', color: 'red' };
    }
    return { label: 'Validación expediente', color: 'blue' };
}

function estatusCertificacion(d) {
    if (d.estado_firma === 'firmado') {
        return { label: 'Completado', color: 'green' };
    }
    if (d.estado_workflow === 'rechazado') {
        return { label: 'Observado', color: 'red' };
    }
    if (d.estado_workflow === 'cancelado') {
        return { label: 'Cancelado', color: 'red' };
    }
    return { label: 'En proceso', color: 'blue' };
}

function mapDocumentoToRow(d) {
    const fase = faseCertificacion(d);
    const estatus = estatusCertificacion(d);

    return {
        key: `doc-${d.id}`,
        folio: d.folio_interno || `DOC-${d.id}`,
        alumno: d.alumno?.nombre ?? '—',
        institucion: d.institucion?.nombre ?? '—',
        programa: labelTipoDocumento(d.tipo_documento),
        fase: fase.label,
        faseColor: fase.color,
        estado: estatus.label,
        estadoColor: estatus.color,
        href: `/app/documentos/${d.id}`,
        updated_at: d.updated_at ?? d.created_at ?? '',
        searchBlob: [
            d.folio_interno,
            d.alumno?.nombre,
            d.institucion?.nombre,
            d.tipo_documento,
        ].filter(Boolean).join(' ').toLowerCase(),
    };
}

function CertificacionRow({ item }) {
    return (
        <tr style={esTheme.tr}>
            <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{item.folio}</td>
            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{item.alumno}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{item.institucion}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{item.programa}</td>
            <td style={esTheme.td}>
                <EsStatusBadge color={item.faseColor}>{item.fase}</EsStatusBadge>
            </td>
            <td style={esTheme.td}>
                <EsStatusBadge color={item.estadoColor}>{item.estado}</EsStatusBadge>
            </td>
            <td style={{ ...esTheme.td, textAlign: 'center' }}>
                <Link to={item.href} style={esTheme.iconBtn} title="Ver documento">
                    {EsIcons.eye}
                </Link>
            </td>
        </tr>
    );
}

export function EsCertificacionPage() {
    const { metricas: resumen } = useEducacionSuperiorMetricas();
    const [filas, setFilas] = useState([]);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Promise.all([
            bandejasApi.listar('aprobados', { per_page: 25, page: 1 }),
            bandejasApi.listar('listos-para-firma', { per_page: 25, page: 1 }),
        ])
            .then(([aprobadosRes, listosRes]) => {
                if (cancelled) return;

                const aprobados = Array.isArray(aprobadosRes?.data) ? aprobadosRes.data : [];
                const listos = Array.isArray(listosRes?.data) ? listosRes.data : [];

                const porId = new Map();
                [...aprobados, ...listos].forEach((d) => porId.set(d.id, d));
                const merged = [...porId.values()]
                    .map(mapDocumentoToRow)
                    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));

                const totalAprob = Number(aprobadosRes?.meta?.total ?? aprobados.length);
                const totalListos = Number(listosRes?.meta?.total ?? listos.length);

                setFilas(merged);
                setTotalRegistros(totalAprob + totalListos);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e?.message ?? 'No se pudo cargar la supervisión de certificación.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const filasFiltradas = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return filas;
        return filas.filter((f) => f.searchBlob.includes(q));
    }, [filas, search]);

    const metricas = useMemo(() => {
        const egreso = Number(resumen.egresados_candidatos ?? 0);
        const aprobados = Number(resumen.aprobados ?? 0);
        const listosFirma = Number(resumen.listos_para_firma ?? 0);
        const emitidos = Number(resumen.documentos_emitidos ?? resumen.certificados_emitidos_referencia ?? 0);
        const incidencias = Number(resumen.rechazados ?? 0) + Number(resumen.cancelados ?? 0);

        return [
            { iconKey: 'users', ...esMetricTones.blue, title: 'Candidatos a egreso', value: formatEsNum(egreso), trend: 'Trayectorias consolidadas o listas para certificación', trendPrefix: '' },
            { iconKey: 'file', ...esMetricTones.teal, title: 'Documentos aprobados', value: formatEsNum(aprobados), trend: 'Aprobados institucionalmente (asignación de folio)', trendPrefix: '' },
            { iconKey: 'code', ...esMetricTones.purple, title: 'Listos para firma', value: formatEsNum(listosFirma), trend: 'Preparados para proceso técnico de emisión', trendPrefix: '' },
            { iconKey: 'sign', ...esMetricTones.yellow, title: 'Documentos emitidos', value: formatEsNum(emitidos), trend: 'Referencia de documentos firmados en el sistema', trendPrefix: '' },
            { iconKey: 'alert', ...esMetricTones.red, title: 'Incidencias', value: formatEsNum(incidencias), trend: 'Rechazados y cancelados en bandeja', trendPrefix: '' },
        ];
    }, [resumen]);

    const distribucionEstatus = useMemo(() => {
        const items = [
            { label: 'Aprobados', value: Number(resumen.aprobados ?? 0), color: '#0F6E56' },
            { label: 'Listos para firma', value: Number(resumen.listos_para_firma ?? 0), color: '#534AB7' },
            { label: 'Pendientes de revisión', value: Number(resumen.pendientes_revision ?? 0), color: '#185FA5' },
            { label: 'Observados / rechazados', value: Number(resumen.rechazados ?? 0), color: '#DC2626' },
        ];
        const total = items.reduce((s, i) => s + i.value, 0);
        return { items, total };
    }, [resumen]);

    const prioridades = useMemo(() => {
        const aprobados = Number(resumen.aprobados ?? 0);
        const listos = Number(resumen.listos_para_firma ?? 0);
        const sinFolio = Math.max(0, aprobados - listos);

        return [
            {
                titulo: 'Expedientes con incidencia',
                detalle: `${formatEsNum(resumen.rechazados ?? 0)} documentos rechazados`,
                color: '#DC2626',
                to: '/app/documentos/bandejas/rechazados',
            },
            {
                titulo: 'Pendientes de asignar folio',
                detalle: `${formatEsNum(sinFolio)} aprobados sin marcar listos para firma`,
                color: '#BA7517',
                to: '/app/documentos/bandejas/aprobados',
            },
            {
                titulo: 'Pendientes de firma',
                detalle: `${formatEsNum(listos)} en bandeja listos para firma`,
                color: '#534AB7',
                to: '/app/documentos/bandejas/listos-para-firma',
            },
        ];
    }, [resumen]);

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando supervisión de certificación..." title="" />;
    }

    if (error && filas.length === 0 && Object.keys(resumen).length === 0) {
        return <EsPageLayout error={error} title="Supervisión de certificación" breadcrumbCurrent="Certificación" largeTitle />;
    }

    const mostrando = filasFiltradas.length;
    const desde = mostrando > 0 ? 1 : 0;
    const hasta = mostrando;

    return (
        <EsPageLayout
            breadcrumbCurrent="Certificación"
            title="Supervisión de certificación"
            largeTitle
            metrics={metricas}
            error={error || undefined}
            actions={
                <>
                    <EsHeaderAction to="/app/documentos/bandejas/pendientes-revision" icon="validate" label="Validar expediente" variant="primary" />
                    <EsHeaderAction to="/app/documentos/bandejas/aprobados" icon="assign" label="Asignar folio" variant="primary" />
                    <EsHeaderAction to="/app/documentos/bandejas/listos-para-firma" icon="send" label="Enviar a firma" variant="primary" />
                    <EsHeaderAction to="/app/documentos/bandejas/aprobados" icon="export" label="Ver aprobados" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
            sidebar={
                <>
                    <EsSidePanel title="Estatus de certificación">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {distribucionEstatus.total === 0 ? (
                                <p style={{ margin: 0, fontSize: 13, color: esColors.muted, textAlign: 'center' }}>Sin datos en bandejas</p>
                            ) : (
                                distribucionEstatus.items.map((item) => (
                                    <EsProgressBar
                                        key={item.label}
                                        label={item.label}
                                        value={item.value}
                                        total={distribucionEstatus.total}
                                        barColor={item.color}
                                    />
                                ))
                            )}
                        </div>
                    </EsSidePanel>
                    <EsSidePanel title="Acciones prioritarias">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {prioridades.map((p) => (
                                <div key={p.titulo}>
                                    <Link to={p.to} style={{ margin: 0, fontSize: 13, fontWeight: 600, color: p.color, textDecoration: 'none' }}>
                                        {p.titulo}
                                    </Link>
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>{p.detalle}</p>
                                </div>
                            ))}
                        </div>
                    </EsSidePanel>
                </>
            }
        >
            <EsCard overflowHidden>
                <div style={esTheme.cardHeader}>
                    <div>
                        <h3 style={esTheme.sectionTitle}>Seguimiento de certificación</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: esColors.muted }}>
                            {formatEsNum(totalRegistros)} registros en flujo de certificación
                        </p>
                    </div>
                    <EsSearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por folio, alumno o institución..."
                        width={320}
                    />
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={
                        filasFiltradas.length === 0
                            ? search.trim()
                                ? 'Sin resultados para la búsqueda.'
                                : 'No hay documentos en el flujo de certificación.'
                            : null
                    }
                >
                    {filasFiltradas.map((item) => (
                        <CertificacionRow key={item.key} item={item} />
                    ))}
                </EsTable>
                <div style={esTheme.cardFooterBetween}>
                    <span>
                        Mostrando {desde} a {hasta} de {formatEsNum(totalRegistros)} registros
                    </span>
                    <Link to="/app/documentos/bandejas/aprobados" style={esTheme.linkAccent}>
                        Ver bandeja de aprobados →
                    </Link>
                </div>
            </EsCard>
        </EsPageLayout>
    );
}

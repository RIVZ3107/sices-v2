import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
import { solicitudesMatriculaApi } from '../../api/solicitudesMatricula';
import {
    EsCard,
    EsHeaderAction,
    EsIcons,
    EsPageLayout,
    EsSidePanel,
    EsStatusBadge,
    EsTable,
    esColors,
    esMetricTones,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';
import { useEducacionSuperiorMetricas } from '../../hooks/useEducacionSuperiorMetricas';
import { withTimeout } from '../../lib/withTimeout';

const TABLE_HEADERS = ['Folio', 'Tipo', 'Institución', 'Alumno', 'Prioridad', 'Estado', 'Acciones'];

const ESTADOS_SOLICITUD_ACTIVOS = new Set(['enviada', 'en_revision', 'con_observaciones']);

const ESTADO_DOC_LABELS = {
    pendiente: 'Pendiente',
    en_revision: 'En revisión',
    rechazado: 'Observado',
    aprobado: 'Aprobado',
    cancelado: 'Cancelado',
};

const ESTADO_SOL_LABELS = {
    enviada: 'Pendiente',
    en_revision: 'En revisión',
    con_observaciones: 'Observado',
    aprobada: 'Aprobada',
    matricula_asignada: 'Matrícula asignada',
    rechazada: 'Rechazada',
};

const TIPO_DOC_LABELS = {
    certificado: 'Certificación',
    titulo: 'Título',
    constancia: 'Documento',
    kardex: 'Expediente',
};

function nombreAlumnoSolicitud(r) {
    if (r.alumno?.nombre && !r.alumno?.primer_apellido) {
        return r.alumno.nombre;
    }
    return [r.alumno?.nombre, r.alumno?.primer_apellido, r.alumno?.segundo_apellido].filter(Boolean).join(' ') || '—';
}

function prioridadDesdeDocumento(d) {
    const p = String(d.ultima_observacion?.prioridad ?? '').toLowerCase();
    if (p === 'alta' || p === 'urgente') return { label: 'Alta', color: 'red' };
    if (p === 'baja') return { label: 'Baja', color: 'green' };
    if (d.tiene_observaciones_pendientes) return { label: 'Alta', color: 'red' };
    return { label: 'Media', color: 'yellow' };
}

function colorEstadoDocumento(estado) {
    if (estado === 'aprobado') return 'green';
    if (estado === 'rechazado') return 'red';
    if (estado === 'en_revision') return 'blue';
    return 'yellow';
}

function colorEstadoSolicitud(estado) {
    if (estado === 'aprobada' || estado === 'matricula_asignada') return 'green';
    if (estado === 'rechazada') return 'red';
    if (estado === 'en_revision') return 'blue';
    return 'yellow';
}

function mapDocumentoToRow(d) {
    const { label: prioridad, color: prioridadColor } = prioridadDesdeDocumento(d);
    const estado = d.estado_workflow ?? 'pendiente';

    return {
        key: `doc-${d.id}`,
        folio: d.folio_interno || `DOC-${d.id}`,
        tipo: TIPO_DOC_LABELS[d.tipo_documento] ?? (d.tipo_documento ? String(d.tipo_documento) : 'Documento'),
        institucion: d.institucion?.nombre ?? '—',
        alumno: d.alumno?.nombre ?? '—',
        prioridad,
        prioridadColor,
        estado: ESTADO_DOC_LABELS[estado] ?? estado,
        estadoColor: colorEstadoDocumento(estado),
        href: `/app/documentos/${d.id}/validacion`,
        updated_at: d.updated_at ?? d.created_at ?? '',
    };
}

function mapSolicitudToRow(r) {
    if (r.origen === 'matricula' || !ESTADOS_SOLICITUD_ACTIVOS.has(r.estado)) {
        return null;
    }

    const estado = r.estado ?? 'enviada';

    return {
        key: `sol-${r.solicitud_id ?? r.id}`,
        folio: `SOL-${r.solicitud_id ?? r.id}`,
        tipo: 'Matrícula',
        institucion: r.institucion?.nombre ?? '—',
        alumno: nombreAlumnoSolicitud(r),
        prioridad: estado === 'con_observaciones' ? 'Alta' : estado === 'en_revision' ? 'Media' : 'Alta',
        prioridadColor: estado === 'con_observaciones' ? 'red' : estado === 'en_revision' ? 'blue' : 'yellow',
        estado: ESTADO_SOL_LABELS[estado] ?? estado,
        estadoColor: colorEstadoSolicitud(estado),
        href: '/app/solicitudes-matricula',
        updated_at: r.updated_at ?? '',
    };
}

function ValidacionRow({ item }) {
    return (
        <tr style={esTheme.tr}>
            <td style={{ ...esTheme.td, fontWeight: 600, color: esColors.primary }}>{item.folio}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{item.tipo}</td>
            <td style={{ ...esTheme.td, color: esColors.muted }}>{item.institucion}</td>
            <td style={{ ...esTheme.td, fontWeight: 500, color: esColors.text }}>{item.alumno}</td>
            <td style={esTheme.td}>
                <EsStatusBadge color={item.prioridadColor}>{item.prioridad}</EsStatusBadge>
            </td>
            <td style={esTheme.td}>
                <EsStatusBadge color={item.estadoColor}>{item.estado}</EsStatusBadge>
            </td>
            <td style={{ ...esTheme.td, textAlign: 'center' }}>
                {item.href ? (
                    <Link to={item.href} style={esTheme.iconBtn} title="Ver detalle">
                        {EsIcons.eye}
                    </Link>
                ) : (
                    <button type="button" style={esTheme.iconBtn}>{EsIcons.eye}</button>
                )}
            </td>
        </tr>
    );
}

async function cargarSolicitudesActivas() {
    const [enviadas, enRevision, observadas] = await Promise.all([
        solicitudesMatriculaApi.index({ estado: 'enviada' }),
        solicitudesMatriculaApi.index({ estado: 'en_revision' }),
        solicitudesMatriculaApi.index({ estado: 'con_observaciones' }),
    ]);

    const merged = [
        ...(Array.isArray(enviadas?.data) ? enviadas.data : []),
        ...(Array.isArray(enRevision?.data) ? enRevision.data : []),
        ...(Array.isArray(observadas?.data) ? observadas.data : []),
    ];

    return {
        solicitudes: merged,
        solObservadas: Array.isArray(observadas?.data) ? observadas.data.length : 0,
    };
}

export function EsValidacionesNormativasPage() {
    const { metricas: metricasEs } = useEducacionSuperiorMetricas();
    const [extraResumen, setExtraResumen] = useState({});
    const [cola, setCola] = useState([]);
    const [totalCola, setTotalCola] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const resumen = useMemo(
        () => ({ ...metricasEs, ...extraResumen }),
        [metricasEs, extraResumen],
    );

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        withTimeout(
            Promise.all([
                bandejasApi.listar('pendientes-revision', { per_page: 25, page: 1 }),
                cargarSolicitudesActivas(),
            ]),
            20000,
        )
            .then(([docsRes, solData]) => {
                if (cancelled) return;

                const docs = Array.isArray(docsRes?.data) ? docsRes.data : [];
                const solicitudes = solData.solicitudes;

                const filas = [
                    ...docs.map(mapDocumentoToRow),
                    ...solicitudes.map(mapSolicitudToRow).filter(Boolean),
                ]
                    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
                    .slice(0, 25);

                const totalDocs = Number(docsRes?.meta?.total ?? docs.length);
                const solActivas = solicitudes.filter((s) => ESTADOS_SOLICITUD_ACTIVOS.has(s.estado)).length;

                setExtraResumen({ solicitudes_con_observaciones_count: solData.solObservadas });
                setCola(filas);
                setTotalCola(totalDocs + solActivas);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e?.message ?? 'No se pudieron cargar las validaciones normativas.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const metricas = useMemo(() => {
        const pendientesRev = Number(resumen.pendientes_revision ?? 0);
        const solPend = Number(resumen.solicitudes_matricula_pendientes ?? 0);
        const solRev = Number(resumen.solicitudes_matricula_en_revision ?? 0);
        const rechazados = Number(resumen.rechazados ?? 0);
        const egreso = Number(resumen.egresados_candidatos ?? 0);
        const urgentes = cola.filter((c) => c.prioridad === 'Alta').length;

        return [
            { iconKey: 'folder', ...esMetricTones.blue, title: 'Expedientes por validar', value: formatEsNum(pendientesRev), trend: 'Documentos en bandeja pendientes de revisión', trendPrefix: '' },
            { iconKey: 'check', ...esMetricTones.green, title: 'Matrículas en revisión', value: formatEsNum(solPend + solRev), trend: `${formatEsNum(solPend)} enviadas · ${formatEsNum(solRev)} en revisión`, trendPrefix: '' },
            { iconKey: 'graduation', ...esMetricTones.purple, title: 'Egreso', value: formatEsNum(egreso), trend: 'Candidatos a egreso (trayectoria consolidada)', trendPrefix: '' },
            { iconKey: 'file', ...esMetricTones.yellow, title: 'Documentos observados', value: formatEsNum(rechazados), trend: 'Bandeja de documentos rechazados u observados', trendPrefix: '' },
            { iconKey: 'alert', ...esMetricTones.red, title: 'Urgentes', value: formatEsNum(urgentes), trend: 'Prioridad alta en la cola visible', trendPrefix: '' },
        ];
    }, [resumen, cola]);

    const tiposValidacion = useMemo(() => {
        const solActivas =
            Number(resumen.solicitudes_matricula_pendientes ?? 0)
            + Number(resumen.solicitudes_matricula_en_revision ?? 0);

        return [
            { tipo: 'Expediente', count: Number(resumen.pendientes_revision ?? 0) },
            { tipo: 'Matrícula', count: solActivas },
            { tipo: 'Egreso', count: Number(resumen.egresados_candidatos ?? 0) },
            { tipo: 'Certificación', count: Number(resumen.listos_para_firma ?? 0) },
            { tipo: 'Documentos', count: Number(resumen.rechazados ?? 0) },
        ];
    }, [resumen]);

    const pendientesCriticos = useMemo(() => [
        {
            titulo: 'Documentos observados',
            detalle: `${formatEsNum(resumen.rechazados ?? 0)} en bandeja rechazados`,
            color: '#DC2626',
        },
        {
            titulo: 'Matrículas por confirmar',
            detalle: `${formatEsNum(resumen.solicitudes_matricula_pendientes ?? 0)} solicitudes enviadas`,
            color: '#BA7517',
        },
        {
            titulo: 'Solicitudes con observaciones',
            detalle: `${formatEsNum(resumen.solicitudes_con_observaciones_count ?? 0)} registros`,
            color: '#185FA5',
        },
    ], [resumen]);

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando centro de validaciones..." title="" />;
    }

    if (error && cola.length === 0 && Object.keys(resumen).length === 0) {
        return <EsPageLayout error={error} title="Centro de validaciones" breadcrumbCurrent="Validaciones" largeTitle />;
    }

    const mostrando = cola.length;
    const desde = mostrando > 0 ? 1 : 0;
    const hasta = mostrando;

    return (
        <EsPageLayout
            breadcrumbCurrent="Validaciones"
            title="Centro de validaciones"
            largeTitle
            metrics={metricas}
            error={error || undefined}
            actions={
                <>
                    <EsHeaderAction to="/app/documentos/validacion" icon="review" label="Revisar" variant="primary" />
                    <EsHeaderAction to="/app/documentos/bandejas/aprobados" icon="approve" label="Aprobar" variant="success" />
                    <EsHeaderAction to="/app/documentos/bandejas/rechazados" icon="observe" label="Observar" variant="warn" />
                    <EsHeaderAction to="/app/documentos/bandejas/rechazados" icon="reject" label="Rechazar" variant="danger" />
                    <EsHeaderAction to="/app/documentos/bandejas/pendientes-revision" icon="assign" label="Asignar" variant="secondary" />
                    <EsHeaderAction icon="filter" label="Filtros" />
                </>
            }
            sidebar={
                <>
                    <EsSidePanel title="Tipos de validación">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {tiposValidacion.map((t) => (
                                <div key={t.tipo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: esColors.text }}>
                                    <span>{t.tipo}</span>
                                    <EsStatusBadge color="blue">{formatEsNum(t.count)}</EsStatusBadge>
                                </div>
                            ))}
                        </div>
                    </EsSidePanel>
                    <EsSidePanel title="Pendientes críticos">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {pendientesCriticos.map((p) => (
                                <div key={p.titulo}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: p.color }}>{p.titulo}</p>
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
                        <h3 style={esTheme.sectionTitle}>Cola de trabajo</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: esColors.muted }}>
                            {formatEsNum(totalCola)} resultados en bandejas activas
                        </p>
                    </div>
                    <Link to="/app/documentos/bandejas/pendientes-revision" style={esTheme.btnSecondary}>
                        Ver bandeja completa
                    </Link>
                </div>
                <EsTable
                    headers={TABLE_HEADERS}
                    emptyColSpan={TABLE_HEADERS.length}
                    emptyMessage={cola.length === 0 ? 'No hay registros pendientes de validación normativa.' : null}
                >
                    {cola.map((item) => (
                        <ValidacionRow key={item.key} item={item} />
                    ))}
                </EsTable>
                <div style={esTheme.cardFooterBetween}>
                    <span>
                        Mostrando {desde} a {hasta} de {formatEsNum(totalCola)} registros
                    </span>
                    <Link to="/app/documentos/bandejas/pendientes-revision" style={esTheme.linkAccent}>
                        Ir a pendientes de revisión →
                    </Link>
                </div>
            </EsCard>
        </EsPageLayout>
    );
}

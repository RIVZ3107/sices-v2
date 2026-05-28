import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import {
    CertificationFiltersPanel,
    CertificationRightPanel,
    CertificationWorkflowTable,
    EmptyCertificationState,
} from '../../components/certificacion';
import {
    EsCard,
    EsHeaderAction,
    EsIcons,
    EsPageLayout,
    EsSearchInput,
    esMetricTones,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';
import { useCertificacionSupervision } from '../../hooks/useCertificacionSupervision';
import { esCan } from '../../utils/esCertificacionPermissions';
import {
    revisionInstitucionalBasePath,
    revisionInstitucionalDetallePath,
} from '../../utils/certificacionRoutes';

export function EsCertificacionPage() {
    const navigate = useNavigate();
    const {
        loading,
        error,
        rowsFiltradas,
        kpis,
        distribucion,
        prioridades,
        rezago,
        catalogos,
        filters,
        setFilters,
        recargar,
    } = useCertificacionSupervision();

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [actionMsg, setActionMsg] = useState('');

    const metricasKpi = [
        {
            key: 'candidatos',
            icon: EsIcons.users,
            ...esMetricTones.blue,
            title: 'Candidatos a certificación',
            value: kpis.candidatos,
            description: 'Trayectorias consolidadas o listas para iniciar certificación.',
            quickLink: null,
            quickFilter: { fase: 'en_revision' },
        },
        {
            key: 'aprobados',
            icon: EsIcons.file,
            ...esMetricTones.teal,
            title: 'Expedientes aprobados',
            value: kpis.aprobados,
            description: 'Aprobados institucionalmente, pendientes de folio o liberación.',
            quickLink: null,
            quickFilter: { fase: 'aprobado' },
        },
        {
            key: 'folio',
            icon: EsIcons.assign,
            ...esMetricTones.yellow,
            title: 'Pendientes de folio',
            value: kpis.pendientesFolio,
            description: 'Documentos aprobados que requieren folio interno.',
            quickFilter: { fase: 'pendiente_folio' },
        },
        {
            key: 'listos',
            icon: EsIcons.code,
            ...esMetricTones.purple,
            title: 'Listos para proceso técnico',
            value: kpis.listosProcesoTecnico,
            description: 'Preparados para cadena, XML y firma (Sistemas).',
            quickFilter: { fase: 'listo_proceso_tecnico' },
        },
        {
            key: 'firmados',
            icon: EsIcons.sign,
            ...esMetricTones.green,
            title: 'Documentos firmados',
            value: kpis.firmados,
            description: 'Emitidos o timbrados en el sistema.',
            quickLink: null,
            quickFilter: { fase: 'firmado' },
        },
        {
            key: 'incidencias',
            icon: EsIcons.alert,
            ...esMetricTones.red,
            title: 'Incidencias',
            value: kpis.incidencias,
            description: 'Observados, rechazados, cancelados o con error.',
            quickLink: null,
            quickFilter: { fase: 'incidencia' },
        },
    ];

    function aplicarFiltroRapido(p) {
        if (p?.institucionNombre) {
            const inst = catalogos.instituciones.find((i) => i.nombre === p.institucionNombre);
            setFilters((f) => ({
                ...f,
                institucion_id: inst?.id ? String(inst.id) : '',
                fase: '',
                prioridad: '',
            }));
            setFiltersOpen(true);
            return;
        }
        setFilters((f) => ({
            ...f,
            fase: p.fase ?? '',
            prioridad: p.prioridad ?? '',
        }));
        setFiltersOpen(true);
    }

    async function handleAsignarFolio(item) {
        if (!esCan('folio')) return;
        const folio = window.prompt('Folio interno a asignar:', item.folio.startsWith('DOC-') ? '' : item.folio);
        if (folio === null) return;
        const valor = folio.trim();
        if (!valor) {
            window.alert('Indique un folio interno válido.');
            return;
        }
        if (!window.confirm(`¿Asignar folio interno "${valor}" al documento ${item.id}?`)) return;

        setBusyId(item.id);
        setActionMsg('');
        try {
            await documentosAcademicosApi.asignarFolioInterno(item.id, { folio_interno: valor });
            setActionMsg('Folio asignado correctamente.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo asignar el folio.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleLiberarProceso(item) {
        if (!esCan('liberar')) return;
        const ok = window.confirm(
            'El documento pasará a Sistemas para generación técnica de cadena, XML y firma.\n\n'
            + '¿Liberar a proceso técnico?',
        );
        if (!ok) return;

        setBusyId(item.id);
        setActionMsg('');
        try {
            await documentosAcademicosApi.marcarListoParaFirma(item.id);
            setActionMsg('Documento liberado a proceso técnico.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo liberar el documento.');
        } finally {
            setBusyId(null);
        }
    }

    function handleObservar(item) {
        navigate(revisionInstitucionalDetallePath(item.id));
    }

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando supervisión de certificación..." title="" />;
    }

    const sinDatos = rowsFiltradas.length === 0 && !filters.q && !filters.fase;

    return (
        <EsPageLayout
            breadcrumbCurrent="Certificación"
            title="Supervisión de certificación"
            subtitle="Control institucional de documentos académicos en proceso"
            largeTitle
            metricsWide
            metrics={metricasKpi.map((m) => ({
                key: m.key,
                icon: m.icon,
                iconBg: m.iconBg,
                iconColor: m.iconColor,
                title: m.title,
                value: m.value,
                trend: m.description,
                trendPrefix: '',
                onClick: m.quickFilter ? () => aplicarFiltroRapido(m.quickFilter) : undefined,
            }))}
            error={error || undefined}
            actions={
                <>
                    {esCan('validar') ? (
                        <EsHeaderAction
                            to={`${revisionInstitucionalBasePath()}?bandeja=en-revision`}
                            icon="validate"
                            label="Validar expediente"
                            variant="primary"
                        />
                    ) : null}
                    {esCan('folio') ? (
                        <EsHeaderAction
                            icon="assign"
                            label="Asignar folio"
                            variant="primary"
                            onClick={() => aplicarFiltroRapido({ fase: 'pendiente_folio' })}
                        />
                    ) : null}
                    {esCan('liberar') ? (
                        <EsHeaderAction
                            icon="send"
                            label="Liberar a proceso técnico"
                            variant="primary"
                            onClick={() => aplicarFiltroRapido({ fase: 'listo_proceso_tecnico' })}
                        />
                    ) : null}
                    <EsHeaderAction
                        icon="export"
                        label="Ver aprobados"
                        onClick={() => aplicarFiltroRapido({ fase: 'aprobado' })}
                    />
                    {esCan('reportes') ? (
                        <EsHeaderAction
                            to="/app/educacion-superior/reportes-oficiales"
                            icon="export"
                            label="Exportar"
                        />
                    ) : (
                        <EsHeaderAction
                            icon="export"
                            label="Exportar"
                            onClick={() =>
                                window.alert('Exportación institucional: use Reportes oficiales cuando esté disponible el endpoint dedicado.')
                            }
                        />
                    )}
                    <EsHeaderAction icon="filter" label="Filtros" onClick={() => setFiltersOpen((v) => !v)} />
                </>
            }
            sidebar={
                <CertificationRightPanel
                    distribucion={distribucion}
                    prioridades={prioridades}
                    rezago={rezago}
                    onFiltroRapido={aplicarFiltroRapido}
                />
            }
        >
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                La firma SEP/SINCE y las operaciones técnicas (cadena, XML, preflight, shadow Informix) se ejecutan únicamente desde el módulo Sistemas.
            </p>

            {actionMsg ? (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#0F6E56' }}>{actionMsg}</p>
            ) : null}

            <CertificationFiltersPanel
                filters={filters}
                setFilters={setFilters}
                catalogos={catalogos}
                open={filtersOpen}
                onToggle={() => setFiltersOpen((v) => !v)}
            />

            {sinDatos ? (
                <EmptyCertificationState
                    onVerAprobados={() => navigate(`${revisionInstitucionalBasePath()}?bandeja=aprobados`)}
                    onVerSolicitudes={() => navigate('/app/certificacion/solicitudes')}
                />
            ) : (
                <EsCard overflowHidden>
                    <div style={esTheme.cardHeader}>
                        <div>
                            <h3 style={esTheme.sectionTitle}>Seguimiento de certificación institucional</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                {formatEsNum(rowsFiltradas.length)} registros visibles · datos desde bandejas institucionales
                            </p>
                        </div>
                        <EsSearchInput
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                            placeholder="Buscar folio, alumno, CURP, matrícula o institución…"
                            width={320}
                        />
                    </div>

                    <div style={{ opacity: busyId ? 0.6 : 1, pointerEvents: busyId ? 'none' : 'auto' }}>
                        <CertificationWorkflowTable
                            rows={rowsFiltradas}
                            onAsignarFolio={handleAsignarFolio}
                            onLiberarProceso={handleLiberarProceso}
                            onObservar={handleObservar}
                        />
                    </div>

                    {rowsFiltradas.length === 0 && filters.q ? (
                        <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                            Sin resultados para los filtros aplicados.
                        </p>
                    ) : null}

                    <div style={esTheme.cardFooterBetween}>
                        <span>
                            Mostrando {formatEsNum(rowsFiltradas.length)} registro(s)
                        </span>
                        <Link to={revisionInstitucionalBasePath()} style={esTheme.linkAccent}>
                            Ir a revisión institucional →
                        </Link>
                    </div>
                </EsCard>
            )}
        </EsPageLayout>
    );
}

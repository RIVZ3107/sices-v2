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
import { ejecutarProcesoCertificacion } from '../../lib/ejecutarProcesoCertificacion';
import { esCan } from '../../utils/esCertificacionPermissions';
import {
    documentoProcesoTecnicoDetallePath,
    normalesCertificacionDetallePath,
    revisionInstitucionalBasePath,
    revisionInstitucionalDetallePath,
} from '../../utils/certificacionRoutes';
import { InstitutionalRoleBanner } from '../../components/ui/InstitutionalRoleBanner';

const COPY_NORMALES = {
    breadcrumb: 'Certificación Normales',
    title: 'Certificación de Escuelas Normales',
    subtitle:
        'Validación, aprobación, procesamiento y seguimiento final de documentos académicos de Escuelas Normales.',
    loading: 'Cargando certificación de Escuelas Normales…',
    aviso:
        'Subsistema Escuelas Normales. El certificador valida datos académicos. Educación Superior aprueba, asigna folio y procesa la certificación de forma automática. Sistemas solo atiende incidencias técnicas.',
};

/**
 * @param {{ subsistema?: 'normales' }} props
 * Bandeja de supervisión/certificación ES. Por defecto Normales (ruta canónica).
 */
export function EsCertificacionPage({ subsistema = 'normales' }) {
    const copy = COPY_NORMALES;
    const detallePath =
        subsistema === 'normales' ? normalesCertificacionDetallePath : revisionInstitucionalDetallePath;
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
            key: 'pend_val',
            icon: EsIcons.users,
            ...esMetricTones.yellow,
            title: 'Pendientes de validación',
            value: kpis.pendientesValidacion ?? kpis.candidatos,
            description: 'Etapa del certificador: verificación de datos académicos.',
        },
        {
            key: 'val_cert',
            icon: EsIcons.validate,
            ...esMetricTones.blue,
            title: 'Validados por certificador',
            value: kpis.validadosCertificador ?? kpis.aprobados,
            description: 'Datos revisados; listos para decisión institucional.',
        },
        {
            key: 'folio',
            icon: EsIcons.assign,
            ...esMetricTones.yellow,
            title: 'Pendientes de folio',
            value: kpis.pendientesFolio,
            description: 'Aprobados sin folio interno.',
        },
        {
            key: 'proc',
            icon: EsIcons.code,
            ...esMetricTones.purple,
            title: 'En procesamiento',
            value: kpis.enProcesamiento ?? kpis.listosProcesoTecnico,
            description: 'Emisión automatizada en curso.',
        },
        {
            key: 'firm',
            icon: EsIcons.sign,
            ...esMetricTones.green,
            title: 'Firmados / finalizados',
            value: kpis.firmados,
            description: 'Resultado final disponible.',
        },
        {
            key: 'inc',
            icon: EsIcons.alert,
            ...esMetricTones.red,
            title: 'Incidencias técnicas',
            value: kpis.incidencias,
            description: 'Requieren atención de Sistemas.',
        },
    ];

    async function handleAsignarFolio(item) {
        if (!esCan('folio')) return;
        const folio = window.prompt('Folio interno a asignar:', item.folio.startsWith('DOC-') ? '' : item.folio);
        if (folio === null || !folio.trim()) return;
        setBusyId(item.id);
        try {
            await documentosAcademicosApi.asignarFolioInterno(item.id, { folio_interno: folio.trim() });
            setActionMsg('Folio asignado.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo asignar el folio.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleAprobar(item) {
        if (!esCan('aprobar')) return;
        if (!window.confirm(`¿Aprobar certificación de ${item.alumno}?`)) return;
        setBusyId(item.id);
        try {
            await documentosAcademicosApi.aprobar(item.id, { motivo: 'Aprobación institucional Educación Superior.' });
            setActionMsg('Documento aprobado.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo aprobar.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleProcesar(item) {
        if (!esCan('procesar')) return;
        const ok = window.confirm('¿Procesar certificación y continuar con el resultado final?');
        if (!ok) return;
        setBusyId(item.id);
        setActionMsg('Procesando certificación…');
        try {
            const res = await ejecutarProcesoCertificacion(item.id, {
                listoParaFirma: Boolean(item.raw?.listo_para_firma),
            });
            if (res.ok) {
                setActionMsg(res.message ?? 'Certificación procesada.');
            } else {
                setActionMsg(res.error ?? 'Incidencia técnica. Use «Ver error» o envíe a Sistemas.');
            }
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'Error al procesar.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleFirmar(item) {
        if (!esCan('firmar')) return;
        if (!window.confirm('¿Ejecutar firma / timbrado del certificado?')) return;
        setBusyId(item.id);
        try {
            const res = await documentosAcademicosApi.ejecutarFirma(item.id);
            setActionMsg(res?.message ?? 'Firma ejecutada.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'Error de firma.');
        } finally {
            setBusyId(null);
        }
    }

    function handleVerError(item) {
        navigate(documentoProcesoTecnicoDetallePath(item.id));
    }

    function handleEnviarSistemas(item) {
        navigate(`${documentoProcesoTecnicoDetallePath(item.id)}#logs`);
    }

  if (loading) {
        return <EsPageLayout loading loadingText={copy.loading} title="" />;
    }

    const sinDatos = rowsFiltradas.length === 0 && !filters.q && !filters.fase;

    return (
        <EsPageLayout
            breadcrumbCurrent={copy.breadcrumb}
            title={copy.title}
            subtitle={copy.subtitle}
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
                    {esCan('aprobar') ? (
                        <EsHeaderAction icon="validate" label="Aprobar" variant="primary" onClick={() => setFilters((f) => ({ ...f, fase: 'aprobado' }))} />
                    ) : null}
                    {esCan('folio') ? (
                        <EsHeaderAction icon="assign" label="Asignar folio" variant="primary" onClick={() => setFilters((f) => ({ ...f, fase: 'pendiente_folio' }))} />
                    ) : null}
                    {esCan('procesar') ? (
                        <EsHeaderAction icon="send" label="Procesar certificación" variant="primary" onClick={() => setFilters((f) => ({ ...f, fase: 'listo_proceso_tecnico' }))} />
                    ) : null}
                    {esCan('firmar') ? (
                        <EsHeaderAction icon="sign" label="Firmar certificado" onClick={() => setFilters((f) => ({ ...f, fase: 'firmado' }))} />
                    ) : null}
                    <EsHeaderAction icon="export" label="Ver finalizados" onClick={() => setFilters((f) => ({ ...f, fase: 'firmado' }))} />
                    {esCan('reportes') ? (
                        <EsHeaderAction to="/app/educacion-superior/reportes-oficiales" icon="export" label="Exportar" />
                    ) : (
                        <EsHeaderAction icon="export" label="Exportar" onClick={() => window.alert('Use Reportes oficiales cuando esté disponible el export dedicado.')} />
                    )}
                    <EsHeaderAction icon="filter" label="Filtros" onClick={() => setFiltersOpen((v) => !v)} />
                </>
            }
            sidebar={
                <CertificationRightPanel
                    distribucion={distribucion}
                    prioridades={prioridades}
                    rezago={rezago}
                    onFiltroRapido={(p) => {
                        if (p?.fase) setFilters((f) => ({ ...f, fase: p.fase }));
                        setFiltersOpen(true);
                    }}
                />
            }
        >
            <InstitutionalRoleBanner message={copy.aviso} />

            {actionMsg ? <p style={{ margin: '0 0 12px', fontSize: 13, color: '#0F6E56' }}>{actionMsg}</p> : null}

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
                            <h3 style={esTheme.sectionTitle}>Certificados en trámite</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                {formatEsNum(rowsFiltradas.length)} registro(s)
                            </p>
                        </div>
                        <EsSearchInput
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                            placeholder="Buscar folio, alumno, CURP, matrícula…"
                            width={320}
                        />
                    </div>
                    <div style={{ opacity: busyId ? 0.6 : 1, pointerEvents: busyId ? 'none' : 'auto' }}>
                        <CertificationWorkflowTable
                            rows={rowsFiltradas}
                            onAsignarFolio={handleAsignarFolio}
                            onProcesar={handleProcesar}
                            onFirmar={handleFirmar}
                            onAprobar={handleAprobar}
                            detallePath={detallePath}
                            onObservar={(item) => navigate(detallePath(item.id))}
                            onVerError={handleVerError}
                            onEnviarSistemas={handleEnviarSistemas}
                        />
                    </div>
                </EsCard>
            )}
        </EsPageLayout>
    );
}

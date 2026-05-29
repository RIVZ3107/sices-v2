import { useMemo, useState } from 'react';
import {
    EsCard,
    EsHeaderAction,
    EsIcons,
    EsLoadingState,
    EsPageLayout,
    EsSearchInput,
    esMetricTones,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';
import { UpnCertificacionFilters, UpnCertificacionTable, UpnEmptyState, UpnErrorAlert } from '../../components/upn';
import { useUpnCertificacionBandeja } from '../../hooks/useUpnCertificacionBandeja';
import { computeUpnKpis } from '../../utils/upnCertificacion';
import { ejecutarProcesoCertificacion } from '../../lib/ejecutarProcesoCertificacion';
import { upnCan } from '../../utils/upnCertificacionPermissions';
import { ejecutarAccionBandeja } from '../../components/bandeja/InstitutionalBandejaActions';
import { EMPTY_BANDEJA } from '../../utils/bandejaWorkflow';

export function UpnCertificacionPage() {
    const {
        loading,
        bandejaLoading,
        error,
        filters,
        setFilters,
        catalogos,
        rowsFiltradas,
        recargar,
        limpiarFiltros,
    } = useUpnCertificacionBandeja();

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [actionMsg, setActionMsg] = useState('');

    const kpis = useMemo(() => computeUpnKpis(rowsFiltradas), [rowsFiltradas]);

    const metricasKpi = [
        { key: 'pend', icon: EsIcons.inbox, ...esMetricTones.yellow, title: 'Pendientes de validación', value: kpis.pendientesValidacion },
        { key: 'val', icon: EsIcons.validate, ...esMetricTones.blue, title: 'Validados por certificador', value: kpis.validadosCertificador },
        { key: 'folio', icon: EsIcons.assign, ...esMetricTones.yellow, title: 'Pendientes de folio', value: kpis.pendientesFolio },
        { key: 'proc', icon: EsIcons.code, ...esMetricTones.purple, title: 'En procesamiento', value: kpis.enProcesamiento },
        { key: 'firm', icon: EsIcons.sign, ...esMetricTones.green, title: 'Firmados / finalizados', value: kpis.firmados },
        { key: 'inc', icon: EsIcons.alert, ...esMetricTones.red, title: 'Incidencias técnicas', value: kpis.incidencias },
    ];

    async function handleAccionBandeja(accion, row) {
        if (accion.requiere_motivo) {
            const motivo = window.prompt(`Motivo para «${accion.label}»:`, '');
            if (motivo === null || !String(motivo).trim()) return;
            setBusyId(row.id);
            try {
                await ejecutarAccionBandeja(accion.accion, row.id, motivo.trim());
                setActionMsg('Operación registrada.');
                await recargar();
            } catch (e) {
                setActionMsg(e?.message ?? 'No se pudo completar la acción.');
            } finally {
                setBusyId(null);
            }
            return;
        }

        if (accion.accion === 'procesar_certificacion') {
            if (!upnCan('procesar')) return;
            if (!window.confirm('¿Ejecutar procesamiento automático de la certificación UPN?')) return;
            setBusyId(row.id);
            try {
                const res = await ejecutarProcesoCertificacion(row.id, {
                    listoParaFirma: Boolean(row.raw?.listo_para_firma),
                });
                setActionMsg(res.ok ? res.message ?? 'Procesado.' : res.error ?? 'Incidencia técnica.');
                await recargar();
            } catch (e) {
                setActionMsg(e?.message ?? 'No se pudo procesar.');
            } finally {
                setBusyId(null);
            }
            return;
        }

        setBusyId(row.id);
        try {
            await ejecutarAccionBandeja(accion.accion, row.id, `${accion.label} desde bandeja UPN.`);
            setActionMsg('Operación registrada.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo completar la acción.');
        } finally {
            setBusyId(null);
        }
    }

    const showError = Boolean(error) && !bandejaLoading && rowsFiltradas.length === 0;
    const showEmpty = !loading && !showError && rowsFiltradas.length === 0;
    const showTable = !loading && !showError && rowsFiltradas.length > 0;

    if (loading && rowsFiltradas.length === 0) {
        return <EsLoadingState text="Cargando certificación UPN…" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Certificación UPN"
            title="Certificación UPN"
            subtitle="Validación, aprobación, procesamiento y seguimiento final de documentos académicos UPN."
            metricsWide
            metrics={metricasKpi.map((m) => ({
                key: m.key,
                icon: m.icon,
                iconBg: m.iconBg,
                iconColor: m.iconColor,
                title: m.title,
                value: m.value,
                trend: '',
                trendPrefix: '',
            }))}
            actions={
                <>
                    <EsSearchInput
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                        placeholder="Buscar folio, alumno, CURP…"
                        width={260}
                    />
                    <EsHeaderAction icon="filter" label="Filtros" onClick={() => setFiltersOpen((v) => !v)} />
                    <EsHeaderAction label="Actualizar" variant="secondary" onClick={() => void recargar()} />
                </>
            }
            showSplit={false}
        >
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                Subsistema UPN — flujo propio, separado de Escuelas Normales. Educación Superior procesa y obtiene el
                resultado final de forma automática. Sistemas atiende solo incidencias técnicas si el procesamiento falla.
            </p>

            {actionMsg ? (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#0F6E56' }}>{actionMsg}</p>
            ) : null}

            <UpnCertificacionFilters
                filters={filters}
                setFilters={setFilters}
                catalogos={catalogos}
                open={filtersOpen}
                onToggle={() => setFiltersOpen(false)}
                onLimpiar={limpiarFiltros}
            />

            {showError ? (
                <UpnErrorAlert
                    message={error || 'No se pudo cargar la certificación UPN.'}
                    onReintentar={() => void recargar()}
                />
            ) : null}

            {showEmpty ? <UpnEmptyState onLimpiarFiltros={limpiarFiltros} /> : null}

            {showTable ? (
                <EsCard overflowHidden>
                    <div style={esTheme.cardHeader}>
                        <div>
                            <h3 style={esTheme.sectionTitle}>Certificados UPN</h3>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                                {formatEsNum(rowsFiltradas.length)} registro(s) · bandejas institucionales (subsistema UPN)
                            </p>
                        </div>
                    </div>
                    {bandejaLoading ? (
                        <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                            Actualizando bandeja…
                        </p>
                    ) : (
                        <UpnCertificacionTable
                            rows={rowsFiltradas}
                            onAccion={handleAccionBandeja}
                            busyId={busyId}
                            emptyMessage={EMPTY_BANDEJA.educacion_superior}
                        />
                    )}
                </EsCard>
            ) : null}
        </EsPageLayout>
    );
}

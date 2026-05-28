import { useState } from 'react';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import {
    EsCard,
    EsHeaderAction,
    EsLoadingState,
    EsPageLayout,
    EsSearchInput,
    esTheme,
    formatEsNum,
} from '../../components/educacionSuperior';
import { UpnCertificacionFilters, UpnCertificacionTable, UpnEmptyState, UpnErrorAlert } from '../../components/upn';
import { useUpnCertificacionBandeja } from '../../hooks/useUpnCertificacionBandeja';
import { upnCan } from '../../utils/upnCertificacionPermissions';

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

    const [filtersOpen, setFiltersOpen] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [actionMsg, setActionMsg] = useState('');

    async function handleAprobar(row) {
        if (!upnCan('aprobar')) return;
        if (!window.confirm(`¿Aprobar certificado UPN de ${row.nombre}?`)) return;
        setBusyId(row.id);
        setActionMsg('');
        try {
            await documentosAcademicosApi.aprobar(row.id, { motivo: 'Aprobación institucional UPN.' });
            setActionMsg('Certificado aprobado.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo aprobar.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleRechazar(row) {
        if (!upnCan('rechazar')) return;
        const motivo = window.prompt('Motivo de rechazo:', '');
        if (motivo === null || !motivo.trim()) return;
        setBusyId(row.id);
        try {
            await documentosAcademicosApi.rechazar(row.id, { motivo: motivo.trim() });
            setActionMsg('Certificado rechazado.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo rechazar.');
        } finally {
            setBusyId(null);
        }
    }

    async function handleLiberar(row) {
        if (!upnCan('liberar')) return;
        const ok = window.confirm(
            'El documento pasará a Sistemas para cadena, XML y firma SEP.\n\n¿Liberar a proceso técnico?',
        );
        if (!ok) return;
        setBusyId(row.id);
        try {
            await documentosAcademicosApi.marcarListoParaFirma(row.id);
            setActionMsg('Liberado a proceso técnico.');
            await recargar();
        } catch (e) {
            setActionMsg(e?.message ?? 'No se pudo liberar.');
        } finally {
            setBusyId(null);
        }
    }

    const showError = Boolean(error) && !bandejaLoading && rowsFiltradas.length === 0;
    const showEmpty = !loading && !showError && rowsFiltradas.length === 0;
    const showTable = !loading && !showError && rowsFiltradas.length > 0;

    return (
        <EsPageLayout
            breadcrumbCurrent="Certificación UPN"
            title="Certificación UPN"
            subtitle="Supervisión de certificados de profesionistas de escuelas UPN"
            actions={
                <>
                    <EsHeaderAction icon="filter" label="Filtros" onClick={() => setFiltersOpen((v) => !v)} />
                    <EsHeaderAction label="Actualizar" variant="secondary" onClick={() => void recargar()} />
                </>
            }
        >
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                Filtro institucional: subsistema UPN. La firma SEP y operaciones técnicas se realizan únicamente en
                Sistemas → Proceso técnico de certificación.
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

            {loading ? <EsLoadingState text="Cargando certificación UPN…" /> : null}

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
                                {formatEsNum(rowsFiltradas.length)} registro(s) · datos desde bandejas institucionales (subsistema UPN)
                            </p>
                        </div>
                        <EsSearchInput
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                            placeholder="Buscar folio, alumno, CURP…"
                            width={280}
                        />
                    </div>
                    {bandejaLoading ? (
                        <p style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                            Actualizando bandeja…
                        </p>
                    ) : (
                        <UpnCertificacionTable
                            rows={rowsFiltradas}
                            onAprobar={handleAprobar}
                            onRechazar={handleRechazar}
                            onLiberar={handleLiberar}
                            busyId={busyId}
                        />
                    )}
                </EsCard>
            ) : null}

            {!loading && !showError && rowsFiltradas.length === 0 && filters.q ? (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 8 }}>
                    No hay certificados UPN para los filtros seleccionados.
                </p>
            ) : null}
        </EsPageLayout>
    );
}

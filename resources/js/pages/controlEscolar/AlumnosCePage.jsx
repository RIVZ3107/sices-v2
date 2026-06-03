import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { controlEscolarApi } from '../../api/controlEscolar';
import {
    CeHeaderAction,
    CeIcons,
    CePageHeader,
    ceTheme,
    formatCeActualizado,
    formatCeNum,
} from '../../components/controlEscolar';
import { AlumnoKpiCard, AlumnoKpiSkeleton } from './alumnos/AlumnoKpiCard';
import { AlumnosFilters } from './alumnos/AlumnosFilters';
import { AlumnosQuickActions } from './alumnos/AlumnosQuickActions';
import { AlumnosRecentesCard } from './alumnos/AlumnosRecentesCard';
import { AlumnosTable } from './alumnos/AlumnosTable';
import { ErrorStateAlert } from './alumnos/ErrorStateAlert';
import { ImportarAlumnosModal } from './alumnos/ImportarAlumnosModal';
import { canAlumnos } from './alumnos/alumnosPermissions';
import { useAlumnos } from './alumnos/useAlumnos';

export function AlumnosCePage() {
    const [searchParams] = useSearchParams();
    const [importOpen, setImportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const {
        loading,
        error,
        technicalDetail,
        filters,
        setFilters,
        limpiarFiltros,
        recargar,
        metricas,
        catalogos,
        rows,
        meta,
        recientes,
        actualizadoEn,
        apiOk,
    } = useAlumnos();

    const showFiltros = searchParams.get('filtros') === '1';

    const hasFilters = Boolean(
        filters.search?.trim()
        || filters.estatus
        || filters.programa_id
        || filters.plan_id
        || filters.sede_id
        || filters.periodo
        || filters.expediente,
    );

    const kpiValue = (n) => (apiOk && metricas ? formatCeNum(n ?? 0) : '—');

    const handleExport = async () => {
        if (!canAlumnos('exportar')) return;
        setExporting(true);
        try {
            const params = { ...filters };
            Object.keys(params).forEach((k) => {
                if (params[k] === '' || params[k] === null) delete params[k];
            });
            delete params.page;
            await controlEscolarApi.alumnosExportar(params);
        } catch {
            // error handled by axios interceptor pattern in caller - silent institutional
        } finally {
            setExporting(false);
        }
    };

    const handleSort = (col) => {
        const dir = filters.sort_by === col && filters.sort_dir === 'desc' ? 'asc' : 'desc';
        setFilters({ sort_by: col, sort_dir: dir });
    };

    return (
        <div style={ceTheme.pageShell}>
            <style>{`@keyframes ceShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

            <CePageHeader
                breadcrumbCurrent="Alumnos"
                title="Gestión de alumnos"
                subtitle="Administra y consulta la información académica de los alumnos de tu institución."
                updatedAt={loading && !actualizadoEn ? '…' : formatCeActualizado(actualizadoEn)}
                actions={(
                    <>
                        {canAlumnos('crear') ? (
                            <CeHeaderAction to="/app/alumnos/crear" variant="primary" icon={CeIcons.userPlus} label="Nuevo alumno" />
                        ) : null}
                        {canAlumnos('importar') ? (
                            <CeHeaderAction variant="secondary" icon={CeIcons.upload} label="Importar" onClick={() => setImportOpen(true)} />
                        ) : null}
                        {canAlumnos('exportar') ? (
                            <CeHeaderAction
                                variant="secondary"
                                icon={CeIcons.download}
                                label={exporting ? 'Exportando…' : 'Exportar'}
                                onClick={() => void handleExport()}
                            />
                        ) : null}
                    </>
                )}
            />

            <ErrorStateAlert error={error} technicalDetail={technicalDetail} onRetry={recargar} />

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {loading && !metricas ? (
                    <>
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                        <AlumnoKpiSkeleton />
                    </>
                ) : (
                    <>
                        <AlumnoKpiCard
                            icon={CeIcons.users}
                            iconBg="#DBEAFE"
                            iconColor="#185FA5"
                            title="Alumnos activos"
                            value={kpiValue(metricas?.alumnos_activos)}
                            trend={apiOk ? `${formatCeNum(metricas?.total_alcance)} en tu alcance` : undefined}
                            trendColor="#64748b"
                            onClick={() => setFilters({ estatus: 'activo', expediente: '' })}
                            active={filters.estatus === 'activo'}
                        />
                        <AlumnoKpiCard
                            icon={CeIcons.clock}
                            iconBg="#FEF3C7"
                            iconColor="#BA7517"
                            title="Baja temporal"
                            value={kpiValue(metricas?.baja_temporal)}
                            onClick={() => setFilters({ estatus: 'baja_temporal' })}
                            active={filters.estatus === 'baja_temporal'}
                        />
                        <AlumnoKpiCard
                            icon={CeIcons.school}
                            iconBg="#F3E8FF"
                            iconColor="#6B21A8"
                            title="Egresados"
                            value={kpiValue(metricas?.egresados)}
                            onClick={() => setFilters({ estatus: 'egresado' })}
                            active={filters.estatus === 'egresado'}
                        />
                        <AlumnoKpiCard
                            icon={CeIcons.alertTriangle}
                            iconBg="#FFEDD5"
                            iconColor="#C2410C"
                            title="Expedientes incompletos"
                            value={kpiValue(metricas?.expedientes_incompletos)}
                            onClick={() => setFilters({ estatus: '', expediente: 'incompleto' })}
                            active={filters.expediente === 'incompleto'}
                        />
                    </>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 280px) 1fr', gap: 16, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <AlumnosQuickActions onImport={() => setImportOpen(true)} />
                    <AlumnosRecentesCard recientes={recientes} loading={loading} />
                </div>

                <div style={ceTheme.surface}>
                    <AlumnosFilters
                        filters={filters}
                        catalogos={catalogos}
                        onChange={setFilters}
                        onClear={limpiarFiltros}
                        showPanel={showFiltros}
                    />
                    <AlumnosTable
                        rows={rows}
                        loading={loading}
                        apiOk={apiOk}
                        hasFilters={hasFilters}
                        sortBy={filters.sort_by}
                        sortDir={filters.sort_dir}
                        onSort={handleSort}
                        onImport={() => setImportOpen(true)}
                        search={filters.search || ''}
                        onSearchChange={(v) => setFilters({ search: v })}
                        perPage={Number(filters.per_page) || 10}
                        onPerPageChange={(n) => setFilters({ per_page: String(n) })}
                        meta={meta}
                        page={Number(filters.page) || 1}
                        onPageChange={(p) => setFilters({ page: String(Math.max(1, p)) }, { resetPage: false })}
                    />
                </div>
            </div>

            <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                © 2025 SICES v2 – Control Escolar de Escuela. Todos los derechos reservados. &nbsp;&nbsp; Versión 2.0.0
            </p>

            <ImportarAlumnosModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onSuccess={recargar}
            />
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { EsCard, EsPageLayout, EsSearchInput, esColors, esTheme } from '../educacionSuperior';
import { sanitizeInstitutionalLabel } from '../../utils/uxInstitucional';
import { CatalogoDataTable } from './CatalogoDataTable';
import { CatalogoResumenCards } from './CatalogoResumenCards';
import { TrazabilidadBadge } from './catalogoUtils';

function hayFiltrosActivos(state) {
    return Boolean(
        state.search?.trim()
        || state.subsistemaId
        || state.institucionId
        || state.programaId
        || state.planId
        || state.regionId
        || state.activo !== ''
        || state.soloTrazabilidad,
    );
}

export function CatalogoTabbedView({
    title,
    subtitle,
    breadcrumb = 'Catálogos académicos',
    tabs,
    resumenCards,
    resumenKeys = null,
    initialTab = null,
    fixedFilters = {},
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabId = searchParams.get('tab') || initialTab || tabs[0]?.id;
    const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];

    const [resumen, setResumen] = useState(null);
    const [filtros, setFiltros] = useState({ subsistemas: [], instituciones: [], programas: [], planes: [], regiones: [] });
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
    const [planInfo, setPlanInfo] = useState(null);
    const [modoTecnico, setModoTecnico] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [subsistemaId, setSubsistemaId] = useState(fixedFilters.subsistema_id ?? '');
    const [institucionId, setInstitucionId] = useState(fixedFilters.institucion_id ?? searchParams.get('institucion_id') ?? '');
    const [programaId, setProgramaId] = useState(fixedFilters.programa_estudio_id ?? searchParams.get('programa_estudio_id') ?? '');
    const [planId, setPlanId] = useState(fixedFilters.plan_estudio_id ?? searchParams.get('plan_estudio_id') ?? '');
    const [regionId, setRegionId] = useState('');
    const [activo, setActivo] = useState('');
    const [soloTrazabilidad, setSoloTrazabilidad] = useState(false);
    const [page, setPage] = useState(1);

    const queryParams = useMemo(() => {
        const p = { page, per_page: 25, ...fixedFilters };
        if (search.trim()) p.search = search.trim();
        if (subsistemaId) p.subsistema_id = subsistemaId;
        if (institucionId) p.institucion_id = institucionId;
        if (programaId) p.programa_estudio_id = programaId;
        if (planId) p.plan_estudio_id = planId;
        if (regionId) p.region_id = regionId;
        if (activo !== '') p.activo = activo === '1' ? 1 : 0;
        if (soloTrazabilidad) p.importado_sisees = 1;
        return p;
    }, [page, search, subsistemaId, institucionId, programaId, planId, regionId, activo, soloTrazabilidad, fixedFilters]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            catalogosAcademicosApi.resumen(),
            catalogosAcademicosApi.filtros(programaId ? { programa_estudio_id: programaId } : {}),
        ])
            .then(([resRes, filtRes]) => {
                if (cancelled) return;
                setResumen(resRes?.data ?? null);
                setModoTecnico(Boolean(resRes?.modo_tecnico));
                const raw = filtRes?.data ?? {};
                setFiltros({
                    subsistemas: raw.subsistemas ?? [],
                    instituciones: raw.instituciones ?? [],
                    programas: raw.programas ?? [],
                    planes: raw.planes ?? [],
                    regiones: raw.regiones ?? [],
                });
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudo cargar el resumen.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [programaId]);

    const cargarTabla = useCallback(() => {
        if (tab.isEstructura && !planId) {
            setRows([]);
            setMeta({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
            setPlanInfo(null);
            return;
        }

        let cancelled = false;
        setLoadingTabla(true);
        setError('');

        tab.fetch(catalogosAcademicosApi, queryParams)
            .then((res) => {
                if (cancelled) return;
                setRows(Array.isArray(res?.data) ? res.data : []);
                setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: 25 });
                setPlanInfo(res?.plan ?? null);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No se pudo cargar el catálogo.');
            })
            .finally(() => {
                if (!cancelled) setLoadingTabla(false);
            });

        return () => { cancelled = true; };
    }, [tab, queryParams, planId]);

    useEffect(() => {
        const cleanup = cargarTabla();
        return cleanup;
    }, [cargarTabla]);

    const cambiarTab = (id) => {
        setSearchParams({ tab: id });
        setPage(1);
        setSearch('');
        if (!fixedFilters.subsistema_id) setSubsistemaId('');
        if (!fixedFilters.institucion_id) setInstitucionId('');
        if (!fixedFilters.programa_estudio_id) setProgramaId('');
        if (!fixedFilters.plan_estudio_id) setPlanId('');
        setRegionId('');
        setActivo('');
        setSoloTrazabilidad(false);
    };

    const resumenFiltrado = useMemo(() => {
        if (!resumen || !resumenKeys) return resumen;
        return Object.fromEntries(
            Object.entries(resumen).filter(([key]) => resumenKeys.includes(key)),
        );
    }, [resumen, resumenKeys]);

    const showFilter = (name) => {
        if (name === 'trazabilidad_migracion') {
            return modoTecnico && tab.filters.includes(name);
        }
        if (fixedFilters.institucion_id && name === 'institucion') return false;
        return tab.filters.includes(name);
    };

    const emptyMessage = tab.isEstructura && !planId
        ? 'Seleccione un plan de estudio para consultar la estructura curricular.'
        : hayFiltrosActivos({ search, subsistemaId, institucionId, programaId, planId, regionId, activo, soloTrazabilidad })
            ? 'No se encontraron registros con los filtros seleccionados.'
            : 'No hay registros disponibles en este catálogo.';

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando catálogos..." title="" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent={breadcrumb}
            title={title}
            subtitle={subtitle}
            metrics={null}
            error={error || undefined}
            showSplit={false}
        >
            <CatalogoResumenCards
                cards={resumenCards}
                resumen={resumenFiltrado ?? resumen}
                onCardClick={cambiarTab}
            />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0' }}>
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => cambiarTab(t.id)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: `1px solid ${t.id === tab.id ? esColors.primary : esColors.border}`,
                            background: t.id === tab.id ? '#EFF6FF' : 'white',
                            color: t.id === tab.id ? esColors.primary : esColors.muted,
                            fontWeight: t.id === tab.id ? 700 : 500,
                            fontSize: 13,
                            cursor: 'pointer',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <EsCard overflowHidden>
                <div style={{ padding: 16, borderBottom: `1px solid ${esColors.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                        <EsSearchInput
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder={`Buscar en ${tab.label.toLowerCase()}...`}
                        />
                        {showFilter('subsistema') ? (
                            <select value={subsistemaId} onChange={(e) => { setSubsistemaId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                                <option value="">Todos los subsistemas</option>
                                {filtros.subsistemas.map((s) => (
                                    <option key={s.id} value={s.id}>{sanitizeInstitutionalLabel(s.nombre ?? s.clave)}</option>
                                ))}
                            </select>
                        ) : null}
                        {showFilter('region') ? (
                            <select value={regionId} onChange={(e) => { setRegionId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                                <option value="">Todas las regiones</option>
                                {(filtros.regiones ?? []).map((r) => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                        ) : null}
                        {showFilter('institucion') ? (
                            <select value={institucionId} onChange={(e) => { setInstitucionId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                                <option value="">Todas las instituciones</option>
                                {(filtros.instituciones ?? []).map((i) => (
                                    <option key={i.id} value={i.id}>{i.nombre}</option>
                                ))}
                            </select>
                        ) : null}
                        {showFilter('programa') ? (
                            <select value={programaId} onChange={(e) => { setProgramaId(e.target.value); setPlanId(''); setPage(1); }} style={esTheme.inputSearch}>
                                <option value="">Todos los programas</option>
                                {filtros.programas.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        ) : null}
                        {showFilter('plan') ? (
                            <select value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }} style={{ ...esTheme.inputSearch, minWidth: 220 }}>
                                <option value="">Seleccione plan de estudio</option>
                                {(filtros.planes ?? []).map((p) => (
                                    <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>
                                ))}
                            </select>
                        ) : null}
                        {showFilter('activo') ? (
                            <select value={activo} onChange={(e) => { setActivo(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                                <option value="">Todos los estatus</option>
                                <option value="1">Activos</option>
                                <option value="0">Inactivos</option>
                            </select>
                        ) : null}
                        {showFilter('trazabilidad_migracion') ? (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: esColors.muted }}>
                                <input type="checkbox" checked={soloTrazabilidad} onChange={(e) => { setSoloTrazabilidad(e.target.checked); setPage(1); }} />
                                Mostrar registros con trazabilidad de migración
                            </label>
                        ) : null}
                    </div>
                    {planInfo ? (
                        <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>
                            Plan seleccionado:{' '}
                            <strong style={{ color: esColors.text }}>
                                {planInfo.clave} — {sanitizeInstitutionalLabel(planInfo.nombre)}
                            </strong>
                            {planInfo.programa ? ` · ${sanitizeInstitutionalLabel(planInfo.programa)}` : ''}
                            {modoTecnico && planInfo.trazabilidad_disponible ? (
                                <span style={{ marginLeft: 8 }}><TrazabilidadBadge /></span>
                            ) : null}
                        </p>
                    ) : null}
                </div>

                <CatalogoDataTable
                    columns={tab.columns}
                    rows={rows}
                    modoTecnico={modoTecnico}
                    loading={loadingTabla}
                    emptyMessage={emptyMessage}
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                />
            </EsCard>
        </EsPageLayout>
    );
}

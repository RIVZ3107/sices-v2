import { useCallback, useEffect, useState } from 'react';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { CatalogoDataTable } from '../../components/catalogos/CatalogoDataTable';
import { EsCard, EsPageLayout, EsSearchInput, esColors, esTheme, formatEsNum } from '../../components/educacionSuperior';

const MUNICIPIO_COLS = [
    { key: 'entidad', label: 'Entidad federativa' },
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Municipio' },
    { key: 'sedes_relacionadas', label: 'Sedes relacionadas' },
    { key: 'estatus', label: 'Estatus', type: 'badge' },
];

export function MunicipiosPage() {
    const [modoTecnico, setModoTecnico] = useState(false);
    const [municipios, setMunicipios] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [entidades, setEntidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [entidadId, setEntidadId] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        let cancelled = false;
        catalogosAcademicosApi.filtros()
            .then((filt) => {
                if (!cancelled) setEntidades(filt?.data?.entidades_federativas ?? []);
            })
            .catch(() => {});
        catalogosAcademicosApi.resumen()
            .then((res) => { if (!cancelled) setModoTecnico(Boolean(res?.modo_tecnico)); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const cargar = useCallback(() => {
        let cancelled = false;
        setLoadingTabla(true);
        const params = { page, per_page: 25 };
        if (search.trim()) params.search = search.trim();
        if (entidadId) params.entidad_federativa_id = entidadId;

        catalogosAcademicosApi.municipios(params)
            .then((res) => {
                if (cancelled) return;
                setMunicipios(res?.data ?? []);
                setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
            })
            .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error al cargar municipios.'); })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                    setLoadingTabla(false);
                }
            });
        return () => { cancelled = true; };
    }, [page, search, entidadId]);

    useEffect(() => {
        const c = cargar();
        return c;
    }, [cargar]);

    if (loading && municipios.length === 0) {
        return <EsPageLayout loading loadingText="Cargando catálogo territorial..." title="" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Municipios"
            title="Municipios"
            subtitle="Catálogo territorial de entidades federativas y municipios."
            showSplit={false}
            error={error || undefined}
        >
            <div style={{ ...esTheme.card, padding: 16, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, color: esColors.muted }}>Municipios registrados</p>
                <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700 }}>{formatEsNum(meta.total ?? 0)}</p>
            </div>

            <EsCard overflowHidden>
                <div style={{ padding: 16, borderBottom: `1px solid ${esColors.border}`, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <EsSearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar municipio..." />
                    <select value={entidadId} onChange={(e) => { setEntidadId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todas las entidades</option>
                        {entidades.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                </div>
                <CatalogoDataTable
                    columns={MUNICIPIO_COLS}
                    rows={municipios}
                    modoTecnico={modoTecnico}
                    loading={loadingTabla}
                    emptyMessage="No se encontraron municipios con los filtros seleccionados."
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                />
            </EsCard>
        </EsPageLayout>
    );
}

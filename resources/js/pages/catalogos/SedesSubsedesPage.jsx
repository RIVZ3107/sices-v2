import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { CatalogoDataTable } from '../../components/catalogos/CatalogoDataTable';
import { CatalogoDetailPanel } from '../../components/catalogos/CatalogoDetailPanel';
import { EsCard, EsPageLayout, EsSearchInput, esColors, esTheme, formatEsNum } from '../../components/educacionSuperior';

const SEDE_COLS = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Sede' },
    { key: 'institucion', label: 'Institución' },
    { key: 'subsistema', label: 'Subsistema' },
    { key: 'cct', label: 'CCT' },
    { key: 'municipio', label: 'Municipio' },
    { key: 'estatus', label: 'Estatus', type: 'badge' },
];

export function SedesSubsedesPage() {
    const [searchParams] = useSearchParams();
    const instParam = searchParams.get('institucion_id') ?? '';

    const [resumen, setResumen] = useState(null);
    const [modoTecnico, setModoTecnico] = useState(false);
    const [sedes, setSedes] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filtros, setFiltros] = useState({ instituciones: [], subsistemas: [] });
    const [loading, setLoading] = useState(true);
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [institucionId, setInstitucionId] = useState(instParam);
    const [subsistemaId, setSubsistemaId] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [activo, setActivo] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [ofertasSede, setOfertasSede] = useState([]);

    useEffect(() => {
        setInstitucionId(instParam);
    }, [instParam]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([catalogosAcademicosApi.resumen(), catalogosAcademicosApi.filtros()])
            .then(([res, filt]) => {
                if (cancelled) return;
                setResumen(res?.data ?? null);
                setModoTecnico(Boolean(res?.modo_tecnico));
                setFiltros(filt?.data ?? {});
            })
            .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error al cargar.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const cargar = useCallback(() => {
        let cancelled = false;
        setLoadingTabla(true);
        const params = { page, per_page: 25 };
        if (search.trim()) params.search = search.trim();
        if (institucionId) params.institucion_id = institucionId;
        if (subsistemaId) params.subsistema_id = subsistemaId;
        if (municipio.trim()) params.municipio = municipio.trim();
        if (activo !== '') params.activo = activo === '1' ? 1 : 0;

        catalogosAcademicosApi.sedes(params)
            .then((res) => {
                if (cancelled) return;
                setSedes(res?.data ?? []);
                setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
            })
            .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error al cargar sedes.'); })
            .finally(() => { if (!cancelled) setLoadingTabla(false); });
        return () => { cancelled = true; };
    }, [page, search, institucionId, subsistemaId, municipio, activo]);

    useEffect(() => {
        const c = cargar();
        return c;
    }, [cargar]);

    const cards = useMemo(() => {
        const s = resumen?.sedes ?? {};
        const instCount = new Set(sedes.map((x) => x.institucion_id).filter(Boolean)).size;
        return [
            { label: 'Total sedes', value: s.total ?? meta.total ?? 0 },
            { label: 'Sedes activas', value: s.activos ?? 0 },
            { label: 'Instituciones con sedes', value: instCount || '—' },
        ];
    }, [resumen, sedes, meta.total]);

    const onSelectSede = (row) => {
        setSelected(row);
        catalogosAcademicosApi.sedeOfertas(row.id, { per_page: 10 })
            .then((res) => setOfertasSede(res?.data ?? []))
            .catch(() => setOfertasSede([]));
    };

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando sedes..." title="" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Sedes y subsedes"
            title="Sedes y subsedes"
            subtitle="Consulta de sedes y subsedes por institución."
            showSplit={false}
            error={error || undefined}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                {cards.map((c) => (
                    <div key={c.label} style={{ ...esTheme.card, padding: 16 }}>
                        <p style={{ margin: 0, fontSize: 12, color: esColors.muted }}>{c.label}</p>
                        <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700 }}>{formatEsNum(c.value)}</p>
                    </div>
                ))}
            </div>

            <EsCard overflowHidden>
                <div style={{ padding: 16, borderBottom: `1px solid ${esColors.border}`, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <EsSearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar sede..." />
                    <select value={institucionId} onChange={(e) => { setInstitucionId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todas las instituciones</option>
                        {(filtros.instituciones ?? []).map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                    <select value={subsistemaId} onChange={(e) => { setSubsistemaId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todos los subsistemas</option>
                        {(filtros.subsistemas ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <input
                        type="search"
                        value={municipio}
                        onChange={(e) => { setMunicipio(e.target.value); setPage(1); }}
                        placeholder="Filtrar por municipio"
                        style={{ ...esTheme.inputSearch, width: 200 }}
                    />
                    <select value={activo} onChange={(e) => { setActivo(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todos los estatus</option>
                        <option value="1">Activas</option>
                        <option value="0">Inactivas</option>
                    </select>
                </div>
                <CatalogoDataTable
                    columns={SEDE_COLS}
                    rows={sedes}
                    modoTecnico={modoTecnico}
                    loading={loadingTabla}
                    emptyMessage="No se encontraron registros con los filtros seleccionados."
                    meta={meta}
                    page={page}
                    onPageChange={setPage}
                    onRowClick={onSelectSede}
                    selectedId={selected?.id}
                />
            </EsCard>

            {selected ? (
                <CatalogoDetailPanel
                    title={selected.nombre}
                    onClose={() => { setSelected(null); setOfertasSede([]); }}
                    actions={(
                        <Link
                            to={`/app/catalogos/programas-ofertas?sede_id=${selected.id}&institucion_id=${selected.institucion_id ?? ''}`}
                            style={esTheme.btnSecondary}
                        >
                            Ver ofertas de esta sede
                        </Link>
                    )}
                >
                    <p><strong>Clave:</strong> {selected.clave ?? '—'}</p>
                    <p><strong>CCT:</strong> {selected.cct ?? '—'}</p>
                    <p><strong>Institución:</strong> {selected.institucion ?? '—'}</p>
                    <p><strong>Subsistema:</strong> {selected.subsistema ?? '—'}</p>
                    <p><strong>Municipio:</strong> {selected.municipio ?? '—'}</p>
                    <p><strong>Estatus:</strong> {selected.estatus}</p>
                    {ofertasSede.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <strong>Ofertas académicas relacionadas:</strong>
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {ofertasSede.map((o) => (
                                    <li key={o.id}>{o.clave} — {o.programa} ({o.modalidad})</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p style={{ marginTop: 12 }}>Sin ofertas académicas registradas para esta sede.</p>
                    )}
                </CatalogoDetailPanel>
            ) : null}
        </EsPageLayout>
    );
}

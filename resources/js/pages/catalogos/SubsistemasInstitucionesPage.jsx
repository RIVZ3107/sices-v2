import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { CatalogoDataTable } from '../../components/catalogos/CatalogoDataTable';
import { CatalogoDetailPanel } from '../../components/catalogos/CatalogoDetailPanel';
import { EsCard, EsPageLayout, EsSearchInput, esColors, esTheme, formatEsNum } from '../../components/educacionSuperior';

const SUBSISTEMA_COLS = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Subsistema' },
    { key: 'instituciones_count', label: 'Instituciones' },
    { key: 'estatus', label: 'Estatus', type: 'badge' },
];

const INSTITUCION_COLS = [
    { key: 'clave', label: 'Clave' },
    { key: 'nombre', label: 'Institución' },
    { key: 'subsistema', label: 'Subsistema' },
    { key: 'region', label: 'Región' },
    { key: 'estatus', label: 'Estatus', type: 'badge' },
];

export function SubsistemasInstitucionesPage() {
    const [resumen, setResumen] = useState(null);
    const [modoTecnico, setModoTecnico] = useState(false);
    const [subsistemas, setSubsistemas] = useState([]);
    const [instituciones, setInstituciones] = useState([]);
    const [metaInst, setMetaInst] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [filtros, setFiltros] = useState({ subsistemas: [], regiones: [] });
    const [loading, setLoading] = useState(true);
    const [loadingInst, setLoadingInst] = useState(false);
    const [error, setError] = useState('');
    const [searchSub, setSearchSub] = useState('');
    const [searchInst, setSearchInst] = useState('');
    const [subsistemaId, setSubsistemaId] = useState('');
    const [regionId, setRegionId] = useState('');
    const [activo, setActivo] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [sedesRelacionadas, setSedesRelacionadas] = useState([]);
    const [ofertasRelacionadas, setOfertasRelacionadas] = useState([]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            catalogosAcademicosApi.resumen(),
            catalogosAcademicosApi.filtros(),
            catalogosAcademicosApi.subsistemas({ per_page: 50 }),
        ])
            .then(([res, filt, subs]) => {
                if (cancelled) return;
                setResumen(res?.data ?? null);
                setModoTecnico(Boolean(res?.modo_tecnico));
                setFiltros(filt?.data ?? {});
                setSubsistemas(subs?.data ?? []);
            })
            .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error al cargar datos.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const cargarInstituciones = useCallback(() => {
        let cancelled = false;
        setLoadingInst(true);
        const params = { page, per_page: 25 };
        if (searchInst.trim()) params.search = searchInst.trim();
        if (subsistemaId) params.subsistema_id = subsistemaId;
        if (regionId) params.region_id = regionId;
        if (activo !== '') params.activo = activo === '1' ? 1 : 0;

        catalogosAcademicosApi.instituciones(params)
            .then((res) => {
                if (cancelled) return;
                setInstituciones(res?.data ?? []);
                setMetaInst(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
            })
            .catch((e) => { if (!cancelled) setError(e?.message ?? 'Error al cargar instituciones.'); })
            .finally(() => { if (!cancelled) setLoadingInst(false); });
        return () => { cancelled = true; };
    }, [page, searchInst, subsistemaId, regionId, activo]);

    useEffect(() => {
        const c = cargarInstituciones();
        return c;
    }, [cargarInstituciones]);

    const cards = useMemo(() => {
        const inst = resumen?.instituciones ?? {};
        return [
            { key: '_subs', label: 'Subsistemas', tab: null, total: subsistemas.length },
            { key: 'instituciones', label: 'Instituciones', tab: null, total: inst.total ?? 0 },
            { key: '_activas', label: 'Instituciones activas', tab: null, total: inst.activos ?? 0 },
        ];
    }, [resumen, subsistemas.length]);

    const onSelectInstitucion = (row) => {
        setSelected(row.id);
        setSedesRelacionadas([]);
        setOfertasRelacionadas([]);
        catalogosAcademicosApi.institucionDetalle(row.id)
            .then((res) => setDetalle(res?.data ?? null))
            .catch(() => setDetalle(null));
        catalogosAcademicosApi.institucionSedes(row.id, { per_page: 10 })
            .then((res) => setSedesRelacionadas(res?.data ?? []))
            .catch(() => setSedesRelacionadas([]));
        catalogosAcademicosApi.institucionOfertas(row.id, { per_page: 10 })
            .then((res) => setOfertasRelacionadas(res?.data ?? []))
            .catch(() => setOfertasRelacionadas([]));
    };

    const subsFiltrados = subsistemas.filter((s) => {
        const q = searchSub.trim().toLowerCase();
        if (!q) return true;
        return String(s.nombre ?? '').toLowerCase().includes(q) || String(s.clave ?? '').toLowerCase().includes(q);
    });

    if (loading) {
        return <EsPageLayout loading loadingText="Cargando subsistemas e instituciones..." title="" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Subsistemas / Instituciones"
            title="Subsistemas e instituciones"
            subtitle="Consulta de subsistemas educativos e instituciones registradas en el sistema."
            showSplit={false}
            error={error || undefined}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                {cards.map((c) => (
                    <div key={c.key} style={{ ...esTheme.card, padding: 16 }}>
                        <p style={{ margin: 0, fontSize: 12, color: esColors.muted }}>{c.label}</p>
                        <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color: esColors.text }}>{formatEsNum(c.total)}</p>
                    </div>
                ))}
            </div>

            <EsCard overflowHidden style={{ marginBottom: 20 }}>
                <div style={{ padding: 16, borderBottom: `1px solid ${esColors.border}` }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Subsistemas</h3>
                    <EsSearchInput value={searchSub} onChange={(e) => setSearchSub(e.target.value)} placeholder="Buscar subsistema..." />
                </div>
                <CatalogoDataTable columns={SUBSISTEMA_COLS} rows={subsFiltrados} modoTecnico={modoTecnico} emptyMessage="No hay subsistemas registrados." />
            </EsCard>

            <EsCard overflowHidden>
                <div style={{ padding: 16, borderBottom: `1px solid ${esColors.border}`, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <EsSearchInput value={searchInst} onChange={(e) => { setSearchInst(e.target.value); setPage(1); }} placeholder="Buscar institución..." />
                    <select value={subsistemaId} onChange={(e) => { setSubsistemaId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todos los subsistemas</option>
                        {(filtros.subsistemas ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <select value={regionId} onChange={(e) => { setRegionId(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todas las regiones</option>
                        {(filtros.regiones ?? []).map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                    <select value={activo} onChange={(e) => { setActivo(e.target.value); setPage(1); }} style={esTheme.inputSearch}>
                        <option value="">Todos los estatus</option>
                        <option value="1">Activas</option>
                        <option value="0">Inactivas</option>
                    </select>
                </div>
                <CatalogoDataTable
                    columns={INSTITUCION_COLS}
                    rows={instituciones}
                    modoTecnico={modoTecnico}
                    loading={loadingInst}
                    emptyMessage="No se encontraron registros con los filtros seleccionados."
                    meta={metaInst}
                    page={page}
                    onPageChange={setPage}
                    onRowClick={onSelectInstitucion}
                    selectedId={selected}
                />
            </EsCard>

            {detalle ? (
                <CatalogoDetailPanel
                    title={detalle.nombre}
                    onClose={() => { setSelected(null); setDetalle(null); setSedesRelacionadas([]); setOfertasRelacionadas([]); }}
                    actions={(
                        <>
                            <Link to={`/app/catalogos/sedes?institucion_id=${detalle.id}`} style={esTheme.btnSecondary}>Ver sedes</Link>
                            <Link to={`/app/catalogos/programas-ofertas?institucion_id=${detalle.id}`} style={esTheme.btnSecondary}>Ver ofertas</Link>
                        </>
                    )}
                >
                    <p><strong>Clave:</strong> {detalle.clave ?? '—'}</p>
                    <p><strong>Subsistema:</strong> {detalle.subsistema ?? '—'}</p>
                    <p><strong>Región:</strong> {detalle.region ?? '—'}</p>
                    <p><strong>Estatus:</strong> {detalle.estatus}</p>
                    <p><strong>Sedes:</strong> {formatEsNum(detalle.sedes_count ?? 0)}</p>
                    <p><strong>Ofertas académicas:</strong> {formatEsNum(detalle.ofertas_count ?? 0)}</p>
                    <p><strong>Programas con oferta:</strong> {formatEsNum(detalle.programas_count ?? 0)}</p>
                    {sedesRelacionadas.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <strong>Sedes relacionadas:</strong>
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {sedesRelacionadas.map((s) => (
                                    <li key={s.id}>{s.clave} — {s.nombre}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    {ofertasRelacionadas.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <strong>Ofertas académicas relacionadas:</strong>
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {ofertasRelacionadas.map((o) => (
                                    <li key={o.id}>{o.clave} — {o.programa} ({o.modalidad})</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </CatalogoDetailPanel>
            ) : null}
        </EsPageLayout>
    );
}

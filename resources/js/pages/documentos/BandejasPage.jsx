import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUser } from '../../authStore';
import { bandejasApi } from '../../api/bandejas';
import { catalogosApi } from '../../api/catalogos';
import { BandejaTable } from '../../components/BandejaTable';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { FilterBar } from '../../components/ui/FilterBar';

const bandejas = [
    'por-rol',
    'borradores',
    'por-enviar',
    'en-revision',
    'pendientes-revision',
    'aprobados',
    'rechazados',
    'listos-para-firma',
    'firmados',
    'errores-firma',
    'pendientes-tecnicos',
];
const BANDEJAS_POR_ROL = {
    control_escolar_escuela: ['por-rol', 'borradores', 'en-revision', 'aprobados', 'rechazados'],
};
const BANDEJA_DESCRIPCION = {
    'por-rol': 'Documentos visibles según tu rol.',
    borradores: 'Documentos en captura y preparación interna.',
    'por-enviar': 'Documentos listos para envío inicial a revisión.',
    'en-revision': 'Documentos en análisis institucional.',
    'pendientes-revision': 'Documentos pendientes de dictaminación.',
    aprobados: 'Documentos aprobados institucionalmente.',
    rechazados: 'Documentos devueltos con observaciones.',
    'listos-para-firma': 'Documentos aprobados y preparados para firma posterior.',
    firmados: 'Documentos firmados.',
    'errores-firma': 'Documentos con incidencias de firma.',
    'pendientes-tecnicos': 'Documentos pendientes de atención.',
};

export function BandejasPage() {
    const { bandeja: bandejaParam } = useParams();
    const [bandeja, setBandeja] = useState(bandejaParam ?? 'por-rol');
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });
    const user = getUser();
    const isControlEscolar = (user?.roles ?? []).includes('control_escolar_escuela');
    const bandejasVisibles = BANDEJAS_POR_ROL.control_escolar_escuela && isControlEscolar ? BANDEJAS_POR_ROL.control_escolar_escuela : bandejas;
    const [filters, setFilters] = useState({
        q: '',
        curp: '',
        folio_interno: '',
        institucion_id: '',
        sede_q: '',
        ciclo_escolar_id: '',
        tipo_documento: '',
        estado_workflow: '',
    });
    const resultCount = Array.isArray(rows) ? rows.length : 0;

    useEffect(() => {
        setBandeja(bandejaParam ?? 'por-rol');
    }, [bandejaParam]);

    useEffect(() => {
        Promise.all([
            catalogosApi.instituciones().catch(() => ({ data: [] })),
            catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
        ]).then(([ins, cic]) => {
            setCatalogos({
                instituciones: Array.isArray(ins?.data) ? ins.data : [],
                ciclos: Array.isArray(cic?.data) ? cic.data : [],
            });
        });
    }, []);

    useEffect(() => {
            setError('');
        const params = {
            ...filters,
            sede_id: '',
        };
        const req = bandeja === 'por-rol'
            ? bandejasApi.porRol(params)
            : bandejasApi.listar(bandeja, params);
        req.then((res) => {
            const data = Array.isArray(res.data) ? res.data : [];
            const term = filters.sede_q.trim().toLowerCase();
            const filtrada = term
                ? data.filter((row) => `${row?.sede?.nombre ?? ''} ${row?.sede?.clave ?? ''}`.toLowerCase().includes(term))
                : data;
            setRows(filtrada);
        }).catch((err) => {
            setRows([]);
            setError(err?.message ?? 'No se pudo cargar la bandeja.');
        });
    }, [bandeja, filters]);

    return (
        <section className="grid gap-4">
            <PageHeader title={bandeja === 'por-rol' ? 'Mis documentos académicos' : `Bandeja: ${bandeja.replaceAll('-', ' ')}`} subtitle={`${BANDEJA_DESCRIPCION[bandeja] ?? 'Mesa de trabajo documental.'} Resultados: ${resultCount}`} />
            <FilterBar onReset={() => setFilters({ q: '', curp: '', folio_interno: '', institucion_id: '', sede_q: '', ciclo_escolar_id: '', tipo_documento: '', estado_workflow: '' })}>
                <label className="grid gap-1 text-xs text-slate-600">
                    Bandeja
                    <select className="inst-select text-sm" value={bandeja} onChange={(e) => setBandeja(e.target.value)}>
                        {bandejasVisibles.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                </label>
                <FormField label="Busqueda general" value={filters.q} onChange={(v) => setFilters((s) => ({ ...s, q: v }))} />
                <details className="md:col-span-4">
                    <summary className="cursor-pointer text-xs text-slate-600">Filtros avanzados</summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <label className="grid gap-1 text-xs text-slate-600">
                            Institución
                            <select className="inst-select text-sm" value={filters.institucion_id} onChange={(e) => setFilters((s) => ({ ...s, institucion_id: e.target.value }))}>
                                <option value="">Todas</option>
                                {catalogos.instituciones.map((ins) => <option key={ins.id} value={ins.id}>{ins.nombre}</option>)}
                            </select>
                        </label>
                        <FormField label="Sede / CCT" value={filters.sede_q} onChange={(v) => setFilters((s) => ({ ...s, sede_q: v }))} placeholder="Nombre o CCT" />
                        <label className="grid gap-1 text-xs text-slate-600">
                            Ciclo escolar
                            <select className="inst-select text-sm" value={filters.ciclo_escolar_id} onChange={(e) => setFilters((s) => ({ ...s, ciclo_escolar_id: e.target.value }))}>
                                <option value="">Todos</option>
                                {catalogos.ciclos.map((c) => <option key={c.id} value={c.id}>{c.nombre ?? c.clave}</option>)}
                            </select>
                        </label>
                        <FormField label="Tipo documento" value={filters.tipo_documento} onChange={(v) => setFilters((s) => ({ ...s, tipo_documento: v }))} />
                        <FormField label="Estado" value={filters.estado_workflow} onChange={(v) => setFilters((s) => ({ ...s, estado_workflow: v }))} />
                    </div>
                </details>
            </FilterBar>
            {error ? <ErrorState message={error} /> : null}
            {rows === null ? <LoadingState text="Cargando bandeja..." /> : rows.length === 0 ? (
                <>
                    <EmptyState
                        title="No hay documentos en esta bandeja."
                        description="Cuando se generen documentos para este estado, aparecerán aquí."
                    />
                    {isControlEscolar ? (
                        <div className="inst-surface p-4 text-sm flex flex-wrap gap-3">
                            <Link className="text-blue-700 hover:underline" to="/app/certificacion/solicitud">Crear solicitud de certificación</Link>
                            <Link className="text-blue-700 hover:underline" to="/app/alumnos">Ir a alumnos</Link>
                            <Link className="text-blue-700 hover:underline" to="/app/trayectorias">Ver trayectorias listas</Link>
                        </div>
                    ) : null}
                </>
            ) : <BandejaTable rows={rows} />}
            {rows && rows.length > 0 ? <p className="text-xs text-slate-500">Acciones sugeridas: <Link className="text-blue-700" to="/app/documentos/bandejas/por-rol">Actualizar bandeja</Link> · <Link className="text-blue-700" to="/app/documentos/observaciones">Atender observaciones</Link></p> : null}
        </section>
    );
}

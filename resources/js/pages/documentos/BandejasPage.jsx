import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
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
const BANDEJA_DESCRIPCION = {
    'por-rol': 'Documentos visibles segun el rol autenticado.',
    borradores: 'Documentos en captura y preparacion interna.',
    'por-enviar': 'Documentos listos para envio inicial a revision.',
    'en-revision': 'Documentos en analisis por instancia revisora.',
    'pendientes-revision': 'Documentos pendientes de dictaminacion.',
    aprobados: 'Documentos aprobados institucionalmente.',
    rechazados: 'Documentos devueltos con observaciones.',
    'listos-para-firma': 'Documentos aprobados y preparados para firma futura.',
    firmados: 'Documentos marcados como firmados en procesos tecnicos.',
    'errores-firma': 'Documentos con incidencias tecnicas de firma.',
    'pendientes-tecnicos': 'Documentos pendientes de atencion tecnica.',
};

export function BandejasPage() {
    const { bandeja: bandejaParam } = useParams();
    const [bandeja, setBandeja] = useState(bandejaParam ?? 'por-rol');
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        q: '',
        curp: '',
        folio_interno: '',
        institucion_id: '',
        sede_id: '',
        ciclo_escolar_id: '',
        tipo_documento: '',
        estado_workflow: '',
    });
    const resultCount = Array.isArray(rows) ? rows.length : 0;

    useEffect(() => {
        setBandeja(bandejaParam ?? 'por-rol');
    }, [bandejaParam]);

    useEffect(() => {
        setError('');
        const req = bandeja === 'por-rol'
            ? bandejasApi.porRol(filters)
            : bandejasApi.listar(bandeja, filters);
        req.then((res) => setRows(res.data)).catch((err) => {
            setRows([]);
            setError(err?.message ?? 'No se pudo cargar la bandeja.');
        });
    }, [bandeja, filters]);

    return (
        <section className="grid gap-4">
            <PageHeader title={`Bandeja: ${bandeja.replaceAll('-', ' ')}`} subtitle={`${BANDEJA_DESCRIPCION[bandeja] ?? 'Mesa de trabajo documental.'} Resultados: ${resultCount}`} />
            <FilterBar onReset={() => setFilters({ q: '', curp: '', folio_interno: '', institucion_id: '', sede_id: '', ciclo_escolar_id: '', tipo_documento: '', estado_workflow: '' })}>
                <label className="grid gap-1 text-xs text-slate-600">
                    Bandeja
                    <select className="inst-select text-sm" value={bandeja} onChange={(e) => setBandeja(e.target.value)}>
                        {bandejas.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                </label>
                <FormField label="Busqueda general" value={filters.q} onChange={(v) => setFilters((s) => ({ ...s, q: v }))} />
                <FormField label="CURP" value={filters.curp} onChange={(v) => setFilters((s) => ({ ...s, curp: v }))} />
                <FormField label="Folio interno" value={filters.folio_interno} onChange={(v) => setFilters((s) => ({ ...s, folio_interno: v }))} />
                <FormField label="Institucion (ID)" value={filters.institucion_id} onChange={(v) => setFilters((s) => ({ ...s, institucion_id: v }))} />
                <FormField label="Sede (ID)" value={filters.sede_id} onChange={(v) => setFilters((s) => ({ ...s, sede_id: v }))} />
                <FormField label="Ciclo escolar (ID)" value={filters.ciclo_escolar_id} onChange={(v) => setFilters((s) => ({ ...s, ciclo_escolar_id: v }))} />
                <FormField label="Tipo documento" value={filters.tipo_documento} onChange={(v) => setFilters((s) => ({ ...s, tipo_documento: v }))} />
                <FormField label="Estado workflow" value={filters.estado_workflow} onChange={(v) => setFilters((s) => ({ ...s, estado_workflow: v }))} />
            </FilterBar>
            {error ? <ErrorState message={error} /> : null}
            {rows === null ? <LoadingState text="Cargando bandeja..." /> : rows.length === 0 ? <EmptyState title="No hay documentos en esta bandeja." description="Cuando se generen documentos para este estado, apareceran aqui." /> : <BandejaTable rows={rows} />}
            {rows && rows.length > 0 ? <p className="text-xs text-slate-500">Acciones sugeridas: <Link className="text-blue-700" to="/app/documentos/validacion">Ver validacion</Link> · <Link className="text-blue-700" to="/app/documentos/observaciones">Ver observaciones</Link></p> : null}
        </section>
    );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
import { catalogosApi } from '../../api/catalogos';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { RequirePermission } from '../../components/auth/RequirePermission';
import { FilterBar } from '../../components/ui/FilterBar';
import { PROC_TEC_PERM } from '../../utils/procesoTecnicoPermissions';
import { TecnicoEstadoBadge, estadoCadenaLabel, estadoFirmaLabel, estadoXmlLabel } from '../../utils/procesoTecnicoEstados';

const BANDEJAS = [
    { key: 'listos-para-firma', label: 'Listos para proceso técnico', desc: 'Liberados por certificación.' },
    { key: 'pendientes-tecnicos', label: 'Pendientes técnicos', desc: 'Aprobados sin artefactos completos.' },
    { key: 'errores-firma', label: 'Errores de firma', desc: 'Requieren revisión técnica.' },
];

export function ProcesoTecnicoCertificacionPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const bandejaIni = searchParams.get('bandeja') ?? 'listos-para-firma';
    const [bandeja, setBandeja] = useState(bandejaIni);
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });
    const [filters, setFilters] = useState({
        q: '',
        curp: '',
        institucion_id: '',
        sede_q: '',
        ciclo_escolar_id: '',
        tipo_certificacion: '',
        estado_tecnico: '',
    });

    useEffect(() => {
        setBandeja(searchParams.get('bandeja') ?? 'listos-para-firma');
    }, [searchParams]);

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
        const params = { ...filters };
        if (filters.estado_tecnico) {
            if (filters.estado_tecnico === 'cadena_pendiente') params.estado_cadena = 'pendiente';
            if (filters.estado_tecnico === 'xml_pendiente') params.estado_xml = 'pendiente';
            if (filters.estado_tecnico === 'listo') params.listo_para_firma = 1;
        }
        bandejasApi
            .listar(bandeja, params)
            .then((res) => {
                let data = Array.isArray(res.data) ? res.data : [];
                const term = filters.sede_q.trim().toLowerCase();
                if (term) {
                    data = data.filter((row) =>
                        `${row?.sede?.nombre ?? ''} ${row?.sede?.clave ?? ''}`.toLowerCase().includes(term),
                    );
                }
                setRows(data);
            })
            .catch((err) => {
                setRows([]);
                setError(err?.message ?? 'No se pudo cargar la bandeja técnica.');
            });
    }, [bandeja, filters]);

    function cambiarBandeja(key) {
        setBandeja(key);
        setSearchParams({ bandeja: key });
    }

    const meta = BANDEJAS.find((b) => b.key === bandeja);

    return (
        <RequirePermission anyOf={PROC_TEC_PERM.verBandeja}>
            <section className="grid gap-4">
                <PageHeader
                    title="Proceso Técnico de Certificación"
                    subtitle="Generación y validación técnica de cadena original, XML DEC y preflight antes de firma SEP. No ejecuta firma ni servicio 34 en esta fase."
                />

                <nav className="flex flex-wrap gap-2">
                    {BANDEJAS.map((b) => (
                        <button
                            key={b.key}
                            type="button"
                            className={bandeja === b.key ? 'inst-btn inst-btn-primary text-sm' : 'inst-btn inst-btn-secondary text-sm'}
                            onClick={() => cambiarBandeja(b.key)}
                        >
                            {b.label}
                        </button>
                    ))}
                </nav>

                <p className="text-sm text-slate-600">
                    {meta?.desc ?? ''} · {Array.isArray(rows) ? rows.length : 0} documentos
                </p>

                <FilterBar
                    onReset={() =>
                        setFilters({
                            q: '',
                            curp: '',
                            institucion_id: '',
                            sede_q: '',
                            ciclo_escolar_id: '',
                            tipo_certificacion: '',
                            estado_tecnico: '',
                        })
                    }
                >
                    <FormField label="Alumno / matrícula" value={filters.q} onChange={(v) => setFilters((s) => ({ ...s, q: v }))} />
                    <FormField label="CURP" value={filters.curp} onChange={(v) => setFilters((s) => ({ ...s, curp: v }))} />
                    <label className="grid gap-1 text-xs text-slate-600">
                        Institución
                        <select
                            className="inst-select text-sm"
                            value={filters.institucion_id}
                            onChange={(e) => setFilters((s) => ({ ...s, institucion_id: e.target.value }))}
                        >
                            <option value="">Todas</option>
                            {catalogos.instituciones.map((i) => (
                                <option key={i.id} value={i.id}>{i.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <FormField label="Sede / CCT" value={filters.sede_q} onChange={(v) => setFilters((s) => ({ ...s, sede_q: v }))} />
                    <label className="grid gap-1 text-xs text-slate-600">
                        Ciclo escolar
                        <select
                            className="inst-select text-sm"
                            value={filters.ciclo_escolar_id}
                            onChange={(e) => setFilters((s) => ({ ...s, ciclo_escolar_id: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            {catalogos.ciclos.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre ?? c.clave}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1 text-xs text-slate-600">
                        Tipo certificado
                        <select
                            className="inst-select text-sm"
                            value={filters.tipo_certificacion}
                            onChange={(e) => setFilters((s) => ({ ...s, tipo_certificacion: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            <option value="total">Total</option>
                            <option value="parcial">Parcial</option>
                        </select>
                    </label>
                    <label className="grid gap-1 text-xs text-slate-600">
                        Estado técnico
                        <select
                            className="inst-select text-sm"
                            value={filters.estado_tecnico}
                            onChange={(e) => setFilters((s) => ({ ...s, estado_tecnico: e.target.value }))}
                        >
                            <option value="">Todos</option>
                            <option value="listo">Liberado técnico</option>
                            <option value="cadena_pendiente">Cadena pendiente</option>
                            <option value="xml_pendiente">XML pendiente</option>
                        </select>
                    </label>
                </FilterBar>

                {error ? <ErrorState message={error} /> : null}
                {rows === null ? <LoadingState text="Cargando bandeja técnica…" /> : null}
                {rows !== null && rows.length === 0 ? <EmptyState text="Sin documentos en esta bandeja." /> : null}

                {rows !== null && rows.length > 0 ? (
                    <div className="overflow-x-auto inst-surface">
                        <table className="inst-table min-w-full text-sm">
                            <thead className="text-left">
                                <tr>
                                    <th className="px-3 py-2">Folio</th>
                                    <th className="px-3 py-2">Alumno</th>
                                    <th className="px-3 py-2">CURP</th>
                                    <th className="px-3 py-2">Matrícula</th>
                                    <th className="px-3 py-2">Institución / CCT</th>
                                    <th className="px-3 py-2">Programa / Plan</th>
                                    <th className="px-3 py-2">Tipo</th>
                                    <th className="px-3 py-2">Cadena</th>
                                    <th className="px-3 py-2">XML</th>
                                    <th className="px-3 py-2">Firma</th>
                                    <th className="px-3 py-2">Liberación</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-3 py-2">{row.folio_interno ?? '—'}</td>
                                        <td className="px-3 py-2">{row.alumno?.nombre_completo ?? row.alumno?.nombre ?? '—'}</td>
                                        <td className="px-3 py-2">{row.alumno?.curp ?? '—'}</td>
                                        <td className="px-3 py-2">{row.matricula?.matricula ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            {row.institucion?.nombre ?? '—'}
                                            <span className="block text-xs text-slate-500">{row.sede?.clave ?? ''}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.programa?.nombre ?? '—'}
                                            <span className="block text-xs text-slate-500">{row.plan?.nombre ?? ''}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.tipo_documento}
                                            <span className="block text-xs">{row.tipo_certificacion ?? ''}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <TecnicoEstadoBadge estado={estadoCadenaLabel(row.estado_cadena)} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <TecnicoEstadoBadge estado={estadoXmlLabel(row.estado_xml)} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <TecnicoEstadoBadge estado={estadoFirmaLabel(row)} />
                                        </td>
                                        <td className="px-3 py-2 text-xs">
                                            {row.listo_para_firma_marcado_en
                                                ? new Date(row.listo_para_firma_marcado_en).toLocaleString('es-MX')
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <Link
                                                to={`/app/sistemas/proceso-tecnico-certificacion/${row.id}`}
                                                className="inst-btn inst-btn-primary text-xs"
                                            >
                                                Abrir proceso técnico
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>
        </RequirePermission>
    );
}

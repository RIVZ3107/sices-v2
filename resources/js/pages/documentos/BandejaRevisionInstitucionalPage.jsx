import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bandejasApi } from '../../api/bandejas';
import { catalogosApi } from '../../api/catalogos';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { EstadoBadge } from '../../components/EstadoBadge';
import { FormField } from '../../components/FormField';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { FilterBar } from '../../components/ui/FilterBar';
import { ObservacionesBadge } from '../../components/ObservacionesBadge';
import { RequirePermission } from '../../components/auth/RequirePermission';

const BANDEJAS_REVISION = [
    { key: 'en-revision', label: 'En revisión', desc: 'Documentos enviados por Control Escolar.' },
    { key: 'pendientes-revision', label: 'Pendientes de revisión', desc: 'Dictaminación institucional pendiente.' },
    { key: 'rechazados', label: 'Observados / devueltos', desc: 'Devueltos a corrección.' },
    { key: 'aprobados', label: 'Aprobados', desc: 'Aprobación institucional.' },
    { key: 'listos-para-firma', label: 'Listos para proceso técnico', desc: 'Liberados para Sistemas.' },
];

const PERM_VER = ['ver_documentos', 'documentos.ver', 'certificacion.ver', 'validaciones_normativas.ver'];

export function BandejaRevisionInstitucionalPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const bandejaIni = searchParams.get('bandeja') ?? 'en-revision';
    const [bandeja, setBandeja] = useState(bandejaIni);
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });
    const [filters, setFilters] = useState({
        q: '',
        curp: '',
        folio_interno: '',
        institucion_id: '',
        sede_q: '',
        ciclo_escolar_id: '',
        tipo_documento: '',
        tipo_certificacion: '',
        estado_workflow: '',
    });

    useEffect(() => {
        setBandeja(searchParams.get('bandeja') ?? 'en-revision');
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
                setError(err?.message ?? 'No se pudo cargar la bandeja.');
            });
    }, [bandeja, filters]);

    function cambiarBandeja(key) {
        setBandeja(key);
        setSearchParams({ bandeja: key });
    }

    const meta = BANDEJAS_REVISION.find((b) => b.key === bandeja);

    return (
        <RequirePermission anyOf={PERM_VER}>
            <section className="grid gap-4">
                <PageHeader
                    title="Revisión de certificación"
                    subtitle="Revisión institucional de documentos académicos enviados por Control Escolar."
                />

                <nav className="flex flex-wrap gap-2">
                    {BANDEJAS_REVISION.map((b) => (
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

                <p className="text-sm text-slate-600">{meta?.desc ?? ''} · {Array.isArray(rows) ? rows.length : 0} resultados</p>

                <FilterBar
                    onReset={() =>
                        setFilters({
                            q: '',
                            curp: '',
                            folio_interno: '',
                            institucion_id: '',
                            sede_q: '',
                            ciclo_escolar_id: '',
                            tipo_documento: '',
                            tipo_certificacion: '',
                            estado_workflow: '',
                        })
                    }
                >
                    <FormField label="Buscar alumno" value={filters.q} onChange={(v) => setFilters((s) => ({ ...s, q: v }))} />
                    <FormField label="CURP" value={filters.curp} onChange={(v) => setFilters((s) => ({ ...s, curp: v }))} />
                    <FormField label="Folio interno" value={filters.folio_interno} onChange={(v) => setFilters((s) => ({ ...s, folio_interno: v }))} />
                    <label className="grid gap-1 text-xs text-slate-600">
                        Institución
                        <select
                            className="inst-select text-sm"
                            value={filters.institucion_id}
                            onChange={(e) => setFilters((s) => ({ ...s, institucion_id: e.target.value }))}
                        >
                            <option value="">Todas</option>
                            {catalogos.instituciones.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                    <FormField label="Sede / CCT" value={filters.sede_q} onChange={(v) => setFilters((s) => ({ ...s, sede_q: v }))} />
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
                </FilterBar>

                {error ? <ErrorState message={error} /> : null}
                {rows === null ? <LoadingState text="Cargando documentos…" /> : null}
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
                                    <th className="px-3 py-2">Estado</th>
                                    <th className="px-3 py-2">Envío</th>
                                    <th className="px-3 py-2">Obs.</th>
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
                                            <span className="block text-xs text-slate-500">{row.sede?.clave ?? row.sede?.nombre ?? ''}</span>
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
                                            <EstadoBadge estado={row.estado_workflow} />
                                        </td>
                                        <td className="px-3 py-2 text-xs">
                                            {row.fecha_solicitud ? new Date(row.fecha_solicitud).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <ObservacionesBadge
                                                pendientes={row.observaciones_pendientes_count ?? 0}
                                                total={row.observaciones_total_count ?? 0}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Link
                                                to={`/app/certificacion/revision/${row.id}`}
                                                className="inst-btn inst-btn-primary text-xs"
                                            >
                                                Revisar
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

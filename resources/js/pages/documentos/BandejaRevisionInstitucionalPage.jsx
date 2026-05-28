import { useEffect, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { bandejasApi } from '../../api/bandejas';

import { catalogosApi } from '../../api/catalogos';

import {

    RevisionBandejaToolbar,

    REVISION_BANDEJA_FILTERS_INITIAL,

} from '../../components/documentos/RevisionBandejaToolbar';

import { EmptyState } from '../../components/EmptyState';

import { ErrorState } from '../../components/ErrorState';

import { EstadoBadge } from '../../components/EstadoBadge';

import { LoadingState } from '../../components/LoadingState';

import { PageHeader } from '../../components/PageHeader';

import { ObservacionesBadge } from '../../components/ObservacionesBadge';

import { RequirePermission } from '../../components/auth/RequirePermission';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';

import { revisionInstitucionalDetallePath } from '../../utils/certificacionRoutes';



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

    const [advancedOpen, setAdvancedOpen] = useState(false);

    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });

    const [filters, setFilters] = useState({ ...REVISION_BANDEJA_FILTERS_INITIAL });

    const filtersDebounced = useDebouncedValue(filters, 400);



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

        setRows(null);

        const params = { ...filtersDebounced };

        bandejasApi

            .listar(bandeja, params)

            .then((res) => {

                let data = Array.isArray(res.data) ? res.data : [];

                const term = filtersDebounced.sede_q.trim().toLowerCase();

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

    }, [bandeja, filtersDebounced]);



    function cambiarBandeja(key) {

        setBandeja(key);

        setSearchParams({ bandeja: key });

    }



    const meta = BANDEJAS_REVISION.find((b) => b.key === bandeja);

    const total = Array.isArray(rows) ? rows.length : 0;

    const loading = rows === null;



    return (

        <RequirePermission anyOf={PERM_VER}>

            <section className="grid gap-4">

                <PageHeader

                    title="Revisión de certificación"

                    subtitle="Revisión institucional de documentos académicos enviados por Control Escolar."

                />



                <nav className="inst-bandeja-tabs" aria-label="Bandejas de revisión">

                    {BANDEJAS_REVISION.map((b) => (

                        <button

                            key={b.key}

                            type="button"

                            className={`inst-bandeja-tab ${bandeja === b.key ? 'is-active' : ''}`}

                            onClick={() => cambiarBandeja(b.key)}

                        >

                            {b.label}

                        </button>

                    ))}

                </nav>



                <div className="inst-bandeja-meta">

                    <span>{meta?.desc ?? ''}</span>

                    <span>

                        {loading ? 'Cargando…' : `${total} resultado${total === 1 ? '' : 's'}`}

                    </span>

                </div>



                <RevisionBandejaToolbar

                    filters={filters}

                    setFilters={setFilters}

                    catalogos={catalogos}

                    advancedOpen={advancedOpen}

                    onToggleAdvanced={() => setAdvancedOpen((v) => !v)}

                />



                {error ? <ErrorState message={error} /> : null}

                {loading ? <LoadingState text="Cargando documentos…" /> : null}

                {!loading && rows.length === 0 ? <EmptyState text="Sin documentos en esta bandeja." /> : null}



                {!loading && rows.length > 0 ? (

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

                                                to={revisionInstitucionalDetallePath(row.id)}

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



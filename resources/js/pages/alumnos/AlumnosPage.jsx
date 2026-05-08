import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { SubsystemBadge } from '../../components/ui/SubsystemBadge';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { SectionCard } from '../../components/ui/SectionCard';

export function AlumnosPage() {
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [resumenByAlumno, setResumenByAlumno] = useState({});

    async function buscar() {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            const res = await alumnosApi.list({ q: query, curp: query });
            const data = res?.data?.data || res?.data || [];
            setRows(data);
            const ids = data.map((r) => Number(r.id)).filter((id) => id > 0).slice(0, 20);
            const resumenes = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const rr = await alumnosApi.resumenInstitucional(id);
                        return [id, rr?.data ?? null];
                    } catch {
                        return [id, null];
                    }
                }),
            );
            setResumenByAlumno(Object.fromEntries(resumenes));
        } catch (err) {
            setRows([]);
            setError(err?.message ?? 'No fue posible consultar alumnos. Intenta nuevamente.');
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        buscar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Alumnos"
                subtitle="Captura, consulta y actualización de expedientes de alumnos."
                actions={<Link to="/app/alumnos/crear" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Crear alumno</Link>}
            />
            <SectionCard title="Buscador de alumnos" subtitle="Consulta por CURP o nombre completo.">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <FormField label="Buscar por CURP o nombre completo" value={query} onChange={setQuery} placeholder="CURP o nombre completo" />
                    <div className="self-end"><ActionButton onClick={buscar} disabled={busy}>{busy ? 'Buscando...' : 'Buscar'}</ActionButton></div>
                </div>
            </SectionCard>
            {error ? <ErrorState message={error} /> : null}
            <DataTable
                columns={[
                    { key: 'curp', label: 'CURP' },
                    { key: 'nombre', label: 'Nombre', render: (r) => `${r.nombre} ${r.primer_apellido ?? ''} ${r.segundo_apellido ?? ''}` },
                    { key: 'matricula', label: 'Matrícula activa', render: (r) => resumenByAlumno[r.id]?.matricula?.clave_matricula ?? 'Sin matrícula activa' },
                    { key: 'subsistema', label: 'Subsistema', render: (r) => <SubsystemBadge label={resumenByAlumno[r.id]?.matricula?.subsistema ?? 'N/D'} /> },
                    { key: 'plan', label: 'Programa / Plan', render: (r) => `${resumenByAlumno[r.id]?.matricula?.programa ?? 'Sin programa'} / ${resumenByAlumno[r.id]?.matricula?.plan_estudios ?? 'Sin plan'}` },
                    { key: 'estatus', label: 'Estado académico', render: (r) => r.estatus ?? 'activo' },
                    {
                        key: 'acciones',
                        label: 'Acciones',
                        render: (r) => (
                            <div className="flex flex-wrap gap-2 items-center">
                                <Link className="text-emerald-800 font-medium underline underline-offset-2" to={`/app/alumnos/${r.id}/expediente`}>
                                    Expediente 360
                                </Link>
                                <Link className="text-slate-600 text-xs underline" to={`/app/alumnos/${r.id}/captura-guiado`}>
                                    Continuar captura
                                </Link>
                                <Link className="text-slate-600 text-xs underline" to={`/app/alumnos/${r.id}/trayectoria`}>
                                    Ver trayectoria
                                </Link>
                                <Link className="text-slate-600 text-xs underline" to={`/app/certificacion/solicitud?alumno=${r.id}`}>
                                    Solicitar certificado
                                </Link>
                            </div>
                        ),
                    },
                ]}
                rows={rows}
                emptyText="No hay alumnos en la búsqueda actual."
            />
        </section>
    );
}
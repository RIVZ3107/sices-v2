import { useState } from 'react';
import { Link } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
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

        async function buscar() {
            if (busy) return;
            setBusy(true);
                setError('');
                try {
                    const res = await alumnosApi.list({ q: query, curp: query });
                    setRows(res?.data?.data || res?.data || []);
                } catch (err) {
                    setRows([]);
                    setError(err?.message ?? 'No fue posible consultar alumnos. Intenta nuevamente.');
                } finally {
                    setBusy(false);
                }
            }

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
                    { key: 'estatus', label: 'Estatus', render: (r) => r.estatus ?? 'activo' },
                ]}
                rows={rows}
                emptyText="No hay alumnos en la búsqueda actual."
            />
        </section>
    );
}
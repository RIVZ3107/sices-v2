import { useState } from 'react';
import { importacionesApi } from '../../api/importaciones';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';

export function ImportacionesAcademicasPage() {
    const [form, setForm] = useState({
        tipo: 'materias_cursadas',
        ciclo_escolar_id: '',
        institucion_id: '',
        sede_id: '',
    });
    const [message, setMessage] = useState(
        'Modulo de importacion academica pendiente de activar en backend.',
    );
    const [error, setError] = useState('');

    async function verificarBackend() {
        setError('');
        try {
            await importacionesApi.list();
            setMessage('Backend de importaciones disponible. Puedes continuar con prevalidacion y confirmacion.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo consultar importaciones.');
            setMessage('Modulo de importacion academica pendiente de activar en backend.');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Importaciones academicas"
                subtitle="Carga operativa de materias cursadas por archivo, sujeta a endpoints backend."
                actions={<ActionButton variant="secondary" onClick={verificarBackend}>Verificar backend</ActionButton>}
            />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="Tipo" value={form.tipo} onChange={(v) => setForm((s) => ({ ...s, tipo: v }))} />
                    <FormField label="Ciclo escolar ID" value={form.ciclo_escolar_id} onChange={(v) => setForm((s) => ({ ...s, ciclo_escolar_id: v }))} />
                    <FormField label="Institucion ID" value={form.institucion_id} onChange={(v) => setForm((s) => ({ ...s, institucion_id: v }))} />
                    <FormField label="Sede ID" value={form.sede_id} onChange={(v) => setForm((s) => ({ ...s, sede_id: v }))} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                    {message}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                    Flujos de prevalidar, confirmar, cancelar y descarga de plantilla se habilitan automaticamente al activarse endpoints de importacion.
                </p>
            </div>
        </section>
    );
}

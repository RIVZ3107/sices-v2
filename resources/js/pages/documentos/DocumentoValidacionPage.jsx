import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { validacionesApi } from '../../api/validaciones';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { ValidacionResumenCard } from '../../components/ValidacionResumenCard';
import { AlertBox } from '../../components/ui/AlertBox';

export function DocumentoValidacionPage() {
    const { id } = useParams();
    const [documentoId, setDocumentoId] = useState(id ?? '');
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState('');

    async function consultar(e) {
        e.preventDefault();
        setError('');
        try {
            const res = await validacionesApi.documento(documentoId);
            setResumen(res.data.resumen);
        } catch (err) {
            setResumen(null);
            setError(err?.response?.data?.message ?? 'No se pudo validar');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Validacion academica" subtitle="Semaforo operativo para revision, aprobacion y preparacion de firma." />
            <AlertBox type="info" message="Consulta la validacion antes de enviar a revision, aprobar o preparar para firma." />
            <form className="inst-surface p-4" onSubmit={consultar}>
                <FormField label="ID documento" value={documentoId} onChange={setDocumentoId} placeholder="ID documento" />
                <button className="inst-btn inst-btn-primary ml-2 text-sm">Consultar</button>
            </form>
            {error ? <ErrorState message={error} /> : null}
            <ValidacionResumenCard resumen={resumen} />
        </section>
    );
}

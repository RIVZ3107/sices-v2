import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import { AtenderObservacionForm } from '../../components/AtenderObservacionForm';
import { ErrorState } from '../../components/ErrorState';
import { ObservacionForm } from '../../components/ObservacionForm';
import { ObservacionesPanel } from '../../components/ObservacionesPanel';
import { PageHeader } from '../../components/PageHeader';
import { observacionesApi } from '../../api/observaciones';
import { AlertBox } from '../../components/ui/AlertBox';
export function DocumentoObservacionesPage() {
    const { id } = useParams();
    const [documentoId, setDocumentoId] = useState(id ?? '');
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function cargar() {
        setError('');
        setMsg('');
        try {
            const res = await observacionesApi.listar(documentoId);
            setItems(res?.data ?? []);
        } catch (err) {
            setError(err?.message ?? 'No se pudieron cargar observaciones.');
        }
    }

    async function registrar(payload) {
        setError('');
        setMsg('');
        try {
            await observacionesApi.crear(documentoId, payload);
            setMsg('Observacion registrada');
            await cargar();
        } catch (err) {
            setError(err?.message ?? 'No se pudo registrar');
        }
    }

    async function atender({ observacionId, payload }) {
        setError('');
        setMsg('');
        try {
            await observacionesApi.atender(documentoId, observacionId, payload);
            setMsg('Observacion atendida.');
            await cargar();
        } catch (err) {
            setError(err?.message ?? 'No se pudo atender observacion');
        }
    }

    async function devolver() {
        setError('');
        setMsg('');
        try {
            await observacionesApi.devolver(documentoId, { motivo: 'Devuelto a correccion desde frontend.' });
            setMsg('Documento devuelto a correccion.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo devolver a correccion.');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Observaciones" subtitle="Gestion de observaciones, atencion y devolucion a correccion." />
            <div className="inst-surface p-4">
                <div className="flex flex-wrap gap-2">
                    <input className="inst-input text-sm" placeholder="ID documento" value={documentoId} onChange={(e) => setDocumentoId(e.target.value)} />
                    <ActionButton variant="secondary" onClick={cargar}>Cargar observaciones</ActionButton>
                    <ActionButton variant="danger" onClick={devolver}>Devolver a correccion</ActionButton>
                </div>
            </div>
            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}
            <ObservacionForm onSubmit={registrar} disabled={!documentoId} />
            <AtenderObservacionForm onSubmit={atender} disabled={!documentoId} />
            <ObservacionesPanel items={items} />
        </section>
    );
}

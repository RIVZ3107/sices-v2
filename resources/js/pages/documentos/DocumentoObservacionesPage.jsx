import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import { AtenderObservacionForm } from '../../components/AtenderObservacionForm';
import { ErrorState } from '../../components/ErrorState';
import { ObservacionesPanel } from '../../components/ObservacionesPanel';
import { PageHeader } from '../../components/PageHeader';
import { observacionesApi } from '../../api/observaciones';
import { bandejasApi } from '../../api/bandejas';
import { AlertBox } from '../../components/ui/AlertBox';
export function DocumentoObservacionesPage() {
    const { id } = useParams();
    const [documentoId, setDocumentoId] = useState(id ?? '');
    const [q, setQ] = useState('');
    const [docs, setDocs] = useState([]);
    const [items, setItems] = useState([]);
    const [observacionSel, setObservacionSel] = useState(null);
    useEffect(() => {
        bandejasApi.porRol({ per_page: 50 }).then((res) => {
            setDocs(Array.isArray(res?.data) ? res.data : []);
        }).catch(() => setDocs([]));
    }, []);

    useEffect(() => {
        if (documentoId) {
            void cargar();
        } else {
            setItems([]);
            setObservacionSel(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [documentoId]);

    const docsFiltrados = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return docs;
        return docs.filter((d) => {
            const nombre = `${d?.alumno?.nombre ?? ''}`.toLowerCase();
            const curp = `${d?.alumno?.curp ?? ''}`.toLowerCase();
            const folio = `${d?.folio_interno ?? ''}`.toLowerCase();
            return nombre.includes(term) || curp.includes(term) || folio.includes(term);
        });
    }, [docs, q]);

    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function cargar() {
        setError('');
        setMsg('');
        try {
            const res = await observacionesApi.listar(documentoId);
            const data = Array.isArray(res?.data) ? res.data : [];
            setItems(data);
            setObservacionSel(data.find((x) => x.estado === 'pendiente') ?? null);
        } catch (err) {
            setError(err?.message ?? 'No se pudieron cargar observaciones.');
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
            <PageHeader title="Observaciones del expediente" subtitle="Atención de observaciones pendientes del flujo documental institucional." />
            <div className="inst-surface p-4">
                <div className="flex flex-wrap gap-2">
                    <input className="inst-input text-sm" placeholder="Buscar por alumno, CURP, matrícula o folio" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="inst-select text-sm" value={documentoId} onChange={(e) => setDocumentoId(e.target.value)}>
                        <option value="">Seleccionar expediente documental...</option>
                        {docsFiltrados.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.alumno?.nombre ?? 'Alumno'} · {d.alumno?.curp ?? 'CURP'} · {d.folio_interno ?? 'Sin folio'}
                            </option>
                        ))}
                    </select>
                    <ActionButton variant="secondary" onClick={cargar} disabled={!documentoId}>Cargar observaciones</ActionButton>
                    <ActionButton variant="danger" onClick={devolver} disabled={!documentoId}>Marcar para corrección</ActionButton>
                </div>
                {!documentoId ? <p className="mt-2 text-xs text-amber-700">Acción bloqueada: no hay alumno/documento seleccionado.</p> : null}
            </div>
            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}
            <ObservacionesPanel items={items} onSelect={(item) => setObservacionSel(item)} selectedId={observacionSel?.id ?? null} />
            {observacionSel?.id ? <AtenderObservacionForm onSubmit={atender} disabled={!documentoId || !observacionSel?.id} observacionId={observacionSel?.id ?? ''} /> : null}
            {!observacionSel?.id ? <p className="text-xs text-amber-700">Selecciona una observación pendiente para atenderla.</p> : null}
            {documentoId ? <Link to={`/app/documentos/${documentoId}`} className="text-sm text-blue-700 hover:underline">Ver expediente</Link> : null}
        </section>
    );
}

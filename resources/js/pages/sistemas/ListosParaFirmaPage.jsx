import { useEffect, useMemo, useState } from 'react';
import { bandejasApi } from '../../api/bandejas';
import { decNormalApi } from '../../api/decNormal';
import { BandejaTable } from '../../components/BandejaTable';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';

export function ListosParaFirmaPage() {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');
    const [docId, setDocId] = useState('');
    const [running, setRunning] = useState(false);
    const [resultado, setResultado] = useState(null);

    const documentos = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

    useEffect(() => {
        bandejasApi.listar('listos-para-firma')
            .then((res) => setRows(res.data))
            .catch((err) => {
                setRows([]);
                setError(err?.message ?? 'No se pudo cargar la bandeja listos para firma.');
            });
    }, []);

    const ejecutar = async (accion) => {
        if (!docId) return;
        setRunning(true);
        setResultado(null);
        setError('');
        try {
            const id = Number(docId);
            const map = {
                payload: decNormalApi.generarPayload,
                cadena: decNormalApi.generarCadena,
                xml: decNormalApi.generarXml,
                validar: decNormalApi.validarXml,
                errores: decNormalApi.errores,
            };
            const res = await map[accion](id);
            setResultado(res?.data?.data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? err?.message ?? 'Operacion DEC no disponible.');
        } finally {
            setRunning(false);
        }
    };

    if (rows === null) return <LoadingState text="Cargando listos para firma..." />;

    return (
        <section className="grid gap-4">
            <PageHeader title="Sistemas · Listos para firma" subtitle="Consulta tecnica de documentos aprobados y marcados como listos para firma." />
            <div className="inst-surface-muted p-3 text-sm text-amber-800">
                La firma real SEP/since-service y PDF oficial se implementan en sprint posterior. Esta vista ejecuta DEC Normal en modo controlado.
            </div>
            <div className="inst-surface p-3 grid gap-3">
                <div className="text-sm font-semibold">DEC Normal controlado</div>
                <div className="flex flex-wrap items-center gap-2">
                    <select className="inst-input max-w-md" value={docId} onChange={(e) => setDocId(e.target.value)}>
                        <option value="">Seleccionar documento...</option>
                        {documentos.map((row) => (
                            <option key={row.id} value={row.id}>
                                #{row.id} · {row.alumno?.nombre_completo ?? row.alumno?.nombre ?? 'Alumno'} · {row.alumno?.curp ?? 'CURP'}
                            </option>
                        ))}
                    </select>
                    <button className="inst-btn" disabled={!docId || running} onClick={() => ejecutar('payload')}>Generar payload</button>
                    <button className="inst-btn" disabled={!docId || running} onClick={() => ejecutar('cadena')}>Generar cadena</button>
                    <button className="inst-btn" disabled={!docId || running} onClick={() => ejecutar('xml')}>Generar XML</button>
                    <button className="inst-btn" disabled={!docId || running} onClick={() => ejecutar('validar')}>Validar XSD</button>
                    <button className="inst-btn" disabled={!docId || running} onClick={() => ejecutar('errores')}>Ver errores</button>
                </div>
                {resultado ? (
                    <pre className="inst-surface-muted p-3 overflow-auto text-xs">{JSON.stringify(resultado, null, 2)}</pre>
                ) : null}
            </div>
            {error ? <ErrorState message={error} /> : null}
            <BandejaTable rows={rows} />
        </section>
    );
}

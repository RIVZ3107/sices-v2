import { useEffect, useState } from 'react';
import { bandejasApi } from '../../api/bandejas';
import { BandejaTable } from '../../components/BandejaTable';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';

export function ListosParaFirmaPage() {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        bandejasApi.listar('listos-para-firma')
            .then((res) => setRows(res.data))
            .catch((err) => {
                setRows([]);
                setError(err?.message ?? 'No se pudo cargar la bandeja listos para firma.');
            });
    }, []);

    if (rows === null) return <LoadingState text="Cargando listos para firma..." />;

    return (
        <section className="grid gap-4">
            <PageHeader title="Sistemas · Listos para firma" subtitle="Consulta tecnica de documentos aprobados y marcados como listos para firma." />
            <div className="inst-surface-muted p-3 text-sm text-amber-800">
                La firma real SEP/since-service sera implementada en un bloque posterior.
            </div>
            {error ? <ErrorState message={error} /> : null}
            <BandejaTable rows={rows} />
        </section>
    );
}

import { useState } from 'react';
import { trayectoriasApi } from '../../api/trayectorias';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
export function TrayectoriaPage() {
    const [form, setForm] = useState({
        matricula_id: '',
        alumno_id: '',
        promedio: '',
        promedio_texto: '',
        creditos_obtenidos: '',
        creditos_totales: '',
        total_materias: '',
        materias_aprobadas: '',
        materias_reprobadas: '',
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'activa',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function guardar() {  
        if (busy) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            await trayectoriasApi.upsert({
                matricula_id: Number(form.matricula_id),
                alumno_id: Number(form.alumno_id),
                fecha_inicio: form.fecha_inicio || null,
                fecha_fin: form.fecha_fin || null,
                promedio: Number(form.promedio || 0),
                promedio_texto: form.promedio_texto || null,
                creditos_obtenidos: Number(form.creditos_obtenidos || 0),
                creditos_totales: Number(form.creditos_totales || 0),
                total_materias: Number(form.total_materias || 0),
                materias_aprobadas: Number(form.materias_aprobadas || 0),
                materias_reprobadas: Number(form.materias_reprobadas || 0)
            });
            setMessage('Trayectoria guardada correctamente.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo guardar la trayectoria. Intenta nuevamente.');
        } finally {
            setBusy(false);
        }
    }

    async function consultarResumen() { 
        if (busy) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await trayectoriasApi.porMatricula(form.matricula_id);
            const t = res?.data ?? {};
            setForm((s) => ({
                ...s,
                promedio: String(t.promedio ?? ''),
                total_materias: String(t.total_materias ?? ''),
                materias_aprobadas: String(t.materias_aprobadas ?? ''),
                materias_reprobadas: String(t.materias_reprobadas ?? ''),
                estado: t.estado ?? s.estado,
            }));
            setMessage('Resumen de trayectoria cargado correctamente.');
        } catch (err) {
            setError(
                err?.status === 404
                    ? 'Consulta/recalculo de trayectoria por matricula pendiente de activacion en backend.'
                    : err?.message ?? 'No se pudo consultar trayectoria. Intenta nuevamente.',
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Trayectoria academica" subtitle="Captura y revision de resumen academico por matricula." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="Matricula ID" value={form.matricula_id} onChange={(v) => setForm((s) => ({ ...s, matricula_id: v }))} />
                    <FormField label="Alumno ID" value={form.alumno_id} onChange={(v) => setForm((s) => ({ ...s, alumno_id: v }))} />
                    <FormField label="Promedio" value={form.promedio} onChange={(v) => setForm((s) => ({ ...s, promedio: v }))} type="number" />
                    <FormField label="Promedio texto (referencia)" value={form.promedio_texto} onChange={(v) => setForm((s) => ({ ...s, promedio_texto: v }))} />
                    <FormField label="Creditos obtenidos (referencia)" value={form.creditos_obtenidos} onChange={(v) => setForm((s) => ({ ...s, creditos_obtenidos: v }))} />
                    <FormField label="Creditos totales (referencia)" value={form.creditos_totales} onChange={(v) => setForm((s) => ({ ...s, creditos_totales: v }))} />
                    <FormField label="Total materias" value={form.total_materias} onChange={(v) => setForm((s) => ({ ...s, total_materias: v }))} type="number" />
                    <FormField label="Materias aprobadas" value={form.materias_aprobadas} onChange={(v) => setForm((s) => ({ ...s, materias_aprobadas: v }))} type="number" />
                    <FormField label="Materias reprobadas" value={form.materias_reprobadas} onChange={(v) => setForm((s) => ({ ...s, materias_reprobadas: v }))} type="number" />
                    <FormField label="Fecha inicio (referencia)" value={form.fecha_inicio} onChange={(v) => setForm((s) => ({ ...s, fecha_inicio: v }))} type="date" />
                    <FormField label="Fecha fin (referencia)" value={form.fecha_fin} onChange={(v) => setForm((s) => ({ ...s, fecha_fin: v }))} type="date" />
                    <FormField label="Estado" value={form.estado} onChange={(v) => setForm((s) => ({ ...s, estado: v }))} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton onClick={guardar} disabled={busy}>{busy ? 'Guardando...' : 'Guardar trayectoria'}</ActionButton>
                    <ActionButton variant="secondary" onClick={consultarResumen} disabled={busy}>{busy ? 'Consultando...' : 'Consultar por matricula'}</ActionButton>
                </div>
                {message ? <AlertBox type="success" message={message} /> : null}
            </div>
        </section>
    );
}

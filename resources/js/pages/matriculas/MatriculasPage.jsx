import { useState } from 'react';
import { matriculasApi } from '../../api/matriculas';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';

export function MatriculasPage() {
    const [form, setForm] = useState({
        id: '',
        alumno_id: '',
        oferta_academica_id: '',
        ciclo_escolar_id: '',
        matricula: '',
        estado: 'activa',
        fecha_ingreso: '',
        fecha_egreso: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const canCreate = Number(form.alumno_id) > 0 && Number(form.oferta_academica_id) > 0 && Number(form.ciclo_escolar_id) > 0;

    async function crear() {
        if (busy) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await matriculasApi.create({
                alumno_id: Number(form.alumno_id),
                oferta_academica_id: Number(form.oferta_academica_id),
                ciclo_escolar_id: Number(form.ciclo_escolar_id),
                matricula: form.matricula,
                estado: form.estado,
                fecha_ingreso: form.fecha_ingreso || null,
                fecha_egreso: form.fecha_egreso || null,
            });
            setForm((s) => ({ ...s, id: String(res?.data?.id ?? '') }));
            setMessage(`Matrícula creada con ID ${res?.data?.id}.`);
        } catch (err) {
            setError(err?.message ?? 'No se pudo crear la matrícula.');
        } finally {
            setBusy(false);
        }
    }

    async function consultar() {
        if (!form.id) return;
        setError('');
        setMessage('');
        try {
            const res = await matriculasApi.show(form.id);
            const m = res?.data ?? {};
            setForm((s) => ({
                ...s,
                alumno_id: String(m.alumno_id ?? ''),
                oferta_academica_id: String(m.oferta_academica_id ?? ''),
                ciclo_escolar_id: String(m.ciclo_escolar_id ?? ''),
                matricula: m.matricula ?? '',
                estado: m.estado ?? 'activa',
                fecha_ingreso: m.fecha_ingreso ?? '',
                fecha_egreso: m.fecha_egreso ?? '',
            }));
            setMessage('Matrícula cargada.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo consultar la matrícula.');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Matrículas" subtitle="Captura y consulta de matrículas. El listado global depende de endpoint backend." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="ID (consulta)" value={form.id} onChange={(v) => setForm((s) => ({ ...s, id: v }))} />
                    <FormField label="Alumno ID" value={form.alumno_id} onChange={(v) => setForm((s) => ({ ...s, alumno_id: v }))} />
                    <FormField label="Oferta academica ID" value={form.oferta_academica_id} onChange={(v) => setForm((s) => ({ ...s, oferta_academica_id: v }))} />
                    <FormField label="Ciclo escolar ID" value={form.ciclo_escolar_id} onChange={(v) => setForm((s) => ({ ...s, ciclo_escolar_id: v }))} />
                    <FormField label="Matrícula" value={form.matricula} onChange={(v) => setForm((s) => ({ ...s, matricula: v }))} />
                    <FormField label="Estado" value={form.estado} onChange={(v) => setForm((s) => ({ ...s, estado: v }))} />
                    <FormField label="Fecha ingreso (referencia)" value={form.fecha_ingreso} onChange={(v) => setForm((s) => ({ ...s, fecha_ingreso: v }))} type="date" />
                    <FormField label="Fecha egreso (referencia)" value={form.fecha_egreso} onChange={(v) => setForm((s) => ({ ...s, fecha_egreso: v }))} type="date" />
                </div>
                <div className="mt-4 flex gap-2">
                    <ActionButton onClick={crear} disabled={busy || !canCreate}>{busy ? 'Creando...' : 'Crear matrícula'}</ActionButton>
                    <ActionButton variant="secondary" onClick={consultar} disabled={busy}>{busy ? 'Consultando...' : 'Consultar por ID'}</ActionButton>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                    Regla institucional activa: una sola matrícula por alumno. Si el alumno ya tiene matrícula, backend rechazará la alta.
                </p>
                {message ? <AlertBox type="success" message={message} /> : null}
            </div>
        </section>
    );
}

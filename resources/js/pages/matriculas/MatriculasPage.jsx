import { useState } from 'react';
import { matriculasApi } from '../../api/matriculas';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';

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

    async function crear() {
        setError('');
        setMessage('');
        try {
            const res = await matriculasApi.create({
                alumno_id: Number(form.alumno_id),
                oferta_academica_id: Number(form.oferta_academica_id),
                ciclo_escolar_id: Number(form.ciclo_escolar_id),
                matricula: form.matricula,
                estado: form.estado,
            });
            setForm((s) => ({ ...s, id: String(res?.data?.id ?? '') }));
            setMessage(`Matricula creada con ID ${res?.data?.id}.`);
        } catch (err) {
            setError(err?.message ?? 'No se pudo crear la matricula.');
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
            }));
            setMessage('Matricula cargada.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo consultar la matricula.');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Matriculas" subtitle="Captura y consulta de matriculas. El listado global depende de endpoint backend." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="ID (consulta)" value={form.id} onChange={(v) => setForm((s) => ({ ...s, id: v }))} />
                    <FormField label="Alumno ID" value={form.alumno_id} onChange={(v) => setForm((s) => ({ ...s, alumno_id: v }))} />
                    <FormField label="Oferta academica ID" value={form.oferta_academica_id} onChange={(v) => setForm((s) => ({ ...s, oferta_academica_id: v }))} />
                    <FormField label="Ciclo escolar ID" value={form.ciclo_escolar_id} onChange={(v) => setForm((s) => ({ ...s, ciclo_escolar_id: v }))} />
                    <FormField label="Matricula" value={form.matricula} onChange={(v) => setForm((s) => ({ ...s, matricula: v }))} />
                    <FormField label="Estado" value={form.estado} onChange={(v) => setForm((s) => ({ ...s, estado: v }))} />
                    <FormField label="Fecha ingreso (referencia)" value={form.fecha_ingreso} onChange={(v) => setForm((s) => ({ ...s, fecha_ingreso: v }))} type="date" />
                    <FormField label="Fecha egreso (referencia)" value={form.fecha_egreso} onChange={(v) => setForm((s) => ({ ...s, fecha_egreso: v }))} type="date" />
                </div>
                <div className="mt-4 flex gap-2">
                    <ActionButton onClick={crear}>Crear matricula</ActionButton>
                    <ActionButton variant="secondary" onClick={consultar}>Consultar por ID</ActionButton>
                </div>
                {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
            </div>
        </section>
    );
}

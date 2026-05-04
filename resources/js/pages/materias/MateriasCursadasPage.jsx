import { useState } from 'react';
import { materiasCursadasApi } from '../../api/materiasCursadas';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
export function MateriasCursadasPage() {
    const [form, setForm] = useState({
        alumno_id: '',
        matricula_id: '',
        ciclo_escolar_id: '',
        clave: '',
        nombre: '',
        calificacion: '',
        calificacion_texto: '',
        periodo: '',
        semestre: '',
        creditos: '',
        tipo: '',
        estado: 'acreditada',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function guardar() {
        setError('');
        setMessage('');
        try {
            await materiasCursadasApi.create({
                alumno_id: Number(form.alumno_id),
                matricula_id: Number(form.matricula_id),
                ciclo_escolar_id: Number(form.ciclo_escolar_id),
                clave: form.clave,
                nombre: form.nombre,
                calificacion: Number(form.calificacion || 0),
                periodo: form.periodo || null,
                semestre: Number(form.semestre || 1),
                creditos: Number(form.creditos || 0),
                tipo: form.tipo || null,
                estado: form.estado || null,
            });
            setMessage('Materia cursada registrada.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo registrar la materia.');
        }
    }

    async function intentarListar() {
        setError('');
        setMessage('');
        try {
            await materiasCursadasApi.list({ matricula_id: form.matricula_id || undefined });
            setMessage('Endpoint de listado disponible.');
        } catch (err) {
            setError(
                err?.status === 404
                    ? 'El listado/edicion/eliminacion de materias cursadas aun no esta habilitado en backend.'
                    : err?.message ?? 'No se pudo consultar materias.',
            );
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Materias y calificaciones" subtitle="Captura de materias cursadas por matricula." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="Alumno ID" value={form.alumno_id} onChange={(v) => setForm((s) => ({ ...s, alumno_id: v }))} />
                    <FormField label="Matricula ID" value={form.matricula_id} onChange={(v) => setForm((s) => ({ ...s, matricula_id: v }))} />
                    <FormField label="Ciclo escolar ID" value={form.ciclo_escolar_id} onChange={(v) => setForm((s) => ({ ...s, ciclo_escolar_id: v }))} />
                    <FormField label="Clave materia" value={form.clave} onChange={(v) => setForm((s) => ({ ...s, clave: v }))} />
                    <FormField label="Nombre materia" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
                    <FormField label="Calificacion" value={form.calificacion} onChange={(v) => setForm((s) => ({ ...s, calificacion: v }))} type="number" />
                    <FormField label="Calificacion texto (referencia)" value={form.calificacion_texto} onChange={(v) => setForm((s) => ({ ...s, calificacion_texto: v }))} />
                    <FormField label="Periodo" value={form.periodo} onChange={(v) => setForm((s) => ({ ...s, periodo: v }))} />
                    <FormField label="Semestre" value={form.semestre} onChange={(v) => setForm((s) => ({ ...s, semestre: v }))} type="number" />
                    <FormField label="Creditos" value={form.creditos} onChange={(v) => setForm((s) => ({ ...s, creditos: v }))} type="number" />
                    <FormField label="Tipo" value={form.tipo} onChange={(v) => setForm((s) => ({ ...s, tipo: v }))} />
                    <FormField label="Estado" value={form.estado} onChange={(v) => setForm((s) => ({ ...s, estado: v }))} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton onClick={guardar}>Registrar materia</ActionButton>
                    <ActionButton variant="secondary" onClick={intentarListar}>Validar listado/edicion</ActionButton>
                </div>
                {message ? <AlertBox type="success" message={message} /> : null}
            </div>
        </section>
    );
}

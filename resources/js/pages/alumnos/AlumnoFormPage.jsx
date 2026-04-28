import { useState } from 'react';
import { alumnosApi } from '../../api/alumnos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';

const initial = {
    id: '',
    curp: '',
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    genero: '',
    nacionalidad: '',
    estatus: 'activo',
};

export function AlumnoFormPage() {
    const [form, setForm] = useState(initial);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [errorGlobal, setErrorGlobal] = useState('');

    async function crear() {
        setErrorGlobal('');
        setErrors({});
        setMessage('');
        try {
            const payload = {
                curp: form.curp,
                nombre: form.nombre,
                primer_apellido: form.primer_apellido,
                segundo_apellido: form.segundo_apellido || null,
            };
            const res = await alumnosApi.create(payload);
            setMessage(`Alumno creado con ID ${res?.data?.id}.`);
            setForm((s) => ({ ...s, id: String(res?.data?.id ?? '') }));
        } catch (err) {
            if (err?.status === 422) {
                setErrors(err.errors ?? {});
            } else {
                setErrorGlobal(err?.message ?? 'No se pudo crear el alumno.');
            }
        }
    }

    async function consultar() {
        if (!form.id) return;
        setErrorGlobal('');
        setErrors({});
        setMessage('');
        try {
            const res = await alumnosApi.show(form.id);
            const a = res?.data ?? {};
            setForm((s) => ({
                ...s,
                curp: a.curp ?? '',
                nombre: a.nombre ?? '',
                primer_apellido: a.primer_apellido ?? '',
                segundo_apellido: a.segundo_apellido ?? '',
            }));
            setMessage('Alumno cargado.');
        } catch (err) {
            setErrorGlobal(err?.message ?? 'No se pudo consultar el alumno.');
        }
    }

    async function actualizar() {
        if (!form.id) return;
        setErrorGlobal('');
        setErrors({});
        setMessage('');
        try {
            await alumnosApi.update(form.id, {
                curp: form.curp,
                nombre: form.nombre,
                primer_apellido: form.primer_apellido,
                segundo_apellido: form.segundo_apellido || null,
            });
            setMessage('Alumno actualizado.');
        } catch (err) {
            if (err?.status === 422) setErrors(err.errors ?? {});
            else setErrorGlobal(err?.message ?? 'No se pudo actualizar el alumno.');
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Formulario de alumno" subtitle="Alta, consulta y actualizacion basica de alumno." />
            {errorGlobal ? <ErrorState message={errorGlobal} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">Datos personales</h3>
                    <FormField label="ID (consulta/edicion)" value={form.id} onChange={(v) => setForm((s) => ({ ...s, id: v }))} />
                    <FormField label="CURP" value={form.curp} onChange={(v) => setForm((s) => ({ ...s, curp: v }))} error={errors?.curp?.[0]} />
                    <FormField label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} error={errors?.nombre?.[0]} />
                    <FormField label="Primer apellido" value={form.primer_apellido} onChange={(v) => setForm((s) => ({ ...s, primer_apellido: v }))} error={errors?.primer_apellido?.[0]} />
                    <FormField label="Segundo apellido" value={form.segundo_apellido} onChange={(v) => setForm((s) => ({ ...s, segundo_apellido: v }))} />
                    </div>
                    <div className="grid gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">Datos complementarios</h3>
                    <FormField label="Fecha nacimiento" value={form.fecha_nacimiento} onChange={(v) => setForm((s) => ({ ...s, fecha_nacimiento: v }))} type="date" />
                    <FormField label="Genero" value={form.genero} onChange={(v) => setForm((s) => ({ ...s, genero: v }))} />
                    <FormField label="Nacionalidad" value={form.nacionalidad} onChange={(v) => setForm((s) => ({ ...s, nacionalidad: v }))} />
                    <FormField label="Estatus" value={form.estatus} onChange={(v) => setForm((s) => ({ ...s, estatus: v }))} />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton onClick={crear}>Crear</ActionButton>
                    <ActionButton variant="secondary" onClick={consultar}>Consultar por ID</ActionButton>
                    <ActionButton variant="secondary" onClick={actualizar}>Actualizar</ActionButton>
                </div>
                {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
            </div>
        </section>
    );
}

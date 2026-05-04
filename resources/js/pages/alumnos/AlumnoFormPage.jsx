import { useState } from 'react';
import { alumnosApi } from '../../api/alumnos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { AlertBox } from '../../components/ui/AlertBox';

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
    const [busy, setBusy] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setErrorGlobal('');
        setErrors({});
        setMessage('');
        try {
            const payload = {
                curp: form.curp,
                nombre: form.nombre,
                primer_apellido: form.primer_apellido,
                segundo_apellido: form.segundo_apellido || null,
                fecha_nacimiento: form.fecha_nacimiento || null,
                genero: form.genero || null,
                nacionalidad: form.nacionalidad || null,
                estatus: form.estatus,
            };
            const res = await alumnosApi.create(payload);
            setMessage(`Alumno creado con ID ${res?.data?.id}.`);
            setForm((s) => ({ ...s, id: String(res?.data?.id ?? '') }));

        } catch (err) {
            if (err?.status === 422) {
                setErrors(err.errors ?? {});
                setErrorGlobal('');
            } else {
                setErrors({});
                setErrorGlobal(err?.message ?? 'Ocurrió un error al guardar el alumno.');
            }
        } finally {
            setBusy(false);
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
                fecha_nacimiento: a.fecha_nacimiento ?? '',
                genero: a.genero ?? '',
                nacionalidad: a.nacionalidad ?? '',
                estatus: a.estatus ?? 'activo',
            }));

            setMessage('Alumno cargado.');

        } catch (err) {
            if (err?.status === 404) {
                setErrorGlobal('No se encontró ningún alumno con ese ID.');
            } else {
                setErrorGlobal(err?.message ?? 'Error al consultar.');
            }
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
                fecha_nacimiento: form.fecha_nacimiento || null,
                genero: form.genero || null,
                nacionalidad: form.nacionalidad || null,
                estatus: form.estatus || 'activo',
            });
            setMessage('Alumno actualizado.');
        } catch (err) {
            if (err?.status === 422) {
                setErrors(err.errors ?? {});
                setErrorGlobal('');
            } else {
                setErrors({});
                setErrorGlobal(err?.message ?? 'Error al actualizar.');
            }
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Formulario de alumno" subtitle="Alta, consulta y actualizacion basica de alumno." />
            {errorGlobal ? <ErrorState message={errorGlobal} /> : null}
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">Datos personales</h3>
                        <FormField label="ID (consulta/edicion)" value={form.id} onChange={(v) => setForm((s) => ({ ...s, id: v }))} />
                        <FormField label="CURP" value={form.curp} onChange={(v) => setForm((s) => ({ ...s, curp: v }))} error={errors?.curp?.[0]} />
                        <FormField label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} error={errors?.nombre?.[0]} />
                        <FormField label="Primer apellido" value={form.primer_apellido} onChange={(v) => setForm((s) => ({ ...s, primer_apellido: v }))} error={errors?.primer_apellido?.[0]} />
                        <FormField label="Segundo apellido" value={form.segundo_apellido} onChange={(v) => setForm((s) => ({ ...s, segundo_apellido: v }))} error={errors?.segundo_apellido?.[0]} />
                    </div>
                    <div className="grid gap-3">
                        <h3 className="text-sm font-semibold text-slate-800">Datos complementarios</h3>
                        <FormField label="Fecha nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => setForm((s) => ({ ...s, fecha_nacimiento: v }))} error={errors?.fecha_nacimiento?.[0]} />
                            <SelectField
                            label="Género"
                            value={form.genero}
                            onChange={(v) => setForm((s) => ({ ...s, genero: v }))}
                            options={[
                                { value: 'Masculino', label: 'Masculino' },
                                { value: 'Femenino', label: 'Femenino' },
                            ]}
                            error={errors?.genero?.[0]}
                        />
                        <FormField label="Nacionalidad" value={form.nacionalidad} onChange={(v) => setForm((s) => ({ ...s, nacionalidad: v }))} error={errors?.nacionalidad?.[0]} />
                        <FormField label="Estatus" value={form.estatus} onChange={(v) => setForm((s) => ({ ...s, estatus: v }))} error={errors?.estatus?.[0]} />
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton type="submit" disabled={busy}>
                        {busy ? 'Guardando...' : 'Crear'}
                    </ActionButton>
                    <ActionButton type="button" variant="secondary" onClick={consultar}>
                        Consultar por ID
                    </ActionButton>
                    <ActionButton type="button" variant="secondary" onClick={actualizar}>
                        Actualizar
                    </ActionButton>
                </div>
                {message ? <AlertBox type="success" message={message} /> : null}
            </form>
        </section>
    );
}
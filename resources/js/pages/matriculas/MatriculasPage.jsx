import { useEffect, useState } from 'react';
import { alumnosApi } from '../../api/alumnos';
import { catalogosApi } from '../../api/catalogos';
import { matriculasApi } from '../../api/matriculas';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';

export function MatriculasPage() {
    const [form, setForm] = useState({
        alumno_id: '',
        oferta_academica_id: '',
        ciclo_escolar_id: '',
        matricula: '',
        estado: 'activa',
        fecha_ingreso: '',
        fecha_egreso: '',
    });
    const [q, setQ] = useState('');
    const [hits, setHits] = useState([]);
    const [alumnoSel, setAlumnoSel] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [catalogos, setCatalogos] = useState({ ofertas: [], ciclos: [] });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const canCreate = Number(form.alumno_id) > 0 && Number(form.oferta_academica_id) > 0 && Number(form.ciclo_escolar_id) > 0 && form.matricula.trim() !== '';

    useEffect(() => {
        Promise.all([
            catalogosApi.ofertasAcademicas().catch(() => ({ data: [] })),
            catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
        ]).then(([ofertas, ciclos]) => {
            setCatalogos({
                ofertas: Array.isArray(ofertas?.data) ? ofertas.data : [],
                ciclos: Array.isArray(ciclos?.data) ? ciclos.data : [],
            });
        });
    }, []);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (q.trim().length < 3) {
                setHits([]);
                return;
            }
            try {
                const res = await alumnosApi.list({ q: q.trim(), per_page: 10 });
                setHits(Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);
            } catch {
                setHits([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    async function seleccionarAlumno(row) {
        setAlumnoSel(row);
        setForm((s) => ({ ...s, alumno_id: String(row.id) }));
        try {
            const res = await alumnosApi.resumenInstitucional(row.id);
            const data = res?.data ?? null;
            setResumen(data);
            setForm((s) => ({
                ...s,
                alumno_id: String(row.id),
                oferta_academica_id: String(data?.refs?.oferta_academica_id ?? ''),
                ciclo_escolar_id: String(data?.refs?.ciclo_escolar_id ?? ''),
            }));
        } catch {
            setResumen(null);
        }
    }

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
            setMessage('Matrícula registrada correctamente.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo crear la matrícula.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader title="Matrículas" subtitle="Registro institucional de matrícula y control de historial académico del alumno." />
            {error ? <ErrorState message={error} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <FormField label="Buscar alumno por CURP o nombre" value={q} onChange={setQ} placeholder="Ej. MARÍA LÓPEZ / CURP" />
                <ul className="mt-2 grid gap-1 text-xs">
                    {hits.map((h) => (
                        <li key={h.id}>
                            <button type="button" className="text-blue-700 hover:underline" onClick={() => void seleccionarAlumno(h)}>
                                {h.nombre} {h.primer_apellido} {h.segundo_apellido ?? ''} · {h.curp}
                            </button>
                        </li>
                    ))}
                </ul>
                {alumnoSel ? (
                    <div className="mt-3 rounded border border-slate-200 p-3 text-sm">
                        <p><strong>Alumno seleccionado:</strong> {alumnoSel.nombre} {alumnoSel.primer_apellido} {alumnoSel.segundo_apellido ?? ''}</p>
                        <p><strong>CURP:</strong> {alumnoSel.curp}</p>
                        {resumen?.matricula ? (
                            <p className="text-amber-700 mt-2">
                                Historial detectado: matrícula actual {resumen.matricula.clave_matricula} ({resumen.matricula.estado}). Solo puede existir una matrícula activa a la vez.
                            </p>
                        ) : null}
                    </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-3">
                    <FormField label="Subsistema" value={resumen?.matricula?.subsistema ?? 'Se asigna por oferta académica'} onChange={() => {}} disabled />
                    <FormField label="Institución" value={resumen?.matricula?.institucion ?? 'Se asigna por oferta académica'} onChange={() => {}} disabled />
                    <FormField label="Sede / CCT" value={resumen?.matricula?.sede ?? 'Se asigna por oferta académica'} onChange={() => {}} disabled />
                    <label className="grid gap-1 text-xs text-slate-600">
                        Programa / Plan de estudios
                        <select className="inst-select text-sm" value={form.oferta_academica_id} onChange={(e) => setForm((s) => ({ ...s, oferta_academica_id: e.target.value }))}>
                            <option value="">Selecciona programa/plan</option>
                            {catalogos.ofertas.map((o) => <option key={o.id} value={o.id}>{o.clave} · {o.modalidad}</option>)}
                        </select>
                    </label>
                    <label className="grid gap-1 text-xs text-slate-600">
                        Ciclo de ingreso
                        <select className="inst-select text-sm" value={form.ciclo_escolar_id} onChange={(e) => setForm((s) => ({ ...s, ciclo_escolar_id: e.target.value }))}>
                            <option value="">Selecciona ciclo</option>
                            {catalogos.ciclos.map((c) => <option key={c.id} value={c.id}>{c.nombre ?? c.clave}</option>)}
                        </select>
                    </label>
                    <FormField label="Matrícula" value={form.matricula} onChange={(v) => setForm((s) => ({ ...s, matricula: v }))} />
                    <FormField label="Estado" value={form.estado} onChange={(v) => setForm((s) => ({ ...s, estado: v }))} />
                    <FormField label="Fecha de ingreso" value={form.fecha_ingreso} onChange={(v) => setForm((s) => ({ ...s, fecha_ingreso: v }))} type="date" />
                    <FormField label="Fecha de baja/conclusión" value={form.fecha_egreso} onChange={(v) => setForm((s) => ({ ...s, fecha_egreso: v }))} type="date" />
                </div>
                <div className="mt-4 flex gap-2">
                    <ActionButton onClick={crear} disabled={busy || !canCreate}>{busy ? 'Creando...' : 'Crear matrícula'}</ActionButton>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                    Regla institucional: un alumno puede conservar historial académico, pero solo puede tener una matrícula activa a la vez. La matrícula escolar no puede repetirse.
                </p>
                {message ? <AlertBox type="success" message={message} /> : null}
            </div>
        </section>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { alumnosApi } from '../../api/alumnos';
import { catalogosApi } from '../../api/catalogos';
import { materiasCursadasApi } from '../../api/materiasCursadas';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { LockedField } from '../../components/academic/LockedField';
import { ReadOnlyField } from '../../components/academic/ReadOnlyField';
import { MateriaPlanBadge } from '../../components/academic/MateriaPlanBadge';
import { MateriaWarningBadge } from '../../components/academic/MateriaWarningBadge';
import { DataTable } from '../../components/ui/DataTable';

export function MateriasCursadasPage() {
    const [q, setQ] = useState('');
    const [hits, setHits] = useState([]);
    const [alumnoSel, setAlumnoSel] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [ciclos, setCiclos] = useState([]);
    const [form, setForm] = useState({
        ciclo_escolar_id: '',
        calificacion: '',
        tipo_evaluacion: '',
        estatus_acreditacion: '',
        periodo: '',
        inscripcion_periodo_id: '',
        plan_materia_id: '',
        carga_academica_id: '',
        clave: '',
        nombre: '',
        semestre: '1',
        creditos: '0',
        tipo_periodo_curricular: 'semestre',
        numero_periodo_curricular: '1',
    });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);

    const refs = resumen?.refs;

    useEffect(() => {
        catalogosApi
            .ciclosEscolares()
            .then((res) => setCiclos(res?.data ?? []))
            .catch(() => setCiclos([]));
    }, []);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (q.trim().length < 3) {
                setHits([]);
                return;
            }
            try {
                const res = await alumnosApi.list({ q: q.trim(), per_page: 15 });
                setHits(Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);
            } catch {
                setHits([]);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [q]);

    const cargarExpediente = useCallback(async (row) => {
        setBusy(true);
        setError('');
        setMsg('');
        try {
            setAlumnoSel(row);
            const r = await alumnosApi.resumenInstitucional(Number(row.id));
            setResumen(r?.data ?? null);
            const cic = r?.data?.refs?.ciclo_escolar_id ?? '';
            setForm((f) => ({ ...f, ciclo_escolar_id: cic ? String(cic) : '' }));
        } catch (e) {
            setError(e?.message ?? 'No se cargó la información del estudiante.');
        } finally {
            setBusy(false);
        }
    }, []);

    const bloqueCatalogo = Boolean(Number(form.plan_materia_id) > 0 || Number(form.carga_academica_id) > 0);

    const vistaMaterias = useMemo(() => resumen?.materias_cursadas?.slice?.(0, 8) ?? [], [resumen]);
    const cargaRows = useMemo(
        () => (resumen?.materias_cursadas ?? []).map((m) => ({
            asignatura: `${m.clave ?? ''} ${m.nombre ?? ''}`.trim(),
            periodo_curricular: m.periodo_curricular_etiqueta ?? 'Periodo institucional',
            ciclo_cursado: m.periodo_cursado ?? 'Sin ciclo',
            calificacion: m.calificacion ?? '—',
            tipo_evaluacion: m.tipo_evaluacion ?? '—',
            estatus: m.estatus_acreditacion ?? '—',
        })),
        [resumen],
    );

    async function registrar() {
        if (!refs?.alumno_id || !refs?.matricula_id) {
            setError('Seleccione un estudiante que ya cuente con matrícula registrada.');
            return;
        }
        const cicId = Number(form.ciclo_escolar_id || refs.ciclo_escolar_id);
        if (!(cicId > 0)) {
            setError('Seleccione el ciclo escolar donde se acreditó la materia.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await materiasCursadasApi.create({
                alumno_id: refs.alumno_id,
                matricula_id: refs.matricula_id,
                ciclo_escolar_id: cicId,
                plan_materia_id: Number(form.plan_materia_id) > 0 ? Number(form.plan_materia_id) : null,
                carga_academica_id: Number(form.carga_academica_id) > 0 ? Number(form.carga_academica_id) : null,
                inscripcion_periodo_id: Number(form.inscripcion_periodo_id) > 0 ? Number(form.inscripcion_periodo_id) : null,
                calificacion: Number(form.calificacion ?? 0),
                tipo_evaluacion: form.tipo_evaluacion || null,
                estatus_acreditacion: form.estatus_acreditacion || null,
                periodo: form.periodo.trim() !== '' ? form.periodo.trim() : null,
                clave: bloqueCatalogo ? null : form.clave || null,
                nombre: bloqueCatalogo ? null : form.nombre || null,
                semestre: bloqueCatalogo ? undefined : Number(form.semestre || 1),
                creditos: bloqueCatalogo ? undefined : Number(form.creditos ?? 0),
                tipo_periodo_curricular: form.tipo_periodo_curricular || 'semestre',
                numero_periodo_curricular: Number(form.numero_periodo_curricular || 1),
            });
            await cargarExpediente(alumnoSel);
            setMsg('Registro guardado.');
        } catch (e) {
            setError(e?.message ?? 'No fue posible guardar la materia cursada.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Materias y calificaciones"
                subtitle="Flujo operativo: buscar alumno, seleccionar matrícula y capturar calificación sobre la carga académica institucional."
            />

            <SectionCard title="Buscar estudiante" subtitle="Escriba al menos tres caracteres (CURP o nombre).">
                <FormField label="Criterios de búsqueda" value={q} onChange={setQ} placeholder="Ej. MARÍA LOPEZ" />
                <ul className="mt-3 grid gap-1 text-xs">
                    {hits.map((h) => (
                        <li key={h.id}>
                            <button type="button" disabled={busy} className="text-left text-blue-700 hover:underline" onClick={() => void cargarExpediente(h)}>
                                {h.nombre} {h.primer_apellido} ({h.curp})
                            </button>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            {resumen?.matricula ? (
                <SectionCard title="Contexto académico seleccionado" subtitle="Datos institucionales del alumno y su trayectoria vigente.">
                    <ReadOnlyField label="Estudiante" value={resumen.alumno?.nombre_completo} />
                    <ReadOnlyField label="Programa" value={resumen.matricula.programa} />
                    <ReadOnlyField label="Plan vigente en la sede" value={resumen.matricula.plan_estudios} helperText="Conforme al registro institucional de la oferta asociada a la matrícula." />

                    <div className="mt-4 grid gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Últimos registros de trayectoria</p>
                        {vistaMaterias.map((mc) => (
                            <div key={`${mc.clave}-${mc.nombre}-${mc.periodo_cursado}`} className="flex flex-wrap items-start justify-between gap-2 rounded border border-slate-100 px-3 py-2 text-xs">
                                <div>
                                    <strong className="text-sm text-slate-900">{mc.nombre}</strong>
                                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase">{mc.clave}</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {mc.bloque_catalogo ? <MateriaPlanBadge /> : null}
                                        {mc.posible_fuera_de_plan ? <MateriaWarningBadge>Fuera de plan probable</MateriaWarningBadge> : null}
                                        {mc.dato_congelado_en_certificado ? <MateriaWarningBadge>Congelado en certificación</MateriaWarningBadge> : null}
                                    </div>
                                    <p className="text-[11px] text-slate-500">{mc.fuente_catalogo_legible}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{mc.calificacion ?? '—'}</p>
                                    <p className="text-[11px] text-slate-500">{mc.periodo_cursado ?? 'Sin periodo'}</p>
                                </div>
                            </div>
                        ))}
                        {vistaMaterias.length === 0 ? <p className="text-xs text-slate-600">Sin materias en el expediente todavía.</p> : null}
                    </div>
                </SectionCard>
            ) : alumnoSel ? (
                <AlertBox type="warning" message="El estudiante aún no tiene matrícula: complete el paso anterior en Control Escolar antes de cursar materias formales." />
            ) : null}

            <SectionCard title="Flujo principal de captura">
                <ol className="list-decimal pl-5 text-sm text-slate-700 grid gap-1">
                    <li>Buscar alumno.</li>
                    <li>Seleccionar matrícula activa.</li>
                    <li>Seleccionar inscripción / periodo.</li>
                    <li>Mostrar carga académica generada desde plan.</li>
                    <li>Capturar calificaciones sobre esa carga.</li>
                </ol>
                <div className="mt-4">
                    <DataTable
                        columns={[
                            { key: 'asignatura', label: 'Asignatura' },
                            { key: 'periodo_curricular', label: 'Periodo curricular' },
                            { key: 'ciclo_cursado', label: 'Ciclo cursado' },
                            { key: 'calificacion', label: 'Calificación' },
                            { key: 'tipo_evaluacion', label: 'Tipo evaluación' },
                            { key: 'estatus', label: 'Estatus' },
                            { key: 'accion', label: 'Acción', render: () => <span className="text-blue-700 text-xs">Capturar</span> },
                        ]}
                        rows={cargaRows}
                        emptyText="No hay carga académica visible para este alumno/matrícula."
                    />
                </div>
            </SectionCard>

            <SectionCard title="Captura de calificación">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-4">
                        {bloqueCatalogo ? (
                            <>
                                <LockedField label="Clave de materia" value={form.clave || 'Tomada desde plan'} />
                                <LockedField label="Nombre de materia" value={form.nombre || 'Tomada desde plan'} />
                                <LockedField label="Ubicación en el currículum" value={`${form.tipo_periodo_curricular} · período ${form.numero_periodo_curricular}`} />
                                <LockedField label="Créditos" value={form.creditos} />
                            </>
                        ) : (
                            <>
                                <FormField label="Clave de asignatura" value={form.clave} onChange={(v) => setForm((f) => ({ ...f, clave: v }))} />
                                <FormField label="Nombre de asignatura" value={form.nombre} onChange={(v) => setForm((f) => ({ ...f, nombre: v }))} />
                                <FormField label="Semestre / núm. período institucional" type="number" value={form.semestre} onChange={(v) => setForm((f) => ({ ...f, semestre: v }))} />
                                <FormField label="Créditos" type="number" value={form.creditos} onChange={(v) => setForm((f) => ({ ...f, creditos: v }))} />
                                <FormField label="Periodo curricular" value={form.tipo_periodo_curricular} onChange={(v) => setForm((f) => ({ ...f, tipo_periodo_curricular: v }))} placeholder="Ej. semestre" />
                                <FormField label="Orden curricular" type="number" value={form.numero_periodo_curricular} onChange={(v) => setForm((f) => ({ ...f, numero_periodo_curricular: v }))} />
                            </>
                        )}
                    </div>

                    <div className="grid gap-4">
                        <label className="grid gap-1 text-xs uppercase text-slate-600">
                            Ciclo donde se cursó
                            <select
                                className="inst-input normal-case text-sm"
                                value={String(form.ciclo_escolar_id ?? '')}
                                onChange={(e) => setForm((f) => ({ ...f, ciclo_escolar_id: e.target.value }))}
                            >
                                <option value="">Selecciona…</option>
                                {ciclos.map((c) => (
                                    <option key={c.id} value={String(c.id)}>
                                        {c.nombre ?? c.clave}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <FormField label="Calificación final" type="number" value={form.calificacion} onChange={(v) => setForm((f) => ({ ...f, calificacion: v }))} />
                        <FormField label="Tipo de evaluación" value={form.tipo_evaluacion} onChange={(v) => setForm((f) => ({ ...f, tipo_evaluacion: v }))} placeholder="Ej. ordinaria" />
                        <FormField label="Estatus de acreditación" value={form.estatus_acreditacion} onChange={(v) => setForm((f) => ({ ...f, estatus_acreditacion: v }))} placeholder="Ej. acreditada / no acreditada" />
                        <FormField
                            label="Periodo cursado institucional (texto público recomendado)"
                            value={form.periodo}
                            onChange={(v) => setForm((f) => ({ ...f, periodo: v }))}
                            placeholder="Ej. 2025-2026"
                        />

                        <p className="subtle-help-text">
                            La vinculación a plan e inscripción se resuelve automáticamente cuando el alumno tiene carga académica institucional activa.
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton disabled={busy} onClick={() => void registrar()}>
                        Registrar en historial cursado institucional
                    </ActionButton>
                </div>
            </SectionCard>
            <SectionCard title="Registro excepcional fuera de plan" subtitle="Solo para casos institucionales extraordinarios.">
                <AlertBox type="warning" message="Este registro requiere validación normativa y no habilita certificación directa." />
                <details className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-900">Abrir captura excepcional</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <FormField label="Clave de asignatura (excepcional)" value={form.clave} onChange={(v) => setForm((f) => ({ ...f, clave: v }))} />
                        <FormField label="Nombre de asignatura (excepcional)" value={form.nombre} onChange={(v) => setForm((f) => ({ ...f, nombre: v }))} />
                    </div>
                </details>
            </SectionCard>
        </section>
    );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitudesMatriculaApi } from '../../api/solicitudesMatricula';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { getUser } from '../../authStore';

function perm(name) {
    return Boolean(getUser()?.permissions?.includes(name));
}

function etiquetaEstado(e) {
    const m = {
        borrador: 'Borrador',
        enviada: 'Enviada a Educación Superior',
        en_revision: 'En revisión (ES)',
        con_observaciones: 'Con observaciones',
        aprobada: 'Aprobada — pendiente asignar clave',
        matricula_asignada: 'Matrícula asignada',
        rechazada: 'Rechazada',
        cancelada: 'Cancelada',
    };
    return m[e] ?? e ?? '—';
}

export function SolicitudesMatriculaBandejaPage() {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [filtro, setFiltro] = useState('');
    const [obs, setObs] = useState('');
    const [motivo, setMotivo] = useState('');
    const [claveMat, setClaveMat] = useState('');
    const [sel, setSel] = useState(null);

    const puede = useMemo(
        () => ({
            revisar: perm('revisar_solicitud_matricula'),
            devolver: perm('devolver_solicitud_matricula'),
            aprobar: perm('aprobar_solicitud_matricula'),
            rechazar: perm('rechazar_solicitud_matricula'),
            asignar: perm('asignar_matricula'),
        }),
        [],
    );

    async function cargar() {
        setBusy(true);
        setError('');
        try {
            const res = await solicitudesMatriculaApi.index(filtro ? { estado: filtro } : {});
            setRows(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setRows([]);
            setError(e?.message ?? 'No se pudo cargar la bandeja.');
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        void cargar();
    }, [filtro]);

    async function actuar(fn) {
        if (!sel?.id) return;
        setBusy(true);
        setError('');
        try {
            await fn(sel.id);
            setSel(null);
            setObs('');
            setMotivo('');
            setClaveMat('');
            await cargar();
        } catch (e) {
            setError(e?.message ?? 'Acción no completada.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Solicitudes de matrícula"
                subtitle="Educación Superior revisa expedientes y asigna la clave institucional oficial."
                actions={
                    <Link to="/app/dashboard" className="inst-btn inst-btn-secondary text-sm">
                        Volver al panel
                    </Link>
                }
            />
            {error ? <ErrorState message={error} /> : null}

            <SectionCard title="Filtro por estado">
                <select className="inst-input text-sm max-w-xs" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="enviada">Enviadas</option>
                    <option value="en_revision">En revisión</option>
                    <option value="con_observaciones">Con observaciones</option>
                    <option value="aprobada">Aprobadas</option>
                    <option value="matricula_asignada">Matrícula asignada</option>
                    <option value="rechazada">Rechazadas</option>
                </select>
            </SectionCard>

            <SectionCard title="Listado">
                {busy && rows.length === 0 ? <p className="text-sm text-slate-600">Cargando…</p> : null}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-left">
                                <th className="py-2 pr-3">Alumno</th>
                                <th className="py-2 pr-3">CURP</th>
                                <th className="py-2 pr-3">Subsistema</th>
                                <th className="py-2 pr-3">Institución</th>
                                <th className="py-2 pr-3">Programa / plan</th>
                                <th className="py-2 pr-3">Ciclo ingreso</th>
                                <th className="py-2 pr-3">Estado</th>
                                <th className="py-2 pr-3">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => {
                                const nombre = [r.alumno?.nombre, r.alumno?.primer_apellido, r.alumno?.segundo_apellido].filter(Boolean).join(' ');
                                const prog = r.programa_estudio ? `${r.programa_estudio.nombre}` : '—';
                                const plan = r.plan_estudio ? `${r.plan_estudio.nombre}` : '';
                                return (
                                    <tr key={r.id} className="border-b border-slate-100">
                                        <td className="py-2 pr-3">{nombre || '—'}</td>
                                        <td className="py-2 pr-3 font-mono text-xs">{r.alumno?.curp ?? '—'}</td>
                                        <td className="py-2 pr-3">{r.subsistema?.clave ?? '—'}</td>
                                        <td className="py-2 pr-3">{r.institucion?.nombre ?? '—'}</td>
                                        <td className="py-2 pr-3 text-xs">
                                            {prog} {plan ? ` / ${plan}` : ''}
                                        </td>
                                        <td className="py-2 pr-3 text-xs">{r.ciclo_ingreso?.nombre ?? r.ciclo_ingreso?.clave ?? '—'}</td>
                                        <td className="py-2 pr-3">{etiquetaEstado(r.estado)}</td>
                                        <td className="py-2 pr-3">
                                            <div className="flex flex-wrap gap-1">
                                                <button type="button" className="inst-btn inst-btn-secondary text-xs" onClick={() => setSel(r)}>
                                                    Operar
                                                </button>
                                                {r.alumno_id ? (
                                                    <Link className="inst-btn inst-btn-secondary text-xs" to={`/app/alumnos/${r.alumno_id}/expediente?tab=matricula`}>
                                                        Expediente
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {rows.length === 0 && !busy ? <p className="text-sm text-slate-600 mt-2">Sin registros para el filtro actual.</p> : null}
            </SectionCard>

            {sel ? (
                <SectionCard title={`Operación · solicitud #${sel.id}`}>
                    <p className="text-xs text-slate-600 mb-2">
                        Estado: <strong>{etiquetaEstado(sel.estado)}</strong>
                        {sel.observaciones ? (
                            <span className="block mt-1">Observaciones: {sel.observaciones}</span>
                        ) : null}
                    </p>
                    {puede.revisar && sel.estado === 'enviada' ? (
                        <button type="button" className="inst-btn inst-btn-primary text-sm mr-2" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.tomarRevision(id))}>
                            Tomar en revisión
                        </button>
                    ) : null}
                    {puede.devolver && sel.estado === 'en_revision' ? (
                        <div className="mt-2 grid gap-2">
                            <textarea className="inst-input text-sm" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones para Control Escolar" />
                            <button
                                type="button"
                                className="inst-btn inst-btn-secondary text-sm"
                                disabled={busy}
                                onClick={() => actuar((id) => solicitudesMatriculaApi.devolverObservaciones(id, obs))}
                            >
                                Devolver con observaciones
                            </button>
                        </div>
                    ) : null}
                    {puede.aprobar && sel.estado === 'en_revision' ? (
                        <button type="button" className="inst-btn inst-btn-success text-sm mt-2 mr-2" disabled={busy} onClick={() => actuar((id) => solicitudesMatriculaApi.aprobar(id))}>
                            Aprobar solicitud
                        </button>
                    ) : null}
                    {puede.rechazar && (sel.estado === 'en_revision' || sel.estado === 'enviada') ? (
                        <div className="mt-2 grid gap-2">
                            <textarea className="inst-input text-sm" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de rechazo" />
                            <button
                                type="button"
                                className="inst-btn inst-btn-secondary text-sm"
                                disabled={busy}
                                onClick={() => actuar((id) => solicitudesMatriculaApi.rechazar(id, motivo))}
                            >
                                Rechazar
                            </button>
                        </div>
                    ) : null}
                    {puede.asignar && sel.estado === 'aprobada' ? (
                        <div className="mt-2 grid gap-2">
                            <input className="inst-input text-sm" value={claveMat} onChange={(e) => setClaveMat(e.target.value)} placeholder="Clave de matrícula institucional" />
                            <button
                                type="button"
                                className="inst-btn inst-btn-primary text-sm"
                                disabled={busy}
                                onClick={() =>
                                    actuar((id) =>
                                        solicitudesMatriculaApi.asignarMatricula(id, {
                                            matricula: claveMat.trim(),
                                            estado: 'activa',
                                        }),
                                    )
                                }
                            >
                                Asignar matrícula
                            </button>
                        </div>
                    ) : null}
                    <button type="button" className="inst-btn inst-btn-secondary text-sm mt-3" onClick={() => setSel(null)}>
                        Cerrar
                    </button>
                </SectionCard>
            ) : null}
        </section>
    );
}

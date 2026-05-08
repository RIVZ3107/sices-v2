import { useCallback, useEffect, useState } from 'react';
import { getUser } from '../../authStore';
import { normativaLegacyApi } from '../../api/normativaLegacy';
import { PageHeader } from '../../components/PageHeader';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { AlertBox } from '../../components/ui/AlertBox';

function formatErroresApi(err) {
    const bag = err?.errors;
    if (bag && typeof bag === 'object') {
        return Object.entries(bag)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join('\n');
    }
    return err?.message ?? 'Error.';
}

export function LegacyNormativaRevisionPage() {
    const user = getUser();
    const perms = user?.permissions ?? [];
    const puedeRevisar = perms.includes('revisar_importacion_legacy_normativa');
    const puedeAprobar = perms.includes('aprobar_importacion_legacy_normativa');
    const puedeRechazar = perms.includes('rechazar_importacion_legacy_normativa');

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filas, setFilas] = useState([]);
    const [meta, setMeta] = useState(null);
    const [seleccionId, setSeleccionId] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [motivoAprobar, setMotivoAprobar] = useState('');
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [accionBusy, setAccionBusy] = useState(false);

    const cargarLista = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const res = await normativaLegacyApi.pendientes();
            setFilas(Array.isArray(res?.data) ? res.data : []);
            setMeta(res?.meta ?? null);
        } catch (e) {
            setError(formatErroresApi(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (!puedeRevisar) return;
        void cargarLista();
    }, [puedeRevisar, cargarLista]);

    const abrirDetalle = async (id) => {
        setSeleccionId(id);
        setDetalle(null);
        setMensaje('');
        setMotivoAprobar('');
        setMotivoRechazo('');
        try {
            const res = await normativaLegacyApi.detalle(id);
            setDetalle(res?.data ?? null);
        } catch (e) {
            setSeleccionId(null);
            setError(formatErroresApi(e));
        }
    };

    const ejecutarAprobar = async () => {
        if (!seleccionId) return;
        setAccionBusy(true);
        setMensaje('');
        setError('');
        try {
            await normativaLegacyApi.aprobar(seleccionId, { motivo: motivoAprobar || null });
            setMensaje('Validación normativa aprobada.');
            setSeleccionId(null);
            setDetalle(null);
            await cargarLista();
        } catch (e) {
            setError(formatErroresApi(e));
        } finally {
            setAccionBusy(false);
        }
    };

    const ejecutarRechazar = async () => {
        if (!seleccionId) return;
        setAccionBusy(true);
        setMensaje('');
        setError('');
        try {
            await normativaLegacyApi.rechazar(seleccionId, { motivo: motivoRechazo });
            setMensaje('Casuística rechazada normativamente. La creación/aprobación de documento oficial queda bloqueada hasta corrección.');
            setSeleccionId(null);
            setDetalle(null);
            await cargarLista();
        } catch (e) {
            setError(formatErroresApi(e));
        } finally {
            setAccionBusy(false);
        }
    };

    if (!puedeRevisar) {
        return (
            <div className="panel-layout">
                <PageHeader title="Validación normativa (importación legacy)" subtitle="Acceso restringido" />
                <AlertBox
                    type="warning"
                    message="No tiene el permiso revisar_importacion_legacy_normativa. Solo Educación Superior o superadmin."
                />
            </div>
        );
    }

    return (
        <div className="panel-layout space-y-4">
            <PageHeader
                title="Validación normativa — importaciones legacy"
                subtitle="Matrículas con estado pendiente_validacion_normativa"
            />

            {error ? <ErrorState message={error} /> : null}
            {mensaje ? <AlertBox type="success" message={mensaje} /> : null}

            <section className="panel-card rounded-xl border border-slate-700/60 bg-white/95 p-4 shadow-sm theme-dark:bg-slate-900/95">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-800 theme-dark:text-slate-100">Cola pendiente</h2>
                    <ActionButton type="button" variant="secondary" disabled={cargando} onClick={() => void cargarLista()}>
                        {cargando ? 'Actualizando…' : 'Actualizar'}
                    </ActionButton>
                </div>
                {cargando ? (
                    <p className="text-slate-500">Cargando…</p>
                ) : filas.length === 0 ? (
                    <p className="text-slate-500">No hay matrículas pendientes de validación normativa.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 theme-dark:border-slate-700">
                                    <th className="py-2 pr-3">Matrícula</th>
                                    <th className="py-2 pr-3">Alumno</th>
                                    <th className="py-2 pr-3">Institución</th>
                                    <th className="py-2 pr-3">Plan</th>
                                    <th className="py-2 pr-3">Importado</th>
                                    <th className="py-2 pr-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100 theme-dark:border-slate-800">
                                        <td className="py-2 pr-3 font-mono text-xs">{row.matricula}</td>
                                        <td className="py-2 pr-3">{row.alumno?.nombre_completo ?? '—'}</td>
                                        <td className="py-2 pr-3">{row.institucion?.nombre ?? '—'}</td>
                                        <td className="py-2 pr-3 text-xs">{row.plan_estudio?.clave ?? '—'}</td>
                                        <td className="py-2 pr-3 text-xs text-slate-600 theme-dark:text-slate-300">
                                            {row.fecha_marcado_legacy ?? '—'}
                                            {row.importador?.name ? (
                                                <span className="block text-[11px] text-slate-500">por {row.importador.name}</span>
                                            ) : null}
                                        </td>
                                        <td className="py-2 pr-3">
                                            <button
                                                type="button"
                                                className="text-sm text-indigo-600 hover:underline theme-dark:text-indigo-400"
                                                onClick={() => void abrirDetalle(row.id)}
                                            >
                                                Revisar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {meta ? (
                    <p className="mt-2 text-xs text-slate-500">
                        Total: {meta.total ?? filas.length} · Página {meta.current_page ?? 1}
                    </p>
                ) : null}
            </section>

            {detalle ? (
                <section className="panel-card space-y-4 rounded-xl border border-slate-700/60 bg-white/95 p-4 shadow-sm theme-dark:bg-slate-900/95">
                    <h2 className="text-lg font-semibold text-slate-800 theme-dark:text-slate-100">Detalle</h2>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div>
                            <p className="text-slate-500">Motivo forzado (sin plan / legacy)</p>
                            <p className="font-medium text-slate-800 theme-dark:text-slate-100">
                                {detalle.historico_importacion_legacy?.motivo_ultimo_forzado ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Estado bucket</p>
                            <p className="font-medium text-slate-800 theme-dark:text-slate-100">
                                {detalle.historico_importacion_legacy?.estado ?? '—'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="mb-1 text-sm font-semibold text-slate-700 theme-dark:text-slate-200">Importaciones relacionadas</p>
                        <ul className="list-inside list-disc text-sm text-slate-600 theme-dark:text-slate-300">
                            {(detalle.importaciones ?? []).map((imp) => (
                                <li key={imp.id}>
                                    #{imp.id} — {imp.usuario?.name ?? 'usuario'} — {imp.created_at ?? ''}
                                    {imp.motivo_forzar_sin_plan ? (
                                        <span className="block pl-4 text-xs">Motivo: {imp.motivo_forzar_sin_plan}</span>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="mb-1 text-sm font-semibold text-slate-700 theme-dark:text-slate-200">
                            Materias legacy_controlado
                        </p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="py-1 pr-2">Clave</th>
                                        <th className="py-1 pr-2">Nombre</th>
                                        <th className="py-1 pr-2">Calif.</th>
                                        <th className="py-1 pr-2">Créd.</th>
                                        <th className="py-1 pr-2">Sem.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(detalle.materias_legacy ?? []).map((m) => (
                                        <tr key={m.id} className="border-b border-slate-100">
                                            <td className="py-1 pr-2 font-mono">{m.clave}</td>
                                            <td className="py-1 pr-2">{m.nombre}</td>
                                            <td className="py-1 pr-2">{m.calificacion}</td>
                                            <td className="py-1 pr-2">{m.creditos}</td>
                                            <td className="py-1 pr-2">{m.semestre}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <p className="mb-1 text-sm font-semibold text-slate-700 theme-dark:text-slate-200">Auditoría reciente</p>
                        <ul className="max-h-48 overflow-auto text-xs text-slate-600 theme-dark:text-slate-300">
                            {(detalle.auditoria ?? []).map((ev) => (
                                <li key={ev.id} className="border-b border-slate-100 py-1 theme-dark:border-slate-800">
                                    <span className="font-mono text-[11px]">{ev.evento}</span> · usuario {ev.user_id ?? '—'} ·{' '}
                                    {ev.created_at}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {detalle.acciones_normativa_disponibles ? (
                        <div className="space-y-3 border-t border-slate-200 pt-3 theme-dark:border-slate-700">
                            {puedeAprobar ? (
                                <>
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-slate-600 theme-dark:text-slate-300">
                                            Motivo de aprobación (opcional)
                                        </span>
                                        <textarea
                                            className="inst-input min-h-[72px] text-sm"
                                            value={motivoAprobar}
                                            onChange={(e) => setMotivoAprobar(e.target.value)}
                                            placeholder="Observaciones de la revisión normativa…"
                                        />
                                    </label>
                                    <ActionButton
                                        type="button"
                                        disabled={accionBusy}
                                        onClick={() => void ejecutarAprobar()}
                                    >
                                        Aprobar validación normativa
                                    </ActionButton>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">No tiene permiso para aprobar.</p>
                            )}
                            {puedeRechazar ? (
                                <>
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-slate-600 theme-dark:text-slate-300">
                                            Motivo de rechazo <span className="text-rose-600">*</span>
                                        </span>
                                        <textarea
                                            required
                                            className="inst-input min-h-[88px] text-sm"
                                            value={motivoRechazo}
                                            onChange={(e) => setMotivoRechazo(e.target.value)}
                                            placeholder="Indique los motivos del rechazo normativo (mín. 5 caracteres)…"
                                        />
                                    </label>
                                    <ActionButton
                                        type="button"
                                        variant="danger"
                                        disabled={accionBusy}
                                        onClick={() => void ejecutarRechazar()}
                                    >
                                        Rechazar validación normativa
                                    </ActionButton>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">No tiene permiso para rechazar.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Esta matrícula ya no está en estado pendiente; no puede aprobar o rechazar desde esta pantalla.
                        </p>
                    )}
                    <button
                        type="button"
                        className="text-sm text-slate-500 underline"
                        onClick={() => {
                            setSeleccionId(null);
                            setDetalle(null);
                        }}
                    >
                        Cerrar detalle
                    </button>
                </section>
            ) : null}
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { importacionesApi } from '../../api/importaciones';
import { alumnosApi } from '../../api/alumnos';
import { matriculasApi } from '../../api/matriculas';
import { catalogosApi } from '../../api/catalogos';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import {
    detectDuplicateKeys,
    emptyImportRow,
    FILAS_PAYLOAD_FIELDS,
    parseSpreadsheetPaste,
    toApiFilasPayload,
} from './importacionHistoricaHelpers';

const STEPS = [
    'Contexto institucional',
    'Captura / datos del archivo',
    'Registro de borrador servidor',
    'Prevalidación frente al plan',
    'Conciliación institucional',
    'Confirmación',
    'Resultado y trazabilidad',
];

function formatApiErrors(err) {
    const bag = err?.errors;
    if (bag && typeof bag === 'object') {
        const lines = [];
        Object.entries(bag).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v.join(' ') : String(v);
            lines.push(`${k}: ${msg}`);
        });
        return lines.join('\n');
    }
    return err?.message ?? 'Error desconocido.';
}

export function ImportacionesAcademicasPage() {
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [alumnoQuery, setAlumnoQuery] = useState('');
    const [alumnosHits, setAlumnosHits] = useState([]);
    const [alumnoSel, setAlumnoSel] = useState(null);

    const [matriculaIdInput, setMatriculaIdInput] = useState('');
    const [matricula, setMatricula] = useState(null);

    const [ciclos, setCiclos] = useState([]);
    const [cicloEscolarId, setCicloEscolarId] = useState('');

    const [tipoImportacion, setTipoImportacion] = useState('historial');

    const [planEstudioEtiqueta, setPlanEstudioEtiqueta] = useState('');

    const [filasUi, setFilasUi] = useState([emptyImportRow()]);
    const [pasteArea, setPasteArea] = useState('');

    const [importacionId, setImportacionId] = useState(null);
    const [importacion, setImportacion] = useState(null);

    const [informeValidacion, setInformeValidacion] = useState(null);
    const [conciliacion, setConciliacion] = useState(null);

    const [filasEdit, setFilasEdit] = useState([]);

    const [forzarSinPlan, setForzarSinPlan] = useState(false);
    const [motivoLegacy, setMotivoLegacy] = useState('');
    const [legacyAck, setLegacyAck] = useState(false);

    const [resumenFinal, setResumenFinal] = useState(null);

    const duplicadosLocales = useMemo(() => detectDuplicateKeys(filasUi), [filasUi]);

    const sinPlanPendiente = useMemo(() => {
        if (!conciliacion?.filas) return 0;
        return conciliacion.filas.filter((f) => f.clave && !f.coincide_plan).length;
    }, [conciliacion]);

    const confirmacionBloqueada = useMemo(() => {
        if (duplicadosLocales.length > 0) return true;
        if (!informeValidacion) return true;
        if (informeValidacion.tiene_bloqueos === true && !forzarSinPlan) return true;
        if (sinPlanPendiente > 0 && !forzarSinPlan) return true;
        return false;
    }, [duplicadosLocales.length, informeValidacion, forzarSinPlan, sinPlanPendiente]);

    const legadoMotivoInvalido = useMemo(
        () => forzarSinPlan && (motivoLegacy.trim().length < 20 || !legacyAck),
        [forzarSinPlan, motivoLegacy, legacyAck],
    );

    const loadCiclos = useCallback(async () => {
        try {
            const res = await catalogosApi.ciclosEscolares();
            setCiclos(res?.data ?? []);
        } catch {
            setCiclos([]);
        }
    }, []);

    useEffect(() => {
        loadCiclos();
    }, [loadCiclos]);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (alumnoQuery.trim().length < 2) {
                setAlumnosHits([]);
                return;
            }
            try {
                const res = await alumnosApi.list({ q: alumnoQuery.trim(), per_page: 15 });
                const hits = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
                setAlumnosHits(hits);
            } catch {
                setAlumnosHits([]);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [alumnoQuery]);

    useEffect(() => {
        if (!matricula?.oferta_academica_id || !cicloEscolarId) {
            setPlanEstudioEtiqueta('');
            return;
        }
        let cancel = false;
        (async () => {
            try {
                const res = await catalogosApi.ofertasAcademicas({
                    ciclo_escolar_id: Number(cicloEscolarId),
                });
                const rows = res?.data ?? [];
                if (cancel) return;
                const match = rows.find((o) => Number(o.id) === Number(matricula.oferta_academica_id));
                if (match) {
                    setPlanEstudioEtiqueta(match.clave ? `Oferta ${match.clave} — reconocida para el ciclo elegido` : 'Oferta reconocida — plan vigente en catálogo');
                } else {
                    setPlanEstudioEtiqueta(
                        'La oferta enlazada a la matrícula no está disponible para el ciclo seleccionado. Confirme el ciclo institucional o actualice los catálogos.',
                    );
                }
            } catch {
                if (!cancel) setPlanEstudioEtiqueta('');
            }
        })();
        return () => {
            cancel = true;
        };
    }, [matricula, cicloEscolarId]);

    async function verificarMatricula() {
        setError('');
        setMessage('');
        if (!matriculaIdInput.trim()) {
            setError('Indique la clave numérica de la matrícula.');
            return;
        }
        setBusy(true);
        try {
            const res = await matriculasApi.show(matriculaIdInput.trim());
            const m = res?.data !== undefined ? res.data : res;
            setMatricula(m);
            if (alumnoSel && Number(m.alumno_id) !== Number(alumnoSel.id)) {
                setError(
                    'La matrícula no corresponde al alumno seleccionado. Verifique la clave de matrícula o seleccione otro alumno.',
                );
                setMatricula(null);
                return;
            }
            setMessage('Matrícula verificada.');
        } catch (err) {
            setMatricula(null);
            setError(formatApiErrors(err));
        } finally {
            setBusy(false);
        }
    }

    function aplicarPegado() {
        const nuevas = parseSpreadsheetPaste(pasteArea);
        if (nuevas.length === 0) {
            setError('No se detectaron filas válidas (se requiere al menos columna clave).');
            return;
        }
        setFilasUi(nuevas);
        setPasteArea('');
        setMessage(`${nuevas.length} filas cargadas desde el portapapeles.`);
        setError('');
    }

    function updateFila(i, field, value) {
        setFilasUi((rows) => rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
    }

    function addFila() {
        setFilasUi((rows) => [...rows, emptyImportRow()]);
    }

    function removeFila(i) {
        setFilasUi((rows) => rows.filter((_, j) => j !== i));
    }

    async function descargarPlantillaJson() {
        setError('');
        try {
            const res = await importacionesApi.plantilla();
            const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'plantilla-importacion-historica.json';
            a.click();
            URL.revokeObjectURL(a.href);
            setMessage('Plantilla descargada (JSON con columnas sugeridas).');
        } catch (err) {
            setError(formatApiErrors(err));
        }
    }

    async function crearBorradorServidor() {
        setError('');
        setMessage('');
        if (!matricula?.id || !cicloEscolarId) {
            setError('Complete matrícula verificada y ciclo escolar.');
            return;
        }
        const payloadFilas = toApiFilasPayload(filasUi);
        if (payloadFilas.length === 0) {
            setError('Agregue al menos una fila con clave de materia.');
            return;
        }
        setBusy(true);
        try {
            const res = await importacionesApi.create({
                matricula_id: Number(matricula.id),
                ciclo_escolar_id: Number(cicloEscolarId),
                filas_payload: payloadFilas,
                metadata: {
                    tipo_importacion: tipoImportacion,
                    plan_referencia_ui: planEstudioEtiqueta,
                },
            });
            const data = res?.data !== undefined ? res.data : res;
            setImportacionId(data.id);
            setImportacion(data);
            setFilasEdit(JSON.parse(JSON.stringify(filasUi)));
            setStep(3);
            setMessage(`Importación #${data.id} registrada como borrador. Continúe con la prevalidación.`);
        } catch (err) {
            setError(formatApiErrors(err));
        } finally {
            setBusy(false);
        }
    }

    async function ejecutarPrevalidar() {
        if (!importacionId) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const res = await importacionesApi.prevalidar(importacionId);
            setInformeValidacion(res.informe_validacion ?? null);
            setConciliacion(res.conciliacion ?? null);
            const data = res?.data ?? res;
            setImportacion(data);
            setStep(4);
            setMessage('Prevalidación completada. Revise el informe y la conciliación.');
        } catch (err) {
            setError(formatApiErrors(err));
        } finally {
            setBusy(false);
        }
    }

    function updateFilaEdit(idx, field, value) {
        setFilasEdit((rows) => rows.map((r, j) => (j === idx ? { ...r, [field]: value } : r)));
    }

    async function confirmarImportacion() {
        if (!importacionId) return;
        if (forzarSinPlan) {
            if (motivoLegacy.trim().length < 20) {
                setError('El motivo institucional debe tener al menos 20 caracteres.');
                return;
            }
            if (!legacyAck) {
                setError('Debe confirmar que comprende el modo legado controlado.');
                return;
            }
        }
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const mergedFilas = filasUi.map((base, i) => ({
                ...base,
                ...(filasEdit[i] || {}),
            }));
            const payload = {
                filas_payload: toApiFilasPayload(mergedFilas),
                forzar_sin_plan_materia: forzarSinPlan,
                motivo_forzar_sin_plan: forzarSinPlan ? motivoLegacy.trim() : undefined,
            };
            const res = await importacionesApi.confirmar(importacionId, payload);
            setResumenFinal(res?.resumen ?? null);
            const doc = res?.data !== undefined ? res.data : null;
            setImportacion(doc);
            setStep(6);
            setMessage('Importación confirmada. La trayectoria se recalculó en el servidor.');
        } catch (err) {
            if (err?.status === 403) {
                setError(
                    `${formatApiErrors(err)} Si debe aplicar «forzar sin plan», solicite el permiso institucional correspondiente al administrador.`,
                );
            } else {
                setError(formatApiErrors(err));
            }
        } finally {
            setBusy(false);
        }
    }

    async function cancelarImportacion() {
        if (!importacionId) return;
        if (!window.confirm('¿Cancelar esta importación? No podrá confirmarla después.')) return;
        setBusy(true);
        setError('');
        try {
            await importacionesApi.cancelar(importacionId);
            setMessage('Importación cancelada.');
            reiniciarTodo();
        } catch (err) {
            setError(formatApiErrors(err));
        } finally {
            setBusy(false);
        }
    }

    function reiniciarTodo() {
        setStep(0);
        setAlumnoSel(null);
        setAlumnoQuery('');
        setMatriculaIdInput('');
        setMatricula(null);
        setCicloEscolarId('');
        setTipoImportacion('historial');
        setFilasUi([emptyImportRow()]);
        setImportacionId(null);
        setImportacion(null);
        setInformeValidacion(null);
        setConciliacion(null);
        setFilasEdit([]);
        setForzarSinPlan(false);
        setMotivoLegacy('');
        setLegacyAck(false);
        setResumenFinal(null);
        setError('');
        setMessage('');
    }

    const informe = informeValidacion;

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Importación histórica de materias"
                subtitle="Flujo: contexto → datos → prevalidación → conciliación → confirmación → resultado. No confirme si hay duplicados locales, bloqueos de plan sin «forzar» o filas sin concordancia en plan."
                actions={
                    <ActionButton variant="secondary" type="button" onClick={reiniciarTodo} disabled={busy}>
                        Nueva importación
                    </ActionButton>
                }
            />

            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {STEPS.map((label, i) => (
                    <span
                        key={label}
                        className={
                            i === step
                                ? 'font-semibold text-slate-900'
                                : i < step
                                  ? 'text-emerald-700'
                                  : ''
                        }
                    >
                        {i + 1}. {label}
                        {i < STEPS.length - 1 ? ' · ' : ''}
                    </span>
                ))}
            </div>

            {error ? <ErrorState message={error} /> : null}
            {message ? <AlertBox type="success" message={message} /> : null}

            {/* Paso 0 · Contexto */}
            {step === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-4">
                    <h3 className="text-sm font-semibold text-slate-800">1. Alumno y matrícula</h3>
                    <p className="text-xs text-slate-500">
                        Busque al alumno por nombre o CURP. Indique la clave de matrícula (única por alumno) y
                        verifique con el botón.
                    </p>
                    <FormField
                        label="Buscar alumno"
                        value={alumnoQuery}
                        onChange={setAlumnoQuery}
                        placeholder="Nombre o CURP"
                    />
                    {alumnosHits.length > 0 ? (
                        <ul className="max-h-40 overflow-auto rounded border border-slate-100 text-sm">
                            {alumnosHits.map((a) => (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        className={`w-full px-2 py-1.5 text-left hover:bg-slate-50 ${
                                            alumnoSel?.id === a.id ? 'bg-sky-50' : ''
                                        }`}
                                        onClick={() => {
                                            setAlumnoSel(a);
                                            setMessage(`Alumno seleccionado: ${a.nombre} ${a.primer_apellido}.`);
                                        }}
                                    >
                                        <span className="font-medium">{a.nombre}</span> {a.primer_apellido} · CURP{' '}
                                        {a.curp}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
                        <FormField
                            label="Matrícula (clave numérica)"
                            value={matriculaIdInput}
                            onChange={setMatriculaIdInput}
                            placeholder="Ej. 12"
                        />
                        <div className="flex items-end">
                            <ActionButton type="button" onClick={verificarMatricula} disabled={busy}>
                                Verificar matrícula
                            </ActionButton>
                        </div>
                    </div>

                    {matricula ? (
                        <div className="rounded bg-slate-50 p-3 text-xs text-slate-700">
                            <div>
                                <strong>Matrícula verificada</strong> · clave institucional {matricula.matricula ?? '—'}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                {matricula.alumno_id ? (
                                    <Link
                                        className="text-emerald-800 underline underline-offset-2"
                                        to={`/app/alumnos/${matricula.alumno_id}/expediente`}
                                    >
                                        Ver expediente 360°
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <h3 className="text-sm font-semibold text-slate-800 pt-2">Ciclo escolar y tipo</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-1">
                            <span className="text-xs font-medium text-slate-600">Ciclo escolar</span>
                            <select
                                className="inst-input text-sm"
                                value={cicloEscolarId}
                                onChange={(e) => setCicloEscolarId(e.target.value)}
                            >
                                <option value="">Seleccione…</option>
                                {ciclos.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.clave} — {c.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1">
                            <span className="text-xs font-medium text-slate-600">Tipo de importación</span>
                            <select
                                className="inst-input text-sm"
                                value={tipoImportacion}
                                onChange={(e) => setTipoImportacion(e.target.value)}
                            >
                                <option value="historial">Historial académico</option>
                                <option value="kardex">Kárdex / concentrado</option>
                            </select>
                        </label>
                    </div>

                    {planEstudioEtiqueta ? (
                        <p className="text-xs text-slate-600">
                            <strong>Referencia plan:</strong> {planEstudioEtiqueta}
                        </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-2">
                        <ActionButton variant="secondary" type="button" onClick={descargarPlantillaJson}>
                            Descargar plantilla (JSON)
                        </ActionButton>
                        <ActionButton
                            type="button"
                            onClick={() => setStep(1)}
                            disabled={!matricula || !cicloEscolarId}
                        >
                            Siguiente: cargar filas
                        </ActionButton>
                    </div>
                </div>
            ) : null}

            {/* Paso 1 · Filas */}
            {step === 1 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-4">
                    <h3 className="text-sm font-semibold text-slate-800">2. Filas a importar</h3>
                    <p className="text-xs text-slate-500">
                        Pegue desde Excel (tabuladas) o CSV. Primera fila puede ser encabezados. También puede editar
                        la tabla manualmente.
                    </p>

                    <textarea
                        className="inst-input min-h-[100px] font-mono text-xs"
                        placeholder="Pegue aquí…"
                        value={pasteArea}
                        onChange={(e) => setPasteArea(e.target.value)}
                    />
                    <ActionButton variant="secondary" type="button" onClick={aplicarPegado}>
                        Aplicar pegado a la tabla
                    </ActionButton>

                    {duplicadosLocales.length > 0 ? (
                        <AlertBox
                            type="warning"
                            message={`Posibles duplicados locales (clave+periodo): ${duplicadosLocales.length}. El servidor omitirá duplicados ya existentes en el mismo ciclo.`}
                        />
                    ) : null}

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="p-2">#</th>
                                    {FILAS_PAYLOAD_FIELDS.map((f) => (
                                        <th key={f} className="p-2 whitespace-nowrap">
                                            {f.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                    <th className="p-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {filasUi.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="p-1">{i + 1}</td>
                                        {FILAS_PAYLOAD_FIELDS.map((field) => (
                                            <td key={field} className="p-1">
                                                <input
                                                    className="inst-input w-full min-w-[72px] py-1 text-xs"
                                                    value={row[field] ?? ''}
                                                    onChange={(e) => updateFila(i, field, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="p-1">
                                            <button
                                                type="button"
                                                className="text-rose-600 text-xs"
                                                onClick={() => removeFila(i)}
                                            >
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <ActionButton variant="secondary" type="button" onClick={addFila}>
                        + Fila
                    </ActionButton>

                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" type="button" onClick={() => setStep(0)}>
                            Atrás
                        </ActionButton>
                        <ActionButton type="button" onClick={() => setStep(2)} disabled={!matricula || !cicloEscolarId}>
                            Siguiente: registrar borrador
                        </ActionButton>
                    </div>
                </div>
            ) : null}

            {/* Paso 2 · Registro */}
            {step === 2 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">3. Registrar borrador en servidor</h3>
                    <p className="text-xs text-slate-600">
                        Se enviará POST <code className="bg-slate-100 px-1">/academico/importaciones</code> con{' '}
                        {toApiFilasPayload(filasUi).length} filas.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" type="button" onClick={() => setStep(1)}>
                            Atrás
                        </ActionButton>
                        <ActionButton type="button" onClick={crearBorradorServidor} disabled={busy}>
                            {busy ? 'Enviando…' : 'Crear importación (borrador)'}
                        </ActionButton>
                    </div>
                </div>
            ) : null}

            {/* Paso 3 · Prevalidación */}
            {step === 3 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">4. Prevalidación contra plan</h3>
                    <p className="text-xs text-slate-600">
                        Importación #{importacionId} · estado {importacion?.estado ?? '—'}
                    </p>
                    <ActionButton type="button" onClick={ejecutarPrevalidar} disabled={busy}>
                        {busy ? 'Validando…' : 'Ejecutar prevalidación'}
                    </ActionButton>
                    <ActionButton variant="secondary" type="button" onClick={cancelarImportacion} disabled={busy}>
                        Cancelar importación
                    </ActionButton>
                </div>
            ) : null}

            {/* Paso 4 · Informe + conciliación */}
            {step === 4 && informe ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-4">
                    <h3 className="text-sm font-semibold text-slate-800">5. Informe y conciliación</h3>

                    <div className="grid gap-2 md:grid-cols-2 text-xs">
                        <div className="rounded border border-slate-100 p-2">
                            <strong>Claves inexistentes en plan</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-slate-600">
                                {(informe.claves_inexistentes ?? []).join(', ') || '—'}
                            </pre>
                        </div>
                        <div className="rounded border border-slate-100 p-2">
                            <strong>Periodo curricular incorrecto</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-slate-600">
                                {(informe.periodo_curricular_incorrecto ?? []).join('\n') || '—'}
                            </pre>
                        </div>
                        <div className="rounded border border-slate-100 p-2">
                            <strong>Materias faltantes (en plan, no en archivo)</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-slate-600">
                                {(informe.faltantes ?? []).join(', ') || '—'}
                            </pre>
                        </div>
                        <div className="rounded border border-slate-100 p-2">
                            <strong>Materias extra (en archivo, no en plan)</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-slate-600">
                                {(informe.extra ?? []).join(', ') || '—'}
                            </pre>
                        </div>
                    </div>

                    {informe.tiene_bloqueos ? (
                        <AlertBox
                            type="warning"
                            message="El informe marca posibles bloqueos respecto al plan. Corrija el archivo o use conciliación / modo controlado según política."
                        />
                    ) : (
                        <AlertBox type="success" message="Sin bloqueos detectados en la comparación plan vs archivo." />
                    )}

                    <h4 className="text-xs font-semibold text-slate-700">Conciliación por fila</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b bg-slate-50 text-left">
                                    <th className="p-2">#</th>
                                    <th className="p-2">Importado (clave / periodo)</th>
                                    <th className="p-2">Plan</th>
                                    <th className="p-2">Editar calif. / periodo real / eval. / estatus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(conciliacion?.filas ?? []).map((cf) => {
                                    const idx = cf.indice;
                                    const row = {
                                        ...(filasUi[idx] || {}),
                                        ...(filasEdit[idx] || {}),
                                    };
                                    const locked = cf.coincide_plan && cf.plan_materia_id;
                                    return (
                                        <tr key={idx} className="border-b border-slate-100 align-top">
                                            <td className="p-2">{idx + 1}</td>
                                            <td className="p-2">
                                                <div>
                                                    clave: <strong>{row.clave ?? cf.clave}</strong>
                                                </div>
                                                <div className="text-slate-500">
                                                    {row.tipo_periodo_curricular ?? 'semestre'} · #
                                                    {row.numero_periodo_curricular ?? '—'}
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                {locked ? (
                                                    <>
                                                        <span className="font-medium text-emerald-800">Coincide con el plan de estudios</span>
                                                        <div className="text-slate-600">
                                                            Clave, nombre y créditos se tomarán del catálogo del plan al confirmar.
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-amber-700">Sin coincidencia en plan</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <div className="grid gap-1">
                                                    <input
                                                        className="inst-input py-1 text-xs"
                                                        placeholder="Calificación final"
                                                        value={row.calificacion_final ?? ''}
                                                        disabled={busy}
                                                        onChange={(e) => updateFilaEdit(idx, 'calificacion_final', e.target.value)}
                                                    />
                                                    <input
                                                        className="inst-input py-1 text-xs"
                                                        placeholder="Periodo (ciclo cursado)"
                                                        value={row.periodo ?? ''}
                                                        disabled={busy}
                                                        onChange={(e) => updateFilaEdit(idx, 'periodo', e.target.value)}
                                                    />
                                                    <input
                                                        className="inst-input py-1 text-xs"
                                                        placeholder="Tipo evaluación"
                                                        value={row.tipo_evaluacion ?? ''}
                                                        disabled={busy}
                                                        onChange={(e) =>
                                                            updateFilaEdit(idx, 'tipo_evaluacion', e.target.value)
                                                        }
                                                    />
                                                    <input
                                                        className="inst-input py-1 text-xs"
                                                        placeholder="Estatus acreditación"
                                                        value={row.estatus_acreditacion ?? ''}
                                                        disabled={busy}
                                                        onChange={(e) =>
                                                            updateFilaEdit(idx, 'estatus_acreditacion', e.target.value)
                                                        }
                                                    />
                                                    {!locked ? (
                                                        <>
                                                            <input
                                                                className="inst-input py-1 text-xs"
                                                                placeholder="semestre_dec (DEC si no es semestre)"
                                                                value={row.semestre_dec ?? ''}
                                                                disabled={busy}
                                                                onChange={(e) =>
                                                                    updateFilaEdit(idx, 'semestre_dec', e.target.value)
                                                                }
                                                            />
                                                            <input
                                                                className="inst-input py-1 text-xs"
                                                                placeholder="Nombre materia (requerido si forzar)"
                                                                value={row.nombre ?? ''}
                                                                disabled={busy}
                                                                onChange={(e) => updateFilaEdit(idx, 'nombre', e.target.value)}
                                                            />
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {sinPlanPendiente > 0 ? (
                        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                            <strong>{sinPlanPendiente}</strong> fila(s) sin concordancia en el plan. Para confirmarlas
                            active «forzar sin plan», motivo institucional (mín. 20 caracteres) y el acuse en el paso de
                            confirmación; quedarán sujetas a validación normativa legacy.
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" type="button" onClick={() => setStep(3)}>
                            Atrás
                        </ActionButton>
                        <ActionButton type="button" onClick={() => setStep(5)}>
                            Siguiente: confirmación
                        </ActionButton>
                    </div>
                </div>
            ) : null}

            {/* Paso 5 · Confirmación */}
            {step === 5 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">6. Confirmar importación</h3>
                    <p className="text-xs text-slate-600">
                        Se enviará la confirmación con las filas editadas en conciliación. La trayectoria se recalcula en
                        servidor.
                    </p>

                    {sinPlanPendiente > 0 ? (
                        <label className="flex items-start gap-2 text-xs">
                            <input
                                type="checkbox"
                                checked={forzarSinPlan}
                                onChange={(e) => setForzarSinPlan(e.target.checked)}
                            />
                            <span>
                                Forzar importación sin fila del plan (legado controlado). Requiere permiso institucional;
                                si el servidor responde 403, solicite el permiso al administrador.
                            </span>
                        </label>
                    ) : null}

                    {forzarSinPlan ? (
                        <div className="grid gap-2">
                            <label className="grid gap-1 text-xs">
                                <span className="font-medium">Motivo institucional (mín. 20 caracteres)</span>
                                <textarea
                                    className="inst-input min-h-[80px] text-xs"
                                    value={motivoLegacy}
                                    onChange={(e) => setMotivoLegacy(e.target.value)}
                                />
                            </label>
                            <label className="flex items-start gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    checked={legacyAck}
                                    onChange={(e) => setLegacyAck(e.target.checked)}
                                />
                                <span>
                                    Confirmo que los datos sin plan quedarán como «legacy controlado», sujetos a
                                    validación normativa antes de certificación oficial.
                                </span>
                            </label>
                        </div>
                    ) : null}

                    {confirmacionBloqueada ? (
                        <AlertBox
                            type="warning"
                            message="Confirme la importación sólo después de resolver duplicados, alinear filas bloqueadas con el plan o activar «forzar sin plan» con motivo institucional y acuses completos."
                        />
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" type="button" onClick={() => setStep(4)}>
                            Atrás
                        </ActionButton>
                        <ActionButton type="button" onClick={confirmarImportacion} disabled={busy || confirmacionBloqueada || legadoMotivoInvalido}>
                            {busy ? 'Confirmando…' : 'Confirmar importación'}
                        </ActionButton>
                        <ActionButton variant="danger" type="button" onClick={cancelarImportacion} disabled={busy}>
                            Cancelar lote
                        </ActionButton>
                    </div>
                </div>
            ) : null}

            {/* Paso 6 · Resultado */}
            {step === 6 && resumenFinal ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 grid gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">7. Resultado</h3>
                    <ul className="text-sm text-slate-700 list-disc pl-5">
                        <li>
                            Filas insertadas: <strong>{resumenFinal.insertados ?? '—'}</strong>
                        </li>
                        <li>
                            Omitidas por duplicado u otras reglas: el servidor no devuelve detalle; revise materias
                            cursadas si falta alguna.
                        </li>
                        <li>Trayectoria: recalculada automáticamente tras confirmar.</li>
                    </ul>
                    {importacion?.matricula?.alumno_id ? (
                        <p className="text-xs text-slate-600">
                            Puede revisar expediente único consolidado desde la vista institucional del alumno antes de liberar expedición de firmas.
                        </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                        {importacion?.matricula?.alumno_id ? (
                            <Link
                                to={`/app/alumnos/${importacion.matricula.alumno_id}/expediente`}
                                className="inst-btn inst-btn-primary text-sm inline-flex items-center rounded px-3 py-2"
                            >
                                Abrir expediente 360°
                            </Link>
                        ) : null}
                        <Link to="/app/trayectorias" className="inst-btn inst-btn-secondary text-sm inline-flex items-center rounded px-3 py-2">
                            Ir a trayectoria
                        </Link>
                        <ActionButton variant="secondary" type="button" onClick={reiniciarTodo}>
                            Nueva importación
                        </ActionButton>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

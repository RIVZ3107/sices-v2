import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { trayectoriasApi } from '../../api/trayectorias';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { FormField } from '../../components/FormField';
import { AlertBox } from '../../components/ui/AlertBox';
import { AcademicProgressCard } from '../../components/academic/AcademicProgressCard';
import { SectionCard } from '../../components/ui/SectionCard';

export function TrayectoriaDetallePage() {
    const routeParams = useParams();
    const [searchParams] = useSearchParams();
    const [q, setQ] = useState('');
    const [hits, setHits] = useState([]);
    const [sel, setSel] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [trayRaw, setTrayRaw] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const fixedPk =
        Number(routeParams?.alumnoId ?? routeParams?.id ?? NaN) > 0
            ? Number(routeParams.alumnoId ?? routeParams.id)
            : Number.NaN;

    const cargarDesdeRefs = useCallback(async (refs) => {
        if (!refs?.matricula_id) return;
        setTrayRaw(null);
        try {
            const r = await trayectoriasApi.porMatricula(refs.matricula_id);
            setTrayRaw(r?.data ?? null);
        } catch {
            setTrayRaw(null);
        }
    }, []);

    const cargarResumenPorAlumno = useCallback(
        async (pk) => {
            if (!Number.isFinite(pk) || pk <= 0) return;
            const d = await alumnosApi.resumenInstitucional(pk);
            setResumen(d?.data ?? null);
            await cargarDesdeRefs(d?.data?.refs ?? null);
        },
        [cargarDesdeRefs],
    );

    useEffect(() => {
        if (Number.isFinite(fixedPk) && fixedPk > 0) {
            void (async () => {
                setBusy(true);
                setError('');
                try {
                    const a = await alumnosApi.show(fixedPk);
                    setSel(a?.data ?? a);
                    await cargarResumenPorAlumno(fixedPk);
                } catch (e) {
                    setError(e?.message ?? 'No se cargó la trayectoría.');
                } finally {
                    setBusy(false);
                }
            })();
            return;
        }

        let t = setTimeout(async () => {
            if (q.trim().length < 3) return;
            try {
                const res = await alumnosApi.list({ q: q.trim(), per_page: 10 });
                setHits(Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []);
            } catch {
                setHits([]);
            }
        }, 350);

        return () => clearTimeout(t);
    }, [fixedPk, q, cargarResumenPorAlumno]);

    const seleccionar = async (row) => {
        setBusy(true);
        setError('');
        try {
            setSel(row);
            await cargarResumenPorAlumno(Number(row?.id ?? row?.data?.id));
            setMsg('Datos cargados.');
        } catch (e) {
            setError(e?.message ?? 'Error al cargar.');
        } finally {
            setBusy(false);
        }
    };

    const planPartes = useMemo(() => {
        const t = resumen?.trayectoria ?? {};
        const m = trayRaw ?? {};
        return [
            { label: 'Avance contra plan', value: `${t?.materias_cursadas ?? m?.asignaturas_cursadas ?? 0} / ${t?.materias_totales_plan ?? m?.asignaturas_total ?? 0}`, hint: 'Materias cursadas frente al total del plan.' },
            { label: 'Materias acreditadas', value: t?.aprobaciones ?? m?.materias_acreditadas ?? 0, hint: 'Con calificación aprobatoria.' },
            { label: 'Materias pendientes', value: Math.max((t?.materias_totales_plan ?? m?.asignaturas_total ?? 0) - (t?.materias_cursadas ?? m?.asignaturas_cursadas ?? 0), 0), hint: 'Aún no cursadas.' },
            { label: 'Materias no acreditadas', value: t?.no_acreditadas ?? m?.materias_no_acreditadas ?? 0, hint: 'Requieren regularización.' },
            { label: 'Créditos obtenidos', value: t?.creditos_obtenidos ?? m?.creditos_obtenidos ?? '—', hint: '' },
            { label: 'Créditos totales', value: t?.creditos_registrados ?? m?.creditos_totales ?? '—', hint: '' },
            { label: 'Promedio', value: t?.promedio ?? m?.promedio_aprovechamiento ?? '—', hint: '' },
            { label: 'Estado de trayectoria', value: t?.estado_consolidacion ?? 'Sin trayectoria', hint: '' },
        ];
    }, [resumen, trayRaw]);

    async function recalcular() {
        const rid = resumen?.refs?.matricula_id;
        if (!rid) return;
        setBusy(true);
        setError('');
        try {
            const r = await trayectoriasApi.recalcular(rid);
            setTrayRaw(r?.data ?? null);
            await cargarResumenPorAlumno(Number(sel?.id ?? fixedPk));
            setMsg('Trayectoria sincronizada con las materias actuales.');
        } catch (e) {
            setError(e?.message ?? 'No se recalculó (posible expediente consolidado por certificado).');
        } finally {
            setBusy(false);
        }
    }

    const alumnoNombre = `${sel?.nombre ?? ''} ${sel?.primer_apellido ?? ''} ${sel?.segundo_apellido ?? ''}`.trim();

    const pendFueraPlan = useMemo(() => {
        const list = resumen?.materias_cursadas ?? [];
        return list.filter((m) => m.posible_fuera_de_plan === true);
    }, [resumen]);
    const tieneLegacyBloqueante = Boolean(resumen?.contexto_legacy_normativo?.requiere_atencion);
    const bloqueoCertificacion = !resumen?.trayectoria || (resumen?.trayectoria?.materias_totales_plan ?? 0) > (resumen?.trayectoria?.materias_cursadas ?? 0) || tieneLegacyBloqueante || !resumen?.refs?.matricula_id;
    const motivoBloqueoCertificacion = !resumen
        ? 'No hay alumno seleccionado.'
        : !resumen?.refs?.matricula_id
            ? 'Falta matrícula activa.'
            : !resumen?.trayectoria
                ? 'Falta trayectoria.'
                : (resumen?.trayectoria?.materias_totales_plan ?? 0) > (resumen?.trayectoria?.materias_cursadas ?? 0)
                    ? 'Faltan materias por cursar.'
                    : tieneLegacyBloqueante
                        ? 'Hay validación normativa legacy pendiente.'
                        : '';

    const matSel = alumnoNombre || '';

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Trayectoria académica"
                subtitle={Number.isFinite(fixedPk) && fixedPk > 0 ? matSel || `Alumno fijado desde expediente.` : `Busca un alumno y revisa cumplimiento de plan.`}
                actions={
                    resumen?.refs?.alumno_id ? (
                        <Link className="inst-btn inst-btn-secondary text-sm" to={`/app/alumnos/${resumen.refs.alumno_id}/expediente`}>
                            Expediente alumno 360°
                        </Link>
                    ) : null
                }
            />
            {!Number.isFinite(fixedPk) || fixedPk <= 0 ? (
                <SectionCard title="Selección de alumno" subtitle="Escribe CURP o nombre (mín. 3 caracteres)">
                    <FormField label="Buscar alumno" value={q} onChange={setQ} placeholder="CURP / nombre…" />
                    <ul className="mt-2 grid gap-1 text-sm">
                        {hits.map((h) => (
                            <li key={h.id}>
                                <button type="button" className="text-left text-blue-700 hover:underline" onClick={() => void seleccionar(h)}>
                                    {h.nombre} {h.primer_apellido} — {h.curp}
                                </button>
                            </li>
                        ))}
                    </ul>
                </SectionCard>
            ) : null}

            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}

            {resumen?.refs?.matricula_id ? (
                <>
                    <AcademicProgressCard titulo={resumen?.trayectoria?.estado_consolidacion ?? 'Progresión académica'} partes={planPartes} />
                    <div className="grid gap-3 md:grid-cols-4">
                        <article className="metric-card metric-card-primary"><p className="metric-card-title">Avance contra plan</p><p className="metric-card-value">{planPartes[0]?.value}</p></article>
                        <article className="metric-card metric-card-success"><p className="metric-card-title">Materias acreditadas</p><p className="metric-card-value">{planPartes[1]?.value}</p></article>
                        <article className="metric-card metric-card-warning"><p className="metric-card-title">Materias pendientes</p><p className="metric-card-value">{planPartes[2]?.value}</p></article>
                        <article className="metric-card metric-card-danger"><p className="metric-card-title">Materias fuera de plan</p><p className="metric-card-value">{pendFueraPlan.length}</p></article>
                    </div>
                </>
            ) : null}

            {pendFueraPlan.length ? (
                <AlertBox type="warning" message={`Hay ${pendFueraPlan.length} materia(s) posiblemente fuera del plan institucional. Revísalas con Coordinación antes de liberar.`} />
            ) : null}
            {tieneLegacyBloqueante ? (
                <AlertBox type="warning" message="Existe validación normativa pendiente/rechazada; no se puede solicitar certificación hasta regularizar." />
            ) : null}

            <SectionCard title="Acciones" subtitle="La sincronización recalcula solo con evidencia curricular válida">
                <div className="flex flex-wrap gap-2">
                    <ActionButton type="button" disabled={busy || !resumen?.refs?.matricula_id} onClick={() => void recalcular()}>
                        {busy ? 'Sincronizando…' : 'Recalcular desde materias'}
                    </ActionButton>
                    <Link className={`inst-btn ${bloqueoCertificacion ? 'inst-btn-secondary blocked-action' : 'inst-btn-success'} text-sm px-4 py-2`} to={`/app/certificacion/solicitud?alumno=${searchParams.get('alumno') ?? sel?.id ?? fixedPk ?? resumen?.refs?.alumno_id ?? ''}`}>
                        Solicitar certificado total
                    </Link>
                    <Link className={`inst-btn inst-btn-secondary text-sm px-4 py-2 ${bloqueoCertificacion ? 'blocked-action' : ''}`} to={`/app/certificacion/solicitud?alumno=${searchParams.get('alumno') ?? sel?.id ?? fixedPk ?? resumen?.refs?.alumno_id ?? ''}&tipo=parcial`}>
                        Solicitar certificado parcial
                    </Link>
                </div>
                {bloqueoCertificacion ? <p className="mt-2 text-xs text-amber-700">Acción bloqueada: {motivoBloqueoCertificacion}</p> : null}
            </SectionCard>

            {!resumen && !busy ? (
                <p className="text-sm text-slate-600">Seleccione un alumno para continuar.</p>
            ) : null}
        </section>
    );
}

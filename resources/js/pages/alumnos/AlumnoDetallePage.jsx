import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { catalogosApi } from '../../api/catalogos';
import { controlEscolarApi } from '../../api/controlEscolar';
import { solicitudesMatriculaApi } from '../../api/solicitudesMatricula';
import { getUser } from '../../authStore';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { DataTable } from '../../components/ui/DataTable';
import { EstadoSepLegacyPanel } from '../expedientes/components/EstadoSepLegacyPanel';
import { ExpedienteAvanceResumen } from '../../components/alumnos/ExpedienteAvanceResumen';
import { AlumnoSeleccionCard } from '../../components/documentos/AlumnoSeleccionCard';
import { ValidacionSeveridadPanel } from '../../components/ui/ValidacionSeveridadPanel';
import { interpretarLegacyNormativo } from '../../utils/validacionInstitucionalUx';
import { sanitizeInstitutionalLabel, sanitizeInstitutionalMessage } from '../../utils/uxInstitucional';

function permiso(nombre) {
    return Boolean(getUser()?.permissions?.includes(nombre));
}

function etiquetaEstadoSolicitudMatricula(estado) {
    const mapa = {
        borrador: 'Borrador (preparación)',
        enviada: 'Enviada a Educación Superior',
        en_revision: 'En revisión',
        con_observaciones: 'Con observaciones (ES)',
        aprobada: 'Aprobada — pendiente asignar clave',
        matricula_asignada: 'Matrícula asignada',
        rechazada: 'Rechazada',
        cancelada: 'Cancelada',
    };
    return mapa[estado] ?? estado ?? '—';
}

function etiquetaModalidadUpn(mod) {
    if (mod === null || mod === undefined || mod === '') return '—';
    const m = String(mod).toLowerCase().trim();
    if (m === 'presencial') return 'Presencial';
    if (m === 'semipresencial') return 'Semipresencial';
    if (m === 'en_linea' || m === 'en línea' || m === 'en linea') return 'En línea';
    return String(mod);
}

const TABS = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'datos', label: 'Datos personales' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'inscripcion', label: 'Inscripción' },
    { key: 'carga', label: 'Carga académica' },
    { key: 'calificaciones', label: 'Calificaciones' },
    { key: 'trayectoria', label: 'Trayectoria' },
    { key: 'certificacion', label: 'Certificación' },
    { key: 'observaciones', label: 'Observaciones' },
    { key: 'historial', label: 'Historial' },
    { key: 'estado_sep', label: 'Estado SEP / SICES' },
];

export function AlumnoDetallePage() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const alumnoPk = Number(id ?? searchParams.get('alumno') ?? NaN);
    const [q, setQ] = useState('');
    const [hits, setHits] = useState([]);
    const [searchDone, setSearchDone] = useState(false);
    const [tab, setTab] = useState(searchParams.get('tab') ?? 'resumen');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [ofertasOpts, setOfertasOpts] = useState([]);
    const [ciclosOpts, setCiclosOpts] = useState([]);
    const [ofertaSel, setOfertaSel] = useState('');
    const [cicloSel, setCicloSel] = useState('');
    const [msgMat, setMsgMat] = useState('');

    const cargar = useCallback(async () => {
        if (!Number.isFinite(alumnoPk) || alumnoPk <= 0) {
            setData(null);
            return;
        }
        setBusy(true);
        setError('');
        try {
            const res = await alumnosApi.resumenInstitucional(alumnoPk);
            setData(res?.data ?? null);
        } catch (e) {
            setData(null);
            setError(e?.message ?? 'No se pudo cargar el expediente.');
        } finally {
            setBusy(false);
        }
    }, [alumnoPk]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        const t = searchParams.get('tab');
        if (t && TABS.some((x) => x.key === t) && t !== tab) {
            setTab(t);
        }
    }, [searchParams, tab]);

    useEffect(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (next.get('tab') === tab) {
                return prev;
            }
            next.set('tab', tab);
            return next;
        });
    }, [setSearchParams, tab]);

    useEffect(() => {
        const t = setTimeout(async () => {
            const term = q.trim();
            if (term.length === 0) {
                setHits([]);
                setSearchDone(false);
                return;
            }
            try {
                const res = await controlEscolarApi.expedientes(term);
                setHits(Array.isArray(res?.data) ? res.data : []);
                setSearchDone(true);
            } catch {
                setHits([]);
                setSearchDone(true);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        if (tab !== 'matricula' || !Number.isFinite(alumnoPk) || alumnoPk <= 0) {
            return undefined;
        }
        let cancel = false;
        (async () => {
            try {
                const [ro, rc] = await Promise.all([catalogosApi.ofertasAcademicas(), catalogosApi.ciclosEscolares()]);
                if (cancel) return;
                setOfertasOpts(Array.isArray(ro?.data) ? ro.data : []);
                setCiclosOpts(Array.isArray(rc?.data) ? rc.data : []);
            } catch {
                if (!cancel) {
                    setOfertasOpts([]);
                    setCiclosOpts([]);
                }
            }
        })();
        return () => {
            cancel = true;
        };
    }, [tab, alumnoPk]);

    const abrirExpediente = (alumnoId) => {
        setSearchParams({ alumno: String(alumnoId), tab: 'resumen' });
    };

    const legacy = data?.contexto_legacy_normativo;
    const legacyUx = interpretarLegacyNormativo(legacy, { flujo: 'expediente' });
    const expedienteNormativo = data?.expediente_normativo ?? {};
    const uiNorm = expedienteNormativo?.ui ?? {};
    const mensajesNormativos = expedienteNormativo?.mensajes_institucionales ?? [];
    const alumno = data?.alumno;
    const mat = data?.matricula;
    const solicitudMat = data?.solicitud_matricula;
    const trayectoria = data?.trayectoria;
    const docs = data?.documentos_certificacion ?? [];
    const observacionesPend = docs.filter((d) => d.requiere_revision_observaciones);
    const checklist = [
        { label: 'Alumno seleccionado', ok: Boolean(alumno?.curp) },
        { label: 'Matrícula activa', ok: Boolean(mat?.clave_matricula) },
        { label: 'Plan reconocido', ok: Boolean(mat?.plan_estudios) },
        { label: 'Materias registradas', ok: (data?.materias_cursadas ?? []).length > 0 },
        { label: 'Trayectoria consolidada', ok: Boolean(trayectoria) },
        { label: 'Sin bloqueos de validación institucional', ok: !Boolean(legacy?.requiere_atencion) },
    ];

    const tabLista = searchParams.get('tab') ?? 'resumen';

    if (!Number.isFinite(alumnoPk) || alumnoPk <= 0) {
        if (tabLista === 'ingreso') {
            return (
                <section className="grid gap-4">
                    <PageHeader
                        title="Aspirantes / Inscripciones"
                        subtitle="Flujo unificado de ingreso: aspirante, preinscripción, solicitud de matrícula e inscripción por ciclo. La inscripción escolar requiere matrícula asignada por Educación Superior."
                        actions={<Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm">Volver a expedientes</Link>}
                    />
                    <SectionCard title="Acciones">
                        <div className="flex flex-wrap gap-2">
                            <Link to="/app/alumnos/crear" className="inst-btn inst-btn-primary text-sm">Registrar aspirante</Link>
                            <Link to="/app/solicitudes-matricula" className="inst-btn inst-btn-secondary text-sm">Solicitudes de matrícula</Link>
                            <Link to="/app/importaciones" className="inst-btn inst-btn-secondary text-sm">Importaciones</Link>
                        </div>
                    </SectionCard>
                    <SectionCard title="Reglas operativas">
                        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                            <li>No confirme inscripción escolar sin matrícula asignada por Educación Superior.</li>
                            <li>Use expediente 360 para validar documentos operativos del expediente de ingreso.</li>
                            <li>Programas de licenciatura en educación (Normal / UPN); no aplique flujos de bachillerato genérico.</li>
                        </ul>
                    </SectionCard>
                </section>
            );
        }
        if (tabLista === 'bajas') {
            return (
                <section className="grid gap-4">
                    <PageHeader title="Bajas y cambios (desde expediente)" subtitle="Use el módulo dedicado para el registro formal o abra un expediente." actions={<Link to="/app/bajas-cambios" className="inst-btn inst-btn-primary text-sm">Ir a Bajas y cambios</Link>} />
                </section>
            );
        }
        return (
            <section className="grid gap-4">
                <PageHeader title="Expedientes académicos" subtitle="Centro operativo Expediente 360 — licenciaturas en educación (Normal / UPN)." />
                <SectionCard title="Buscar expediente" subtitle="Busque por CURP, nombre o matrícula.">
                    <input className="inst-input text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. CURP, nombre completo o matrícula" />
                    {q.trim().length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">Busque un alumno por CURP, nombre o matrícula para abrir su expediente.</p>
                    ) : null}
                    {searchDone && hits.length === 0 ? (
                        <div className="mt-3 rounded border border-slate-200 p-3">
                            <p className="text-sm text-slate-700">No encontramos expediente con ese dato.</p>
                            <div className="mt-3 flex gap-2">
                                <Link to="/app/alumnos/crear" className="inst-btn inst-btn-primary text-sm">Registrar alumno</Link>
                                <button type="button" onClick={() => setQ('')} className="inst-btn inst-btn-secondary text-sm">Limpiar búsqueda</button>
                                <Link to="/app/importaciones" className="inst-btn inst-btn-secondary text-sm">Importar historial</Link>
                            </div>
                        </div>
                    ) : null}
                    {hits.length > 0 ? (
                        <DataTable
                            columns={[
                                { key: 'folio_expediente', label: 'Folio expediente' },
                                { key: 'alumno', label: 'Alumno' },
                                { key: 'curp', label: 'CURP' },
                                { key: 'subsistema', label: 'Subsistema' },
                                { key: 'programa_plan', label: 'Programa' },
                                { key: 'sede_subsede', label: 'Sede / subsede' },
                                { key: 'estado_academico', label: 'Estado expediente' },
                                {
                                    key: 'ultima_actualizacion',
                                    label: 'Última actualización',
                                    render: (row) => (row.ultima_actualizacion ? String(row.ultima_actualizacion).slice(0, 10) : '—'),
                                },
                                {
                                    key: 'acciones',
                                    label: 'Acción',
                                    render: (row) => (
                                        <button type="button" onClick={() => abrirExpediente(row.alumno_id)} className="inst-btn inst-btn-secondary text-xs">
                                            Abrir expediente
                                        </button>
                                    ),
                                },
                            ]}
                            rows={hits}
                        />
                    ) : null}
                </SectionCard>
            </section>
        );
    }

    return (
        <section className="grid gap-4">
            <PageHeader
                title="Expediente académico (360)"
                subtitle="Operación por pestañas: matrícula vía solicitud a Educación Superior, inscripción, carga, calificaciones y documentos operativos."
                actions={<Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm">Cambiar alumno</Link>}
            />
            {error ? <ErrorState message={error} /> : null}
            {busy ? <p className="text-sm text-slate-600">Cargando expediente...</p> : null}
            {mensajesNormativos.length > 0
                ? mensajesNormativos.map((msg, idx) => (
                    <AlertBox
                        key={`norm-${idx}`}
                        type="warning"
                        message={sanitizeInstitutionalMessage(msg, 'Revise la información del expediente con su área normativa.')}
                    />
                ))
                : null}
            {legacyUx.mostrar ? (
                <ValidacionSeveridadPanel
                    severidad={legacyUx.severidad}
                    mensajes={[legacyUx.mensaje]}
                />
            ) : null}

            <AlumnoSeleccionCard
                datos={{
                    nombre_completo: sanitizeInstitutionalLabel(alumno?.nombre_completo),
                    curp: alumno?.curp,
                    matricula: mat?.clave_matricula ?? 'Sin matrícula',
                    institucion: sanitizeInstitutionalLabel(mat?.institucion),
                    subsistema: sanitizeInstitutionalLabel(mat?.subsistema),
                    programa_plan:
                        mat?.programa && mat?.plan_estudios
                            ? sanitizeInstitutionalLabel(`${mat.programa} · ${mat.plan_estudios}`)
                            : sanitizeInstitutionalLabel(mat?.programa),
                    ciclo_escolar: sanitizeInstitutionalLabel(mat?.ciclo_actual),
                    estatus: alumno?.estatus,
                }}
                seleccionado
                compact
            />
            {expedienteNormativo?.subsistema_clave === 'UPN' ? (
                <p className="text-xs text-slate-600 -mt-2">
                    UPN · {etiquetaModalidadUpn(uiNorm.modalidad_operacion_upn)} · {uiNorm.unidad_academica ?? mat?.institucion ?? '—'}
                </p>
            ) : null}
            <p className="text-sm text-slate-600">
                <strong>Estado académico:</strong> {alumno?.estatus ?? '—'}
                {' · '}
                <strong>Solicitudes documentales:</strong> {docs.length > 0 ? docs[0]?.workflow ?? 'En trámite' : 'Sin solicitud activa'}
            </p>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'resumen' ? <ExpedienteAvanceResumen alumnoPk={alumnoPk} data={data} /> : null}

            {tab === 'datos' ? <SectionCard title="Datos personales"><p className="text-sm">Nombre: {alumno?.nombre_completo} · CURP: {alumno?.curp}</p></SectionCard> : null}
            {tab === 'matricula' ? (
                <SectionCard title="Matrícula institucional">
                    <AlertBox
                        type="info"
                        message="La asignación oficial de matrícula corresponde a Educación Superior. Control Escolar prepara y envía la solicitud; no puede generar ni forzar la clave institucional."
                    />
                    <div className="mt-3 grid gap-2 text-sm">
                        <p>
                            <strong>Matrícula activa en expediente:</strong> {mat?.clave_matricula ?? 'Sin matrícula asignada'}{' '}
                            {mat?.estado ? <>· Estado: {mat.estado}</> : null}
                        </p>
                        {solicitudMat ? (
                            <div className="rounded border border-slate-200 p-3 bg-slate-50">
                                <p className="font-medium text-slate-900">Solicitud de matrícula</p>
                                <p className="text-xs mt-1">
                                    <strong>Estado:</strong> {etiquetaEstadoSolicitudMatricula(solicitudMat.estado)}
                                </p>
                                {solicitudMat.programa_etiqueta ? (
                                    <p className="text-xs">
                                        <strong>Programa:</strong> {solicitudMat.programa_etiqueta}
                                    </p>
                                ) : null}
                                {solicitudMat.plan_etiqueta ? (
                                    <p className="text-xs">
                                        <strong>Plan:</strong> {solicitudMat.plan_etiqueta}
                                    </p>
                                ) : null}
                                {solicitudMat.ciclo_ingreso_etiqueta ? (
                                    <p className="text-xs">
                                        <strong>Ciclo de ingreso:</strong> {solicitudMat.ciclo_ingreso_etiqueta}
                                    </p>
                                ) : null}
                                {solicitudMat.observaciones ? (
                                    <p className="text-xs text-amber-800 mt-2">
                                        <strong>Observaciones de Educación Superior:</strong> {solicitudMat.observaciones}
                                    </p>
                                ) : null}
                                {solicitudMat.motivo_rechazo ? (
                                    <p className="text-xs text-red-800 mt-2">
                                        <strong>Motivo de rechazo:</strong> {solicitudMat.motivo_rechazo}
                                    </p>
                                ) : null}
                                {solicitudMat.matricula_asignada_clave ? (
                                    <p className="text-xs text-green-800 mt-2">
                                        <strong>Matrícula asignada por autoridad:</strong> {solicitudMat.matricula_asignada_clave}
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-600">No hay solicitud de matrícula registrada para este alumno.</p>
                        )}
                    </div>

                    {expedienteNormativo?.subsistema_clave === 'NORMAL' && uiNorm.mostrar_ayuda_matricula_normal_2022 ? (
                        <p className="text-xs text-slate-600 mt-3">
                            Educación Normal (Planes 2022): la clave definitiva la emite Educación Superior conforme al esquema escolarizado del plantel.
                        </p>
                    ) : null}
                    {expedienteNormativo?.subsistema_clave === 'UPN' ? (
                        <p className="text-xs text-slate-600 mt-3">
                            UPN: matrícula única global en SICES; la captura oficial la valida y registra Educación Superior (sin formato Normal 2022).
                        </p>
                    ) : null}

                    {msgMat ? <p className="text-xs text-slate-700 mt-2">{msgMat}</p> : null}

                    {permiso('crear_solicitud_matricula') || permiso('enviar_solicitud_matricula') || permiso('atender_observacion_solicitud_matricula') ? (
                        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-800">Acciones Control Escolar</p>
                            {!mat?.clave_matricula &&
                            permiso('crear_solicitud_matricula') &&
                            (!solicitudMat || ['borrador', 'rechazada'].includes(solicitudMat.estado)) ? (
                                <div className="grid gap-2 max-w-lg">
                                    <label className="text-xs text-slate-600">Oferta académica</label>
                                    <select className="inst-input text-sm" value={ofertaSel} onChange={(e) => setOfertaSel(e.target.value)}>
                                        <option value="">Seleccione…</option>
                                        {ofertasOpts.map((o) => (
                                            <option key={o.id} value={String(o.id)}>
                                                {o.clave} · modalidad {o.modalidad ?? '—'}
                                            </option>
                                        ))}
                                    </select>
                                    <label className="text-xs text-slate-600">Ciclo de ingreso</label>
                                    <select className="inst-input text-sm" value={cicloSel} onChange={(e) => setCicloSel(e.target.value)}>
                                        <option value="">Seleccione…</option>
                                        {ciclosOpts.map((c) => (
                                            <option key={c.id} value={String(c.id)}>
                                                {c.nombre ?? c.clave}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="inst-btn inst-btn-secondary text-sm"
                                        disabled={busy || !ofertaSel || !cicloSel}
                                        onClick={async () => {
                                            setMsgMat('');
                                            setBusy(true);
                                            try {
                                                await solicitudesMatriculaApi.crearBorrador({
                                                    alumno_id: alumnoPk,
                                                    oferta_academica_id: Number(ofertaSel),
                                                    ciclo_ingreso_id: Number(cicloSel),
                                                });
                                                setMsgMat('Solicitud preparada (borrador).');
                                                await cargar();
                                            } catch (e) {
                                                setMsgMat(e?.message ?? 'No se pudo crear el borrador.');
                                            } finally {
                                                setBusy(false);
                                            }
                                        }}
                                    >
                                        Preparar solicitud
                                    </button>
                                </div>
                            ) : null}

                            {permiso('enviar_solicitud_matricula') && solicitudMat?.estado === 'borrador' ? (
                                <button
                                    type="button"
                                    className="inst-btn inst-btn-primary text-sm"
                                    disabled={busy}
                                    onClick={async () => {
                                        setMsgMat('');
                                        setBusy(true);
                                        try {
                                            await solicitudesMatriculaApi.enviar(solicitudMat.id);
                                            setMsgMat('Solicitud enviada a Educación Superior.');
                                            await cargar();
                                        } catch (e) {
                                            setMsgMat(e?.message ?? 'No se pudo enviar.');
                                        } finally {
                                            setBusy(false);
                                        }
                                    }}
                                >
                                    Enviar solicitud
                                </button>
                            ) : null}

                            {permiso('atender_observacion_solicitud_matricula') && solicitudMat?.estado === 'con_observaciones' ? (
                                <button
                                    type="button"
                                    className="inst-btn inst-btn-secondary text-sm"
                                    disabled={busy}
                                    onClick={async () => {
                                        setMsgMat('');
                                        setBusy(true);
                                        try {
                                            await solicitudesMatriculaApi.atenderObservaciones(solicitudMat.id);
                                            setMsgMat('Observaciones atendidas. Actualice datos y vuelva a enviar.');
                                            await cargar();
                                        } catch (e) {
                                            setMsgMat(e?.message ?? 'No se pudo atender.');
                                        } finally {
                                            setBusy(false);
                                        }
                                    }}
                                >
                                    Atender observaciones
                                </button>
                            ) : null}

                            {mat?.clave_matricula ? (
                                <p className="text-xs text-green-800">
                                    Matrícula visible en expediente: <strong>{mat.clave_matricula}</strong>
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {permiso('revisar_solicitud_matricula') ? (
                        <p className="text-xs text-slate-600 mt-3">
                            Para dictaminar solicitudes use la bandeja de Educación Superior:{' '}
                            <Link className="underline" to="/app/solicitudes-matricula">
                                Solicitudes de matrícula
                            </Link>
                            .
                        </p>
                    ) : null}
                </SectionCard>
            ) : null}
            {tab === 'inscripcion' ? (
                <SectionCard title="Inscripción">
                    {expedienteNormativo?.subsistema_clave === 'UPN' && uiNorm.reinscripcion_periodo_calendario_upn ? (
                        <div className="mb-3 grid gap-2">
                            {(uiNorm.avisos_upn ?? []).map((txt, idx) => (
                                <AlertBox key={`upn-ins-${idx}`} type="info" message={txt} />
                            ))}
                        </div>
                    ) : null}
                    {expedienteNormativo?.subsistema_clave === 'NORMAL' && uiNorm.mostrar_texto_inscripcion_anual_normal ? (
                        <p className="text-xs text-slate-600 mb-3">
                            Educación Normal: la inscripción escolarizada puede referirse al ciclo anual según calendario del plantel y normas de control escolar aplicables.
                        </p>
                    ) : null}
                    <DataTable
                        columns={[{ key: 'etiqueta', label: 'Periodo' }, { key: 'ciclo', label: 'Ciclo' }, { key: 'estatus', label: 'Estado' }]}
                        rows={data?.inscripciones_periodo ?? []}
                        emptyText="Sin inscripciones registradas."
                    />
                </SectionCard>
            ) : null}
            {tab === 'carga' ? <SectionCard title="Carga académica"><DataTable columns={[{ key: 'clave', label: 'Asignatura' }, { key: 'periodo_cursado', label: 'Periodo' }, { key: 'creditos_catalogo', label: 'Créditos' }, { key: 'calificacion', label: 'Calificación' }]} rows={data?.materias_cursadas ?? []} emptyText="Sin carga académica registrada." /></SectionCard> : null}
            {tab === 'calificaciones' ? (
                <SectionCard title="Calificaciones">
                    {expedienteNormativo?.subsistema_clave === 'UPN' ? (
                        <p className="text-xs text-slate-600 mb-3">
                            UPN: calificación en entero (6–10 aprobatoria; 5 no acreditada); N.P. = No presentó (no acreditada). Extraordinarios sujetos al límite por periodo y autorización del Consejo Técnico cuando exceda el tope base.
                        </p>
                    ) : null}
                    <Link to="/app/materias-cursadas" className="inst-btn inst-btn-primary text-sm">
                        Abrir captura de calificaciones
                    </Link>
                </SectionCard>
            ) : null}
            {tab === 'trayectoria' ? <SectionCard title="Trayectoria"><p className="text-sm">Promedio: {trayectoria?.promedio ?? '—'} · Créditos: {trayectoria?.creditos_obtenidos ?? '—'} / {trayectoria?.creditos_registrados ?? '—'}</p><Link to="/app/trayectorias" className="inst-btn inst-btn-secondary text-sm mt-2 inline-flex">Recalcular trayectoria</Link></SectionCard> : null}
            {tab === 'certificacion' ? (
                <SectionCard title="Solicitud documental" subtitle="Inicie una solicitud para revisión del Certificador. No genera documento final.">
                    <ul className="grid gap-2 text-sm" style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                        {checklist.map((item) => (
                            <li
                                key={item.label}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    background: item.ok ? '#f0fdf4' : '#fffbeb',
                                    color: item.ok ? '#166534' : '#92400e',
                                }}
                            >
                                {item.ok ? '✓' : '○'} {item.label}
                            </li>
                        ))}
                    </ul>
                    <Link
                        to={`/app/certificacion/solicitud?alumno=${alumnoPk}`}
                        className={`inst-btn text-sm inline-flex ${mat?.clave_matricula && trayectoria ? 'inst-btn-primary' : 'inst-btn-secondary'}`}
                    >
                        Iniciar solicitud documental
                    </Link>
                    {!mat?.clave_matricula || !trayectoria ? (
                        <p className="text-xs text-amber-700 mt-2">
                            Complete matrícula y trayectoria antes de enviar la solicitud al Certificador.
                        </p>
                    ) : null}
                </SectionCard>
            ) : null}
            {tab === 'observaciones' ? <SectionCard title="Observaciones"><p className="text-sm">Pendientes: {observacionesPend.length}</p><Link to={`/app/observaciones?alumno=${alumnoPk}`} className="inst-btn inst-btn-secondary text-sm mt-2 inline-flex">Abrir observaciones</Link></SectionCard> : null}
            {tab === 'historial' ? <SectionCard title="Historial"><ul className="grid gap-1 text-xs">{(data?.linea_tiempo_certificacion ?? []).map((ln, idx) => <li key={idx}>{ln.fecha?.slice?.(0, 10)} · {ln.tipo} · {ln.estado_principal}</li>)}</ul></SectionCard> : null}
            {tab === 'estado_sep' ? (
                <EstadoSepLegacyPanel
                    alumnoId={alumnoPk}
                    curp={alumno?.curp}
                />
            ) : null}
        </section>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { alumnosApi } from '../../api/alumnos';
import { controlEscolarApi } from '../../api/controlEscolar';
import { ErrorState } from '../../components/ErrorState';
import { PageHeader } from '../../components/PageHeader';
import { AlertBox } from '../../components/ui/AlertBox';
import { SectionCard } from '../../components/ui/SectionCard';
import { DataTable } from '../../components/ui/DataTable';

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
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
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

    const abrirExpediente = (alumnoId) => {
        setSearchParams({ alumno: String(alumnoId), tab: 'resumen' });
    };

    const legacy = data?.contexto_legacy_normativo;
    const expedienteNormativo = data?.expediente_normativo ?? {};
    const uiNorm = expedienteNormativo?.ui ?? {};
    const mensajesNormativos = expedienteNormativo?.mensajes_institucionales ?? [];
    const alumno = data?.alumno;
    const mat = data?.matricula;
    const trayectoria = data?.trayectoria;
    const docs = data?.documentos_certificacion ?? [];
    const observacionesPend = docs.filter((d) => d.requiere_revision_observaciones);
    const checklist = [
        { label: 'Alumno seleccionado', ok: Boolean(alumno?.curp) },
        { label: 'Matrícula activa', ok: Boolean(mat?.clave_matricula) },
        { label: 'Plan reconocido', ok: Boolean(mat?.plan_estudios) },
        { label: 'Materias registradas', ok: (data?.materias_cursadas ?? []).length > 0 },
        { label: 'Trayectoria consolidada', ok: Boolean(trayectoria) },
        { label: 'Sin bloqueos normativos', ok: !Boolean(legacy?.requiere_atencion) },
    ];

    if (!Number.isFinite(alumnoPk) || alumnoPk <= 0) {
        return (
            <section className="grid gap-4">
                <PageHeader title="Expedientes" subtitle="Centro operativo de Control Escolar." />
                <SectionCard title="Buscar expediente" subtitle="Busque por CURP, nombre o matrícula.">
                    <input className="inst-input text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. CURP, nombre completo o matrícula" />
                    {q.trim().length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">Busca un alumno por CURP, nombre o matrícula para abrir su expediente.</p>
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
                                { key: 'alumno', label: 'Alumno' },
                                { key: 'curp', label: 'CURP' },
                                { key: 'matricula_activa', label: 'Matrícula' },
                                { key: 'programa_plan', label: 'Programa/plan' },
                                { key: 'estado_academico', label: 'Estado' },
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
                title="Expediente del alumno"
                subtitle="Operación centralizada por pestañas, sin módulos sueltos."
                actions={<Link to="/app/expedientes" className="inst-btn inst-btn-secondary text-sm">Cambiar alumno</Link>}
            />
            {error ? <ErrorState message={error} /> : null}
            {busy ? <p className="text-sm text-slate-600">Cargando expediente...</p> : null}
            {mensajesNormativos.length > 0
                ? mensajesNormativos.map((msg, idx) => <AlertBox key={`norm-${idx}`} type="warning" message={msg} />)
                : null}
            {legacy?.requiere_atencion ? <AlertBox type="warning" message={legacy.mensaje_operativo ?? 'Hay bloqueo normativo pendiente.'} /> : null}

            <SectionCard title="Identificación del expediente">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p><strong>Nombre:</strong> {alumno?.nombre_completo ?? '—'}</p>
                    <p><strong>CURP:</strong> {alumno?.curp ?? '—'}</p>
                    <p><strong>Matrícula activa:</strong> {mat?.clave_matricula ?? 'Sin matrícula'}</p>
                    <p><strong>Subsistema:</strong> {mat?.subsistema ?? '—'}</p>
                    <p><strong>Institución:</strong> {mat?.institucion ?? '—'}</p>
                    <p><strong>Programa / Plan:</strong> {`${mat?.programa ?? '—'} / ${mat?.plan_estudios ?? '—'}`}</p>
                    {expedienteNormativo?.subsistema_clave === 'UPN' ? (
                        <>
                            <p><strong>Modalidad operativa:</strong> {etiquetaModalidadUpn(uiNorm.modalidad_operacion_upn)}</p>
                            <p><strong>Programa educativo UPN:</strong> {uiNorm.programa_educativo ?? mat?.programa ?? '—'}</p>
                            <p><strong>Unidad UPN:</strong> {uiNorm.unidad_academica ?? mat?.institucion ?? '—'}</p>
                            <p><strong>Sede / CCT:</strong> {uiNorm.sede_cct ?? mat?.sede ?? '—'}</p>
                        </>
                    ) : null}
                    <p><strong>Estado académico:</strong> {alumno?.estatus ?? '—'}</p>
                    <p><strong>Estado certificación:</strong> {docs[0]?.workflow ?? 'Sin solicitud'}</p>
                </div>
            </SectionCard>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'resumen' ? (
                <div className="grid gap-3 md:grid-cols-3">
                    {[
                        { titulo: 'Matrícula', estado: mat?.clave_matricula ? 'Listo' : 'Pendiente', accion: 'Ir a Matrícula', to: '/app/expedientes?tab=matricula' },
                        { titulo: 'Inscripción', estado: (data?.inscripciones_periodo ?? []).length > 0 ? 'Listo' : 'Pendiente', accion: 'Ir a Inscripción', to: '/app/expedientes?tab=inscripcion' },
                        { titulo: 'Carga académica', estado: (data?.materias_cursadas ?? []).length > 0 ? 'Listo' : 'Pendiente', accion: 'Ir a Carga', to: '/app/expedientes?tab=carga' },
                        { titulo: 'Calificaciones', estado: (data?.materias_cursadas ?? []).length > 0 ? 'En captura' : 'Pendiente', accion: 'Capturar', to: '/app/expedientes?tab=calificaciones' },
                        { titulo: 'Trayectoria', estado: trayectoria ? 'Listo' : 'Bloqueado', accion: 'Recalcular', to: '/app/expedientes?tab=trayectoria' },
                        { titulo: 'Certificación', estado: checklist.every((x) => x.ok) ? 'Listo' : 'Bloqueado', accion: 'Solicitar', to: '/app/expedientes?tab=certificacion' },
                        { titulo: 'Observaciones', estado: observacionesPend.length > 0 ? 'Pendiente' : 'Sin pendientes', accion: 'Atender', to: '/app/expedientes?tab=observaciones' },
                    ].map((card) => (
                        <article key={card.titulo} className="action-card">
                            <p className="text-sm font-semibold text-slate-900">{card.titulo}</p>
                            <p className="text-xs text-slate-600 mt-1">Estado: {card.estado}</p>
                            <Link to={card.to} className="inst-btn inst-btn-secondary text-xs mt-2 inline-flex">{card.accion}</Link>
                        </article>
                    ))}
                </div>
            ) : null}

            {tab === 'datos' ? <SectionCard title="Datos personales"><p className="text-sm">Nombre: {alumno?.nombre_completo} · CURP: {alumno?.curp}</p></SectionCard> : null}
            {tab === 'matricula' ? (
                <SectionCard title="Matrícula">
                    <p className="text-sm">
                        Matrícula activa: {mat?.clave_matricula ?? 'Sin matrícula'} · Estado: {mat?.estado ?? 'Pendiente'}
                    </p>
                    {expedienteNormativo?.subsistema_clave === 'NORMAL' && uiNorm.mostrar_ayuda_matricula_normal_2022 ? (
                        <p className="text-xs text-slate-600 mt-2">
                            Educación Normal (Planes 2022): use la ayuda institucional de matrícula escolarizada según el plantel (año, entidad, consecutivo, traslado cuando aplique).
                        </p>
                    ) : null}
                    {expedienteNormativo?.subsistema_clave === 'UPN' ? (
                        <p className="text-xs text-slate-600 mt-2">
                            UPN: matrícula única global en SICES; captura validada o generador solo si el plantel activó regla explícita. No aplica el formato de matrícula Educación Normal 2022.
                        </p>
                    ) : null}
                    <Link className="inst-btn inst-btn-secondary text-sm mt-2 inline-flex" to="/app/matriculas">
                        Gestionar matrícula
                    </Link>
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
                <SectionCard title="Certificación">
                    <ul className="grid gap-1 text-sm">
                        {checklist.map((item) => <li key={item.label}>{item.ok ? '✓' : '✕'} {item.label}</li>)}
                    </ul>
                    <Link to={`/app/certificacion/solicitud?alumno=${alumnoPk}`} className={`inst-btn text-sm mt-2 inline-flex ${checklist.every((x) => x.ok) ? 'inst-btn-success' : 'inst-btn-secondary blocked-action'}`}>
                        Crear borrador
                    </Link>
                    {!checklist.every((x) => x.ok) ? <p className="text-xs text-amber-700 mt-2">Acción bloqueada: complete los pendientes del expediente.</p> : null}
                </SectionCard>
            ) : null}
            {tab === 'observaciones' ? <SectionCard title="Observaciones"><p className="text-sm">Pendientes: {observacionesPend.length}</p><Link to={`/app/observaciones?alumno=${alumnoPk}`} className="inst-btn inst-btn-secondary text-sm mt-2 inline-flex">Abrir observaciones</Link></SectionCard> : null}
            {tab === 'historial' ? <SectionCard title="Historial"><ul className="grid gap-1 text-xs">{(data?.linea_tiempo_certificacion ?? []).map((ln, idx) => <li key={idx}>{ln.fecha?.slice?.(0, 10)} · {ln.tipo} · {ln.estado_principal}</li>)}</ul></SectionCard> : null}
        </section>
    );
}

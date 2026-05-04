import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getUser } from '../../authStore';
import { documentosAcademicosApi } from '../../api/documentosAcademicos';
import { observacionesApi } from '../../api/observaciones';
import { ActionButton } from '../../components/ActionButton';
import { ErrorState } from '../../components/ErrorState';
import { EstadoBadge } from '../../components/EstadoBadge';
import { LoadingState } from '../../components/LoadingState';
import { ObservacionesPanel } from '../../components/ObservacionesPanel';
import { PageHeader } from '../../components/PageHeader';
import { ValidacionResumenCard } from '../../components/ValidacionResumenCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { Timeline } from '../../components/ui/Timeline';
import { AlertBox } from '../../components/ui/AlertBox';
export function DocumentoShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const role = getUser()?.roles?.[0] ?? 'admin';
    const [doc, setDoc] = useState(null);
    const [obs, setObs] = useState([]);
    const [val, setVal] = useState(null);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function refresh() {
        const [d, o] = await Promise.all([
            documentosAcademicosApi.show(id),
            observacionesApi.listar(id),
        ]);
        setDoc(d.data);
        setObs(o.data);
        setVal(d?.data?.validacion_resumen ?? null);
    }

    useEffect(() => {
        refresh().catch(() => setDoc(false));
    }, [id]);

    if (doc === null) return <LoadingState text="Cargando documento..." />;
    if (doc === false) return <ErrorState message="No se pudo cargar el documento." />;

    async function runAction(action) {
        setError('');
        setMsg('');
        try {
            if (action === 'enviar') await documentosAcademicosApi.enviarRevision(id, { motivo: 'Enviado desde frontend.' });
            if (action === 'aprobar') await documentosAcademicosApi.aprobar(id, { motivo: 'Aprobacion desde frontend.' });
            if (action === 'rechazar') await documentosAcademicosApi.rechazar(id, { motivo: 'Rechazo desde frontend.' });
            if (action === 'preparar') await documentosAcademicosApi.marcarListoParaFirma(id, { motivo: 'Preparar firma.' });
            if (action === 'validar') {
                const res = await documentosAcademicosApi.validar(id);
                setVal(res?.data?.resumen ?? null);
            }
            await refresh();
            setMsg('Operacion ejecutada correctamente.');
        } catch (err) {
            setError(err?.message ?? 'No se pudo ejecutar la acción. Intenta nuevamente.');
        }
    }

    const canControl = ['control_escolar_escuela', 'director_escuela'].includes(role);
    const canRevision = role === 'educacion_superior';
    const canSistemas = role === 'sistemas';

    const timelineSteps = [
        { key: 'borrador', label: 'Borrador', done: ['borrador', 'en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'en_revision', label: 'En revision', done: ['en_revision', 'aprobado', 'rechazado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'rechazado', label: 'Devuelto', done: doc.estado_workflow === 'rechazado' },
        { key: 'aprobado', label: 'Aprobado', done: ['aprobado', 'listo_para_firma'].includes(doc.estado_workflow) },
        { key: 'listo_para_firma', label: 'Listo para firma', done: doc.listo_para_firma },
        { key: 'firmado', label: 'Firmado (futuro)', done: doc.estado_firma === 'firmado' },
    ];

    return (
        <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <PageHeader
                title={`Documento #${doc.id}`}
                subtitle="Detalle documental operativo por rol."
                actions={(
                    <div className="flex flex-wrap gap-2">
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/captura`)}>Captura</ActionButton>
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/observaciones`)}>Observaciones</ActionButton>
                        <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/validacion`)}>Validacion</ActionButton>
                    </div>
                )}
            />
            {error ? <ErrorState message={error} /> : null}
            {msg ? <AlertBox type="success" message={msg} /> : null}
            <div className="grid gap-4">
            <SectionCard title="Encabezado documental" subtitle="Estado actual del flujo de certificación y datos principales.">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Folio: {doc.folio_interno ?? `Doc #${doc.id}`}</h2>
                    <EstadoBadge estado={doc.estado_workflow} />
                </div>
                <p className="mt-2 text-sm text-slate-600">Alumno: {doc.alumno?.nombre ?? 'N/A'} | CURP: {doc.alumno?.curp ?? '-'}</p>
                <p className="mt-1 text-sm text-slate-600">Matricula ID: {doc.matricula_id ?? '-'} | Institucion/Sede: {doc.institucion_id ?? '-'} / {doc.sede_id ?? '-'}</p>
                <p className="mt-1 text-sm text-slate-600">Tipo documento: {doc.tipo_documento ?? '-'} | Estado firma: {doc.estado_firma ?? '-'}</p>
            </SectionCard>
            <SectionCard title="Timeline del proceso de certificación">
                <Timeline steps={timelineSteps} current={doc.estado_workflow} />
            </SectionCard>
            <ValidacionResumenCard resumen={val} />
            <ObservacionesPanel items={obs} />
            <SectionCard title="Secciones de documento">
                <p>Materias, trayectoria y detalles extendidos dependen de endpoints de consulta detallada backend.</p>
                <p className="mt-1">No se implementa firma real SEP/since-service en esta fase.</p>
                <Link to="/app/documentos/bandejas" className="mt-2 inline-block text-blue-700 hover:underline">Volver a bandejas</Link>
            </SectionCard>
            </div>
            <aside className="inst-surface grid h-max gap-3 p-4">
                <h3 className="inst-title text-sm">Acciones por rol</h3>
                <ActionButton variant="secondary" onClick={() => runAction('validar')}>Ver validación</ActionButton>
                {canControl ? <ActionButton onClick={() => runAction('enviar')}>Enviar a revision</ActionButton> : null}
                {canControl ? <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/captura`)}>Editar borrador</ActionButton> : null}
                {canControl ? <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/observaciones`)}>Atender observaciones</ActionButton> : null}
                {canRevision ? <ActionButton variant="secondary" onClick={() => navigate(`/app/documentos/${id}/observaciones`)}>Agregar observacion</ActionButton> : null}
                {canRevision ? <ActionButton variant="danger" onClick={() => runAction('rechazar')}>Devolver/Rechazar</ActionButton> : null}
                {canRevision ? <ActionButton onClick={() => runAction('aprobar')}>Aprobar</ActionButton> : null}
                {canRevision ? <ActionButton variant="warning" onClick={() => runAction('preparar')}>Preparar para firma</ActionButton> : null}
                {canSistemas ? <p className="inst-muted text-xs">Sistemas solo visualiza datos tecnicos y estado listo para firma. No se muestra accion de firmar.</p> : null}
            </aside>
        </section>
    );
}

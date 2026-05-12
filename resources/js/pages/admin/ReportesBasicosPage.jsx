import { getUser } from '../../authStore';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardInstitutionalNotice } from '../../components/dashboard/DashboardInstitutionalNotice';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import { DashboardModuleGrid } from '../../components/dashboard/DashboardModuleGrid';
import { DashboardQuickActions } from '../../components/dashboard/DashboardQuickActions';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardStatusOverview } from '../../components/dashboard/DashboardStatusOverview';

const MODULOS_CE = [
    { name: 'Matrícula por programa', description: 'Concentrado por licenciatura en educación (Normal / UPN).', status: 'Enlace operativo' },
    { name: 'Matrícula por subsistema', description: 'Comparativo Educación Normal vs UPN.', status: 'Enlace operativo' },
    { name: 'Inscripciones por ciclo', description: 'Seguimiento por ciclo escolar activo.', status: 'Enlace operativo' },
    { name: 'Reinscripciones pendientes', description: 'Bloqueos académicos sin colegiaturas.', status: 'Enlace operativo' },
    { name: 'Expedientes incompletos', description: 'Falta de matrícula, inscripción o carga.', status: 'Enlace operativo' },
    { name: 'Calificaciones pendientes', description: 'Captura curricular pendiente.', status: 'Enlace operativo' },
    { name: 'Trayectorias listas', description: 'Candidatos a trámite documental.', status: 'Enlace operativo' },
    { name: 'Documentos con observaciones', description: 'Seguimiento documental operativo.', status: 'Enlace operativo' },
    { name: 'Solicitudes de matrícula', description: 'Bandeja enviada a Educación Superior.', status: 'Enlace operativo' },
    { name: 'Importaciones con error', description: 'Conciliación e historial académico.', status: 'Enlace operativo' },
];

const MODULOS_DIRECCION = [
    { name: 'Matrícula por programa', description: 'Concentrado por licenciatura en educación (Normal / UPN).', status: 'Supervisión' },
    { name: 'Inscripciones', description: 'Seguimiento de periodos y excepciones autorizadas por dirección.', status: 'Supervisión' },
    { name: 'Reinscripciones', description: 'Bloqueos académicos sin adeudos de colegiatura.', status: 'Supervisión' },
    { name: 'Expedientes incompletos', description: 'Falta de inscripción, carga o documentación.', status: 'Supervisión' },
    { name: 'Calificaciones pendientes', description: 'Avance de captura (sin operación de captura por dirección).', status: 'Supervisión' },
    { name: 'Candidatos a egreso', description: 'Seguimiento institucional de titulación y egreso.', status: 'Supervisión' },
    { name: 'Incidencias', description: 'Observaciones y revisiones abiertas.', status: 'Supervisión' },
    { name: 'Documentos con observaciones', description: 'Pendientes de revisión o autorización institucional.', status: 'Supervisión' },
    { name: 'Eficiencia terminal y promedio institucional', description: 'Indicadores de desempeño (consulta).', status: 'En preparación' },
];

export function ReportesBasicosPage() {
    const roles = getUser()?.roles ?? [];
    const esEducacionSuperior = roles.includes('educacion_superior');
    const esControlEscolar = roles.includes('control_escolar_escuela');
    const esDirector = roles.includes('director_escuela');

    if (esEducacionSuperior) {
        return (
            <DashboardShell>
                <DashboardHeader
                    title="Reportes oficiales"
                    subtitle="Concentrados para Educación Normal y UPN (911–919). Sin becas ni infraestructura educativa mientras no existan módulos formales vinculados."
                />
                <DashboardInstitutionalNotice type="info" message="Las exportaciones agregadas se conectarán al motor institucional; use las bandejas y el tablero de Educación Superior para prioridades operativas." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DashboardMetricCard title="Reportes generados" value="—" subtitle="Seguimiento oficial" />
                    <DashboardMetricCard title="Matrícula oficial" value="—" subtitle="912 / oferta" />
                    <DashboardMetricCard title="Egresados" value="—" subtitle="913" />
                    <DashboardMetricCard title="Certificados emitidos" value="—" subtitle="914 / 918" />
                </div>
                <DashboardQuickActions
                    title="Ir a operación"
                    actions={[
                        { label: 'Solicitudes de matrícula', to: '/app/solicitudes-matricula' },
                        { label: 'Validaciones normativas', to: '/app/educacion-superior/validaciones-normativas' },
                        { label: 'Instituciones', to: '/app/educacion-superior/instituciones' },
                        { label: 'Tablero ES', to: '/app/dashboard' },
                    ]}
                />
                <DashboardStatusOverview
                    title="Alcance"
                    items={[
                        { label: '911 Inicio de cursos', value: 'Referencia' },
                        { label: '916 Validaciones normativas', value: 'Bandeja / expediente' },
                        { label: '919 Instituciones y sedes', value: 'Catálogos operativos' },
                    ]}
                />
                <DashboardModuleGrid
                    title="Reportes oficiales previstos"
                    modules={[
                        { name: '911. Estadística de inicio de cursos', description: 'Arranque escolar por subsistema.', status: 'En preparación' },
                        { name: '912. Matrícula por programa educativo', description: 'Concentrado por licenciatura en educación.', status: 'En preparación' },
                        { name: '913. Egresados por generación', description: 'Cohortes y titulación.', status: 'En preparación' },
                        { name: '914. Titulación y certificación', description: 'Emisión y estatus documental.', status: 'En preparación' },
                        { name: '915. Indicadores académicos', description: 'Desempeño y eficiencia.', status: 'En preparación' },
                        { name: '916. Validaciones normativas', description: 'Dictámenes y expedientes.', status: 'Enlace operativo' },
                        { name: '917. Solicitudes de matrícula', description: 'Bandeja y resolución.', status: 'Enlace operativo' },
                        { name: '918. Documentos emitidos', description: 'Seguimiento de emisión.', status: 'En preparación' },
                        { name: '919. Instituciones y sedes activas', description: 'Estructura territorial.', status: 'Enlace operativo' },
                    ]}
                />
            </DashboardShell>
        );
    }

    if (esDirector) {
        return (
            <DashboardShell>
                <DashboardHeader
                    title="Reportes para Dirección"
                    subtitle="Información de supervisión para Educación Normal y UPN. Sin reportes financieros: no hay módulo de colegiaturas vinculado."
                />
                <DashboardInstitutionalNotice type="info" message="Las exportaciones agregadas se conectarán al motor de reportes; use expedientes y el tablero de dirección para prioridades." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DashboardMetricCard title="Matrícula por programa" value="—" subtitle="Desde tablero de dirección" />
                    <DashboardMetricCard title="Inscripciones / reinscripciones" value="—" subtitle="Seguimiento institucional" />
                    <DashboardMetricCard title="Calificaciones" value="—" subtitle="Avance de captura" />
                    <DashboardMetricCard title="Egreso" value="—" subtitle="Candidatos y documentos" />
                </div>
                <DashboardQuickActions
                    title="Ir a supervisión"
                    actions={[
                        { label: 'Indicadores', to: '/app/direccion/indicadores' },
                        { label: 'Autorizaciones', to: '/app/direccion/autorizaciones-observaciones' },
                        { label: 'Expedientes', to: '/app/expedientes' },
                        { label: 'Dashboard dirección', to: '/app/dashboard' },
                    ]}
                />
                <DashboardStatusOverview
                    title="Estado"
                    items={[
                        { label: 'Pagos / colegiaturas', value: 'No aplica' },
                        { label: 'Alcance', value: 'Institución y sede asignadas' },
                        { label: 'Validación normativa ES', value: 'Fuera de este rol' },
                    ]}
                />
                <DashboardModuleGrid title="Reportes previstos (Dirección)" modules={MODULOS_DIRECCION} />
            </DashboardShell>
        );
    }

    if (esControlEscolar) {
        return (
            <DashboardShell>
                <DashboardHeader
                    title="Reportes operativos"
                    subtitle="Indicadores para Educación Normal y UPN. Sin reportes financieros: no hay módulo de colegiaturas vinculado."
                />
                <DashboardInstitutionalNotice type="info" message="Seleccione un módulo para profundizar en el tablero o expediente 360." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DashboardMetricCard title="Solicitudes de matrícula" value="—" subtitle="Bandeja y estados" />
                    <DashboardMetricCard title="Inscripciones" value="—" subtitle="Por ciclo escolar" />
                    <DashboardMetricCard title="Calificaciones" value="—" subtitle="Pendientes de captura" />
                    <DashboardMetricCard title="Importaciones" value="—" subtitle="Errores y conciliación" />
                </div>
                <DashboardQuickActions
                    title="Ir a operación"
                    actions={[
                        { label: 'Expedientes', to: '/app/expedientes' },
                        { label: 'Solicitudes de matrícula', to: '/app/solicitudes-matricula' },
                        { label: 'Importaciones', to: '/app/importaciones' },
                        { label: 'Observaciones', to: '/app/observaciones' },
                    ]}
                />
                <DashboardStatusOverview
                    title="Estado de reportes"
                    items={[
                        { label: 'Conexión agregada', value: 'En preparación' },
                        { label: 'Exportación', value: 'Desde expediente / bandejas' },
                        { label: 'Pagos / colegiaturas', value: 'No aplica' },
                    ]}
                />
                <DashboardModuleGrid title="Reportes previstos (Normal / UPN)" modules={MODULOS_CE} />
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <DashboardHeader title="Reportes institucionales" subtitle="Indicadores operativos y exportables para seguimiento del proceso de certificacion." />
            <DashboardInstitutionalNotice type="info" message="Estado: pendiente de conexion con servicios de consulta agregada." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard title="Reportes por ciclo" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes por institucion" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes por estado documental" value={0} subtitle="Pendiente backend" />
                <DashboardMetricCard title="Reportes de observaciones" value={0} subtitle="Pendiente backend" />
            </div>
            <DashboardQuickActions
                title="Navegacion administrativa"
                actions={[
                    { label: 'Dashboard admin', to: '/app/admin/dashboard' },
                    { label: 'Catalogos', to: '/app/admin/catalogos' },
                    { label: 'Usuarios y roles', to: '/app/admin/usuarios-roles' },
                    { label: 'Parametros', to: '/app/admin/parametros' },
                ]}
            />
            <DashboardStatusOverview
                title="Seguimiento de reportes"
                items={[
                    { label: 'Diseno de reportes', value: 'Preparacion' },
                    { label: 'Datos agregados', value: 'Pendiente backend' },
                    { label: 'Exportacion administrativa', value: 'Pendiente backend' },
                ]}
            />
            <DashboardModuleGrid
                title="Funciones previstas"
                modules={[
                    { name: 'Reporte por ciclo escolar', description: 'Concentrado por periodo academico.', status: 'Pendiente backend' },
                    { name: 'Reporte por institucion', description: 'Comparativo institucional.', status: 'Pendiente backend' },
                    { name: 'Reporte por estado documental', description: 'Seguimiento del workflow.', status: 'Pendiente backend' },
                    { name: 'Reporte de observaciones', description: 'Analitica de devoluciones y atencion.', status: 'Pendiente backend' },
                    { name: 'Exportacion administrativa', description: 'Salida de informacion consolidada.', status: 'Pendiente backend' },
                ]}
            />
        </DashboardShell>
    );
}

import { RequirePermission } from './components/auth/RequirePermission';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { getToken } from './authStore';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BandejasPage } from './pages/documentos/BandejasPage';
import { DocumentoShowPage } from './pages/documentos/DocumentoShowPage';
import { DocumentoWizardPage } from './pages/documentos/DocumentoWizardPage';
import { SolicitudCertificacionPage } from './pages/documentos/SolicitudCertificacionPage';
import { MateriasCursadasPage } from './pages/materias/MateriasCursadasPage';
import { DocumentoValidacionPage } from './pages/documentos/DocumentoValidacionPage';
import { DocumentoObservacionesPage } from './pages/documentos/DocumentoObservacionesPage';
import { AlumnoFormPage } from './pages/alumnos/AlumnoFormPage';
import { AlumnoDetallePage } from './pages/alumnos/AlumnoDetallePage';
import { AlumnoCapturaWizard } from './pages/alumnos/AlumnoCapturaWizard';
import { TrayectoriaPage } from './pages/trayectorias/TrayectoriaPage';
import { ImportacionesAcademicasPage } from './pages/importaciones/ImportacionesAcademicasPage';
import { LegacyNormativaRevisionPage } from './pages/importaciones/LegacyNormativaRevisionPage';
import { ListosParaFirmaPage } from './pages/sistemas/ListosParaFirmaPage';
import { DashboardTecnicoPage } from './pages/sistemas/DashboardTecnicoPage';
import { LogsTecnicosPage } from './pages/sistemas/LogsTecnicosPage';
import { ConfiguracionTecnicaPage } from './pages/sistemas/ConfiguracionTecnicaPage';
import { MenusPorRolPage } from './pages/admin/MenusPorRolPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SuperAdminDashboardPage } from './pages/superadmin/SuperAdminDashboardPage';
import { UsuariosRolesPage } from './pages/admin/UsuariosRolesPage';
import { CatalogosPage } from './pages/admin/CatalogosPage';
import { ParametrosSistemaPage } from './pages/admin/ParametrosSistemaPage';
import { ReportesBasicosPage } from './pages/admin/ReportesBasicosPage';
import { AuditorDashboardPage } from './pages/auditoria/AuditorDashboardPage';
import { ConsultaDashboardPage } from './pages/consulta/ConsultaDashboardPage';
import { ConsultaDocumentosPage } from './pages/consulta/ConsultaDocumentosPage';
import { AuditoriaPage } from './pages/auditoria/AuditoriaPage';
import { DocenteDashboardPage } from './pages/dashboard/DocenteDashboardPage';
import { CoordinadorAcademicoDashboardPage } from './pages/dashboard/CoordinadorAcademicoDashboardPage';
import { SolicitudesMatriculaBandejaPage } from './pages/certificacion/SolicitudesMatriculaBandejaPage';
import { AparienciaSistemaPage } from './pages/sistema/AparienciaSistemaPage';
import { AlumnosCePage } from './pages/controlEscolar/AlumnosCePage';
import { BajasCambiosPage } from './pages/controlEscolar/BajasCambiosPage';
import { CalificacionesCePage } from './pages/controlEscolar/CalificacionesCePage';
import { DocumentosCePage } from './pages/controlEscolar/DocumentosCePage';
import { ExpedientesCePage } from './pages/controlEscolar/ExpedientesCePage';
import { ImportacionesCePage } from './pages/controlEscolar/ImportacionesCePage';
import { InscripcionesCePage } from './pages/controlEscolar/InscripcionesCePage';
import { NotificacionesCePage } from './pages/controlEscolar/NotificacionesCePage';
import { ObservacionesCePage } from './pages/controlEscolar/ObservacionesCePage';
import { ReinscripcionesCePage } from './pages/controlEscolar/ReinscripcionesCePage';
import { ReportesCePage } from './pages/controlEscolar/ReportesCePage';
import { SolicitudesCePage } from './pages/controlEscolar/SolicitudesCePage';
import { TrayectoriaCePage } from './pages/controlEscolar/TrayectoriaCePage';
import { DireccionIndicadoresPage } from './pages/direccion/DireccionIndicadoresPage';
import { DireccionAlumnosPage } from './pages/direccion/DireccionAlumnosPage';
import { DireccionInscripcionesPage } from './pages/direccion/DireccionInscripcionesPage';
import { DireccionReinscripcionesPage } from './pages/direccion/DireccionReinscripcionesPage';
import { DireccionCalificacionesSupervisionPage } from './pages/direccion/DireccionCalificacionesSupervisionPage';
import { DireccionEgresoTitulacionPage } from './pages/direccion/DireccionEgresoTitulacionPage';
import { DireccionDocumentosPage } from './pages/direccion/DireccionDocumentosPage';
import { DireccionAutorizacionesPage } from './pages/direccion/DireccionAutorizacionesPage';
import { DireccionReportesPage } from './pages/direccion/DireccionReportesPage';
import { DireccionNotificacionesPage } from './pages/direccion/DireccionNotificacionesPage';
import { EsInstitucionesPage } from './pages/educacionSuperior/EsInstitucionesPage';
import { EsSedesPage } from './pages/educacionSuperior/EsSedesPage';
import { EsProgramasPage } from './pages/educacionSuperior/EsProgramasPage';
import { EsPlanesPage } from './pages/educacionSuperior/EsPlanesPage';
import { EsValidacionesNormativasPage } from './pages/educacionSuperior/EsValidacionesNormativasPage';
import { EsCertificacionPage } from './pages/educacionSuperior/EsCertificacionPage';
import { EsReportesOficialesPage } from './pages/educacionSuperior/EsReportesOficialesPage';
import { BandejaRevisionInstitucionalPage } from './pages/documentos/BandejaRevisionInstitucionalPage';
import { RevisionInstitucionalPage } from './pages/documentos/RevisionInstitucionalPage';

function PrivateOutlet() {
    return getToken() ? <AppLayout /> : <Navigate to="/login" replace />;
}

function GuestOutlet() {
    return getToken() ? <Navigate to="/app/dashboard" replace /> : <AuthLayout />;
}

function Guard({ anyOf, children }) {
    return <RequirePermission anyOf={anyOf}>{children}</RequirePermission>;
}

const PERM = {
    docView: ['ver_documentos', 'documentos.ver'],
    docCreate: ['crear_documentos', 'documentos.crear', 'documentos.crear_borrador'],
    expediente: ['ver_alumnos', 'alumnos.ver', 'expedientes.ver'],
    ce: ['dashboard.ver', 'alumnos.ver', 'expedientes.ver'],
    direccion: ['dashboard.ver', 'indicadores.ver', 'alumnos.ver', 'expedientes.ver'],
    educacionSuperior: ['dashboard.ver', 'instituciones.ver', 'solicitudes_matricula.ver', 'certificacion.ver'],
    revisionInstitucional: [
        'ver_documentos',
        'documentos.ver',
        'certificacion.ver',
        'validaciones_normativas.ver',
    ],
    sistemas: ['dashboard.ver', 'logs.ver', 'integraciones.ver', 'firma.ver'],
    auditoria: ['auditoria.ver', 'dashboard.ver'],
    consulta: ['documentos.ver', 'dashboard.ver'],
};

export const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/app/dashboard" replace /> },
    {
        path: '/login',
        element: <GuestOutlet />,
        children: [{ index: true, element: <LoginPage /> }],
    },
    {
        path: '/app',
        children: [
            {
                element: <PrivateOutlet />,
                children: [
                    { path: 'dashboard', element: <DashboardPage /> },
                    { path: 'expedientes', element: <Guard anyOf={PERM.expediente}><AlumnoDetallePage /></Guard> },
                    { path: 'documentos/bandejas', element: <Guard anyOf={PERM.docView}><BandejasPage /></Guard> },
                    { path: 'documentos/bandejas/:bandeja', element: <Guard anyOf={PERM.docView}><BandejasPage /></Guard> },
                    { path: 'documentos', element: <Navigate to="/app/documentos/bandejas/por-rol" replace /> },
                    { path: 'documentos/nuevo', element: <Guard anyOf={PERM.docCreate}><DocumentoWizardPage /></Guard> },
                    { path: 'documentos/:id/captura', element: <Guard anyOf={PERM.docCreate}><DocumentoWizardPage /></Guard> },
                    { path: 'documentos/:id/validacion', element: <Guard anyOf={PERM.docView}><DocumentoValidacionPage /></Guard> },
                    { path: 'documentos/:id/observaciones', element: <Guard anyOf={PERM.docView}><DocumentoObservacionesPage /></Guard> },
                    { path: 'documentos/validacion', element: <Guard anyOf={PERM.docView}><DocumentoValidacionPage /></Guard> },
                    { path: 'documentos/observaciones', element: <Guard anyOf={PERM.docView}><DocumentoObservacionesPage /></Guard> },
                    { path: 'observaciones', element: <Guard anyOf={PERM.docView}><DocumentoObservacionesPage /></Guard> },
                    { path: 'documentos/:id', element: <Guard anyOf={PERM.docView}><DocumentoShowPage /></Guard> },
                    { path: 'alumnos', element: <Navigate to="/app/expedientes" replace /> },
                    { path: 'alumnos/crear', element: <AlumnoFormPage /> },
                    { path: 'alumnos/nuevo', element: <Navigate to="/app/alumnos/crear" replace /> },
                    { path: 'alumnos/captura-guiado', element: <AlumnoCapturaWizard /> },
                    { path: 'alumnos/:id/expediente', element: <AlumnoDetallePage /> },
                    { path: 'alumnos/:id/captura-guiado', element: <AlumnoCapturaWizard /> },
                    { path: 'alumnos/:id/trayectoria', element: <TrayectoriaPage /> },
                    {
                        path: 'certificacion/solicitud',
                        element: (
                            <Guard anyOf={['crear_documentos', 'documentos.crear', 'documentos.crear_borrador', 'certificacion.preparar', 'control_escolar.importar']}>
                                <SolicitudCertificacionPage />
                            </Guard>
                        ),
                    },
                    {
                        path: 'certificacion/revision',
                        element: (
                            <Guard anyOf={PERM.revisionInstitucional}>
                                <BandejaRevisionInstitucionalPage />
                            </Guard>
                        ),
                    },
                    {
                        path: 'certificacion/revision/:id',
                        element: (
                            <Guard anyOf={PERM.revisionInstitucional}>
                                <RevisionInstitucionalPage />
                            </Guard>
                        ),
                    },
                    { path: 'matriculas', element: <Navigate to="/app/expedientes?tab=matricula" replace /> },
                    {
                        path: 'materias-cursadas',
                        element: (
                            <Guard anyOf={['gestionar_materias', 'calificaciones.capturar', 'materias.editar', 'documentos.crear_borrador', 'crear_documentos']}>
                                <MateriasCursadasPage />
                            </Guard>
                        ),
                    },
                    { path: 'materias', element: <Navigate to="/app/materias-cursadas" replace /> },
                    { path: 'trayectorias', element: <Navigate to="/app/expedientes?tab=trayectoria" replace /> },
                    { path: 'control-escolar/alumnos', element: <Guard anyOf={PERM.ce}><AlumnosCePage /></Guard> },
                    { path: 'control-escolar/expedientes', element: <Guard anyOf={PERM.ce}><ExpedientesCePage /></Guard> },
                    { path: 'control-escolar/inscripciones', element: <Guard anyOf={PERM.ce}><InscripcionesCePage /></Guard> },
                    { path: 'control-escolar/reinscripciones', element: <Guard anyOf={PERM.ce}><ReinscripcionesCePage /></Guard> },
                    { path: 'control-escolar/trayectoria', element: <Guard anyOf={PERM.ce}><TrayectoriaCePage /></Guard> },
                    { path: 'control-escolar/calificaciones', element: <Guard anyOf={PERM.ce}><CalificacionesCePage /></Guard> },
                    { path: 'control-escolar/documentos', element: <Guard anyOf={PERM.docView}><DocumentosCePage /></Guard> },
                    { path: 'control-escolar/bajas-cambios', element: <Guard anyOf={PERM.ce}><BajasCambiosPage /></Guard> },
                    { path: 'control-escolar/solicitudes', element: <Guard anyOf={PERM.ce}><SolicitudesCePage /></Guard> },
                    { path: 'control-escolar/importaciones', element: <Guard anyOf={PERM.ce}><ImportacionesCePage /></Guard> },
                    { path: 'control-escolar/observaciones', element: <Guard anyOf={PERM.ce}><ObservacionesCePage /></Guard> },
                    { path: 'control-escolar/reportes', element: <Guard anyOf={PERM.ce}><ReportesCePage /></Guard> },
                    { path: 'control-escolar/notificaciones', element: <Guard anyOf={PERM.ce}><NotificacionesCePage /></Guard> },
                    { path: 'importaciones', element: <ImportacionesAcademicasPage /> },
                    { path: 'importaciones/legacy-normativa', element: <LegacyNormativaRevisionPage /> },
                    { path: 'bajas-cambios', element: <Navigate to="/app/control-escolar/bajas-cambios" replace /> },
                    { path: 'reinscripciones', element: <Navigate to="/app/control-escolar/reinscripciones" replace /> },
                    { path: 'notificaciones', element: <NotificacionesCePage /> },
                    { path: 'direccion/indicadores', element: <Guard anyOf={PERM.direccion}><DireccionIndicadoresPage /></Guard> },
                    { path: 'direccion/alumnos', element: <Guard anyOf={PERM.direccion}><DireccionAlumnosPage /></Guard> },
                    { path: 'direccion/inscripciones', element: <Guard anyOf={PERM.direccion}><DireccionInscripcionesPage /></Guard> },
                    { path: 'direccion/reinscripciones', element: <Guard anyOf={PERM.direccion}><DireccionReinscripcionesPage /></Guard> },
                    { path: 'direccion/calificaciones', element: <Guard anyOf={PERM.direccion}><DireccionCalificacionesSupervisionPage /></Guard> },
                    { path: 'direccion/egreso-titulacion', element: <Guard anyOf={PERM.direccion}><DireccionEgresoTitulacionPage /></Guard> },
                    { path: 'direccion/documentos', element: <Guard anyOf={PERM.docView}><DireccionDocumentosPage /></Guard> },
                    { path: 'direccion/autorizaciones-observaciones', element: <Guard anyOf={PERM.direccion}><DireccionAutorizacionesPage /></Guard> },
                    { path: 'direccion/reportes', element: <Guard anyOf={PERM.direccion}><DireccionReportesPage /></Guard> },
                    { path: 'direccion/notificaciones', element: <Guard anyOf={PERM.direccion}><DireccionNotificacionesPage /></Guard> },
                    { path: 'educacion-superior/instituciones', element: <Guard anyOf={PERM.educacionSuperior}><EsInstitucionesPage /></Guard> },
                    { path: 'educacion-superior/sedes', element: <Guard anyOf={PERM.educacionSuperior}><EsSedesPage /></Guard> },
                    { path: 'educacion-superior/programas', element: <Guard anyOf={PERM.educacionSuperior}><EsProgramasPage /></Guard> },
                    { path: 'educacion-superior/planes', element: <Guard anyOf={PERM.educacionSuperior}><EsPlanesPage /></Guard> },
                    { path: 'educacion-superior/validaciones-normativas', element: <Guard anyOf={PERM.educacionSuperior}><EsValidacionesNormativasPage /></Guard> },
                    { path: 'educacion-superior/certificacion', element: <Guard anyOf={PERM.educacionSuperior}><EsCertificacionPage /></Guard> },
                    { path: 'educacion-superior/reportes-oficiales', element: <Guard anyOf={PERM.educacionSuperior}><EsReportesOficialesPage /></Guard> },
                    { path: 'solicitudes-matricula', element: <Guard anyOf={['ver_solicitud_matricula', 'solicitudes_matricula.ver']}><SolicitudesMatriculaBandejaPage /></Guard> },
                    { path: 'sistemas/listos-para-firma', element: <Guard anyOf={['firma.ver', 'ver_documentos', 'documentos.ver']}><ListosParaFirmaPage /></Guard> },
                    { path: 'sistemas/listos-firma', element: <Navigate to="/app/sistemas/listos-para-firma" replace /> },
                    { path: 'sistemas/dashboard', element: <DashboardTecnicoPage /> },
                    { path: 'sistemas/logs', element: <Guard anyOf={['logs.ver', 'ver_logs_integracion']}><LogsTecnicosPage /></Guard> },
                    { path: 'sistemas/configuracion', element: <Guard anyOf={PERM.sistemas}><ConfiguracionTecnicaPage /></Guard> },
                    { path: 'admin/dashboard', element: <AdminDashboardPage /> },
                    { path: 'superadmin/dashboard', element: <SuperAdminDashboardPage /> },
                    { path: 'admin/usuarios-roles', element: <UsuariosRolesPage /> },
                    { path: 'admin/catalogos', element: <CatalogosPage /> },
                    {
                        path: 'admin/menus',
                        element: (
                            <RequirePermission permission="menus.administrar">
                                <MenusPorRolPage />
                            </RequirePermission>
                        ),
                    },
                    {
                        path: 'sistema/apariencia',
                        element: (
                            <RequirePermission permission="apariencia_sistema.administrar">
                                <AparienciaSistemaPage />
                            </RequirePermission>
                        ),
                    },
                    { path: 'auditoria', element: <Guard anyOf={PERM.auditoria}><AuditorDashboardPage /></Guard> },
                    { path: 'auditoria/dashboard', element: <Guard anyOf={PERM.auditoria}><AuditoriaPage /></Guard> },
                    { path: 'consulta/dashboard', element: <Guard anyOf={PERM.consulta}><ConsultaDashboardPage /></Guard> },
                    { path: 'consulta/documentos', element: <Guard anyOf={PERM.consulta}><ConsultaDocumentosPage /></Guard> },
                    { path: 'docente/dashboard', element: <DocenteDashboardPage /> },
                    { path: 'coordinador/dashboard', element: <CoordinadorAcademicoDashboardPage /> },
                    { path: 'admin/parametros', element: <ParametrosSistemaPage /> },
                    { path: 'admin/reportes-basicos', element: <ReportesBasicosPage /> },
                ],
            },
        ],
    },
]);

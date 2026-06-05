import { RequirePermission } from './components/auth/RequirePermission';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { SpaNotFoundPage, SpaRouteErrorPage } from './components/routing/SpaRouteErrorPage';
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
import { ProcesoTecnicoCertificacionPage } from './pages/sistemas/ProcesoTecnicoCertificacionPage';
import { DocumentoProcesoTecnicoPage } from './pages/sistemas/DocumentoProcesoTecnicoPage';
import { DashboardTecnicoPage } from './pages/sistemas/DashboardTecnicoPage';
import { LogsTecnicosPage } from './pages/sistemas/LogsTecnicosPage';
import { ConfiguracionTecnicaPage } from './pages/sistemas/ConfiguracionTecnicaPage';
import { MenusPorRolPage } from './pages/admin/MenusPorRolPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { SuperAdminDashboardPage } from './pages/superadmin/SuperAdminDashboardPage';
import { UsuariosRolesPage } from './pages/admin/UsuariosRolesPage';
import { CatalogosPage } from './pages/admin/CatalogosPage';
import { CatalogosAcademicosPage } from './pages/catalogosAcademicos/CatalogosAcademicosPage';
import { SubsistemasInstitucionesPage } from './pages/catalogos/SubsistemasInstitucionesPage';
import { SedesSubsedesPage } from './pages/catalogos/SedesSubsedesPage';
import { MunicipiosPage } from './pages/catalogos/MunicipiosPage';
import { ProgramasOfertasPage } from './pages/catalogos/ProgramasOfertasPage';
import { CiclosPeriodosPage } from './pages/catalogos/CiclosPeriodosPage';
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
import { CatalogosControlEscolarPage } from './pages/controlEscolar/CatalogosControlEscolarPage';
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
import { NormalesCertificacionPage } from './pages/educacionSuperior/NormalesCertificacionPage';
import { NormalesCertificadoDetallePage } from './pages/educacionSuperior/NormalesCertificadoDetallePage';
import { DocumentoAcademicoPlaceholderPage } from './pages/educacionSuperior/DocumentoAcademicoPlaceholderPage';
import { UpnCertificacionPage } from './pages/educacionSuperior/UpnCertificacionPage';
import { UpnCertificadoDetallePage } from './pages/educacionSuperior/UpnCertificadoDetallePage';
import { EsReportesOficialesPage } from './pages/educacionSuperior/EsReportesOficialesPage';
import { BandejaRevisionInstitucionalPage } from './pages/documentos/BandejaRevisionInstitucionalPage';
import { RevisionInstitucionalPage } from './pages/documentos/RevisionInstitucionalPage';
import { CertificacionLayout } from './layouts/CertificacionLayout';
import { DashboardCertificacionPage } from './pages/certificacion/DashboardCertificacionPage';
import { SolicitudesCertificacionPage } from './pages/certificacion/SolicitudesCertificacionPage';
import { DocumentosACertificarPage } from './pages/certificacion/DocumentosACertificarPage';
import { GeneracionDocumentosPage } from './pages/certificacion/GeneracionDocumentosPage';
import { FirmaElectronicaPage } from './pages/certificacion/FirmaElectronicaPage';
import { EntregaSeguimientoPage } from './pages/certificacion/EntregaSeguimientoPage';
import { ReportesCertificacionPage } from './pages/certificacion/ReportesCertificacionPage';
import { ConfiguracionCertificacionPage } from './pages/certificacion/ConfiguracionCertificacionPage';
import { NotificacionesCertificacionPage } from './pages/certificacion/NotificacionesCertificacionPage';
import { CERT_PERM } from './utils/certificacionPermissions';
import {
    DOCUMENTO_PROCESO_TECNICO_PATH,
    ES_CERTIFICACION_LEGACY_PATH,
    NORMALES_CERTIFICACION_PATH,
    PROCESO_TECNICO_BANDEJA_PATH,
    UPN_CERTIFICACION_LEGACY_PATH,
    UPN_CERTIFICACION_PATH,
} from './utils/certificacionRoutes';

function PrivateOutlet() {
    return getToken() ? <AppLayout /> : <Navigate to="/login" replace />;
}

function GuestOutlet() {
    return getToken() ? <Navigate to="/app/dashboard" replace /> : <AuthLayout />;
}

function Guard({ anyOf, children }) {
    return <RequirePermission anyOf={anyOf}>{children}</RequirePermission>;
}

function LegacyDetailRedirect({ basePath, sourceParam = 'id' }) {
    const params = useParams();
    const value = params[sourceParam] ?? params.documentoId ?? params.id;
    if (!value) {
        return <Navigate to={basePath} replace />;
    }
    return <Navigate to={`${basePath}/${value}`} replace />;
}

const PERM = {
    docView: ['ver_documentos', 'documentos.ver'],
    docCreate: ['crear_documentos', 'documentos.crear', 'documentos.crear_borrador'],
    expediente: ['ver_alumnos', 'alumnos.ver', 'expedientes.ver'],
    alumnosManage: ['gestionar_alumnos', 'alumnos.crear', 'alumnos.editar', 'expedientes.editar'],
    trayectoria: ['ver_trayectorias', 'trayectoria.ver', 'trayectoria.recalcular', 'gestionar_trayectorias', 'trayectoria.editar'],
    importaciones: [
        'importaciones_academicas.ver',
        'importaciones_academicas.crear',
        'importaciones_academicas.importar',
        'control_escolar.importar',
        'importar_calificaciones',
    ],
    importacionesLegacy: [
        'importaciones_academicas.ver',
        'revisar_importacion_legacy_normativa',
        'aprobar_importacion_legacy_normativa',
    ],
    notificaciones: ['notificaciones.ver'],
    adminDashboard: ['dashboard.ver', 'ver_catalogos', 'catalogos.ver'],
    adminUsuarios: ['usuarios.ver', 'roles.ver'],
    adminCatalogos: ['catalogos.tecnicos.ver'],
    technicalCatalogosHub: ['catalogos.tecnicos.ver'],
    catalogosAcademicos: ['ver_catalogos', 'catalogos.ver', 'catalogos.academicos.ver', 'ciclos_escolares.ver', 'periodos_escolares.ver', 'dashboard.ver'],
    adminParametros: ['configuracion.ver', 'configuracion.configurar'],
    adminReportes: ['reportes.ver'],
    ce: ['dashboard.ver', 'alumnos.ver', 'expedientes.ver'],
    ceCatalogos: [
        'control_escolar.catalogos.ver',
        'estatus_academicos.ver',
        'estatus_matricula.ver',
        'escalas_calificacion.ver',
        'control_escolar.catalogos.configurar',
        'catalogos.ver',
        'ver_catalogos',
        'dashboard.ver',
    ],
    direccion: ['dashboard.ver', 'indicadores.ver', 'alumnos.ver', 'expedientes.ver'],
    educacionSuperior: ['dashboard.ver', 'instituciones.ver', 'solicitudes_matricula.ver', 'certificacion.ver'],
    revisionInstitucional: [
        'ver_documentos',
        'documentos.ver',
        'certificacion.ver',
        'validaciones_normativas.ver',
    ],
    sistemas: ['dashboard.ver', 'logs.ver', 'integraciones.ver', 'firma.ver', 'jobs.ver'],
    procesoTecnico: [
        'generar_cadena',
        'cadena_original.generar',
        'generar_xml',
        'xml.generar',
        'xml.validar',
        'firma.ver',
        'integraciones.ver',
        'sistemas.integraciones.ver',
        'documentos.ver',
        'ver_documentos',
    ],
    auditoria: ['auditoria.ver', 'dashboard.ver'],
    consulta: ['documentos.ver', 'dashboard.ver'],
    docenteDashboard: ['dashboard.ver'],
    coordinadorDashboard: ['dashboard.ver'],
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
        element: <Outlet />,
        errorElement: <SpaRouteErrorPage />,
        children: [
            {
                element: <PrivateOutlet />,
                errorElement: <SpaRouteErrorPage />,
                children: [
                    { index: true, element: <Navigate to="/app/dashboard" replace /> },
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
                    { path: 'alumnos/crear', element: <Guard anyOf={PERM.alumnosManage}><AlumnoFormPage /></Guard> },
                    { path: 'alumnos/nuevo', element: <Navigate to="/app/alumnos/crear" replace /> },
                    { path: 'alumnos/captura-guiado', element: <Guard anyOf={PERM.alumnosManage}><AlumnoCapturaWizard /></Guard> },
                    { path: 'alumnos/:id/expediente', element: <Guard anyOf={PERM.expediente}><AlumnoDetallePage /></Guard> },
                    { path: 'alumnos/:id/captura-guiado', element: <Guard anyOf={PERM.alumnosManage}><AlumnoCapturaWizard /></Guard> },
                    { path: 'alumnos/:id/trayectoria', element: <Guard anyOf={PERM.trayectoria}><TrayectoriaPage /></Guard> },
                    {
                        path: 'certificacion/solicitud',
                        element: (
                            <Guard anyOf={['crear_documentos', 'documentos.crear', 'documentos.crear_borrador', 'certificacion.preparar', 'control_escolar.importar']}>
                                <SolicitudCertificacionPage />
                            </Guard>
                        ),
                    },
                    {
                        path: 'certificacion',
                        element: (
                            <Guard anyOf={CERT_PERM.module}>
                                <CertificacionLayout />
                            </Guard>
                        ),
                        children: [
                            { index: true, element: <Navigate to="/app/certificacion/dashboard" replace /> },
                            {
                                path: 'dashboard',
                                element: (
                                    <Guard anyOf={CERT_PERM.dashboard}>
                                        <DashboardCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'solicitudes',
                                element: (
                                    <Guard anyOf={CERT_PERM.solicitudes}>
                                        <SolicitudesCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'documentos-a-certificar',
                                element: (
                                    <Guard anyOf={CERT_PERM.documentosACertificar}>
                                        <DocumentosACertificarPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'generacion-documentos',
                                element: (
                                    <Guard anyOf={CERT_PERM.generacion}>
                                        <GeneracionDocumentosPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'firma-electronica',
                                element: (
                                    <Guard anyOf={CERT_PERM.firmaElectronica}>
                                        <FirmaElectronicaPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'entrega-seguimiento',
                                element: (
                                    <Guard anyOf={CERT_PERM.entrega}>
                                        <EntregaSeguimientoPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'reportes',
                                element: (
                                    <Guard anyOf={CERT_PERM.reportes}>
                                        <ReportesCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'configuracion',
                                element: (
                                    <Guard anyOf={CERT_PERM.configuracion}>
                                        <ConfiguracionCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'notificaciones',
                                element: (
                                    <Guard anyOf={CERT_PERM.notificaciones}>
                                        <NotificacionesCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'revision',
                                element: (
                                    <Guard anyOf={PERM.revisionInstitucional}>
                                        <BandejaRevisionInstitucionalPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'revision/:id',
                                element: (
                                    <Guard anyOf={PERM.revisionInstitucional}>
                                        <RevisionInstitucionalPage />
                                    </Guard>
                                ),
                            },
                        ],
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
                    { path: 'control-escolar/catalogos', element: <Guard anyOf={PERM.ceCatalogos}><CatalogosControlEscolarPage /></Guard> },
                    { path: 'control-escolar/trayectoria', element: <Guard anyOf={PERM.ce}><TrayectoriaCePage /></Guard> },
                    { path: 'control-escolar/calificaciones', element: <Guard anyOf={PERM.ce}><CalificacionesCePage /></Guard> },
                    { path: 'control-escolar/documentos', element: <Guard anyOf={PERM.docView}><DocumentosCePage /></Guard> },
                    { path: 'control-escolar/bajas-cambios', element: <Guard anyOf={PERM.ce}><BajasCambiosPage /></Guard> },
                    { path: 'control-escolar/solicitudes', element: <Guard anyOf={PERM.ce}><SolicitudesCePage /></Guard> },
                    { path: 'control-escolar/importaciones', element: <Guard anyOf={PERM.ce}><ImportacionesCePage /></Guard> },
                    { path: 'control-escolar/observaciones', element: <Guard anyOf={PERM.ce}><ObservacionesCePage /></Guard> },
                    { path: 'control-escolar/reportes', element: <Guard anyOf={PERM.ce}><ReportesCePage /></Guard> },
                    { path: 'control-escolar/notificaciones', element: <Guard anyOf={PERM.ce}><NotificacionesCePage /></Guard> },
                    { path: 'importaciones', element: <Guard anyOf={PERM.importaciones}><ImportacionesAcademicasPage /></Guard> },
                    { path: 'importaciones/legacy-normativa', element: <Guard anyOf={PERM.importacionesLegacy}><LegacyNormativaRevisionPage /></Guard> },
                    { path: 'bajas-cambios', element: <Navigate to="/app/control-escolar/bajas-cambios" replace /> },
                    { path: 'reinscripciones', element: <Navigate to="/app/control-escolar/reinscripciones" replace /> },
                    { path: 'notificaciones', element: <Guard anyOf={PERM.notificaciones}><NotificacionesCePage /></Guard> },
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
                    {
                        path: 'educacion-superior',
                        children: [
                            {
                                path: 'instituciones',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsInstitucionesPage /></Guard>,
                            },
                            {
                                path: 'sedes',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsSedesPage /></Guard>,
                            },
                            {
                                path: 'programas',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsProgramasPage /></Guard>,
                            },
                            {
                                path: 'planes',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsPlanesPage /></Guard>,
                            },
                            {
                                path: 'validaciones-normativas',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsValidacionesNormativasPage /></Guard>,
                            },
                            {
                                path: 'normales',
                                children: [
                                    {
                                        path: 'certificacion',
                                        children: [
                                            {
                                                index: true,
                                                element: (
                                                    <Guard anyOf={PERM.educacionSuperior}>
                                                        <NormalesCertificacionPage />
                                                    </Guard>
                                                ),
                                            },
                                            {
                                                path: ':documentoId',
                                                element: (
                                                    <Guard anyOf={PERM.revisionInstitucional}>
                                                        <NormalesCertificadoDetallePage />
                                                    </Guard>
                                                ),
                                            },
                                        ],
                                    },
                                    {
                                        path: 'titulos',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage subsistema="normales" tipoDocumento="titulo" />
                                            </Guard>
                                        ),
                                    },
                                    {
                                        path: 'grados-academicos',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage
                                                    subsistema="normales"
                                                    tipoDocumento="grado_academico"
                                                />
                                            </Guard>
                                        ),
                                    },
                                    {
                                        path: 'constancias',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage subsistema="normales" tipoDocumento="constancia" />
                                            </Guard>
                                        ),
                                    },
                                ],
                            },
                            {
                                path: 'upn',
                                children: [
                                    {
                                        path: 'certificacion',
                                        children: [
                                            {
                                                index: true,
                                                element: (
                                                    <Guard anyOf={PERM.educacionSuperior}>
                                                        <UpnCertificacionPage />
                                                    </Guard>
                                                ),
                                            },
                                            {
                                                path: ':documentoId',
                                                element: (
                                                    <Guard anyOf={PERM.educacionSuperior}>
                                                        <UpnCertificadoDetallePage />
                                                    </Guard>
                                                ),
                                            },
                                        ],
                                    },
                                    {
                                        path: 'titulos',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage subsistema="upn" tipoDocumento="titulo" />
                                            </Guard>
                                        ),
                                    },
                                    {
                                        path: 'grados-academicos',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage subsistema="upn" tipoDocumento="grado_academico" />
                                            </Guard>
                                        ),
                                    },
                                    {
                                        path: 'constancias',
                                        element: (
                                            <Guard anyOf={PERM.educacionSuperior}>
                                                <DocumentoAcademicoPlaceholderPage subsistema="upn" tipoDocumento="constancia" />
                                            </Guard>
                                        ),
                                    },
                                ],
                            },
                            {
                                path: 'certificacion',
                                element: <Navigate to={NORMALES_CERTIFICACION_PATH} replace />,
                            },
                            {
                                path: 'upn-certificacion',
                                element: <Navigate to={UPN_CERTIFICACION_PATH} replace />,
                            },
                            {
                                path: 'upn-certificacion/:documentoId',
                                element: <LegacyDetailRedirect basePath={UPN_CERTIFICACION_PATH} sourceParam="documentoId" />,
                            },
                            {
                                path: 'revision',
                                element: <Guard anyOf={PERM.revisionInstitucional}><BandejaRevisionInstitucionalPage /></Guard>,
                            },
                            {
                                path: 'revision/:id',
                                element: <Guard anyOf={PERM.revisionInstitucional}><RevisionInstitucionalPage /></Guard>,
                            },
                            {
                                path: 'reportes-oficiales',
                                element: <Guard anyOf={PERM.educacionSuperior}><EsReportesOficialesPage /></Guard>,
                            },
                        ],
                    },
                    { path: 'solicitudes-matricula', element: <Guard anyOf={['ver_solicitud_matricula', 'solicitudes_matricula.ver']}><SolicitudesMatriculaBandejaPage /></Guard> },
                    {
                        path: 'sistemas',
                        children: [
                            {
                                path: 'proceso-tecnico-certificacion',
                                element: (
                                    <Guard anyOf={PERM.procesoTecnico}>
                                        <ProcesoTecnicoCertificacionPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'documento-proceso-tecnico',
                                element: (
                                    <Guard anyOf={PERM.procesoTecnico}>
                                        <DocumentoProcesoTecnicoPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'documento-proceso-tecnico/:documentoId',
                                element: (
                                    <Guard anyOf={PERM.procesoTecnico}>
                                        <DocumentoProcesoTecnicoPage />
                                    </Guard>
                                ),
                            },
                            {
                                path: 'proceso-tecnico-certificacion/:id',
                                element: <LegacyDetailRedirect basePath={DOCUMENTO_PROCESO_TECNICO_PATH} />,
                            },
                            {
                                path: 'listos-para-firma',
                                element: <Navigate to={PROCESO_TECNICO_BANDEJA_PATH} replace />,
                            },
                            {
                                path: 'listos-firma',
                                element: <Navigate to={PROCESO_TECNICO_BANDEJA_PATH} replace />,
                            },
                            {
                                path: 'dashboard',
                                element: <Guard anyOf={PERM.sistemas}><DashboardTecnicoPage /></Guard>,
                            },
                            {
                                path: 'logs',
                                element: <Guard anyOf={['logs.ver', 'ver_logs_integracion']}><LogsTecnicosPage /></Guard>,
                            },
                            {
                                path: 'configuracion',
                                element: <Guard anyOf={PERM.sistemas}><ConfiguracionTecnicaPage /></Guard>,
                            },
                            {
                                path: 'catalogos',
                                element: <Navigate to="/app/admin/catalogos" replace />,
                            },
                        ],
                    },
                    { path: 'admin/dashboard', element: <Guard anyOf={PERM.adminDashboard}><AdminDashboardPage /></Guard> },
                    { path: 'superadmin/dashboard', element: <Guard anyOf={PERM.adminDashboard}><SuperAdminDashboardPage /></Guard> },
                    { path: 'admin/usuarios-roles', element: <Guard anyOf={PERM.adminUsuarios}><UsuariosRolesPage /></Guard> },
                    { path: 'admin/catalogos', element: <Guard anyOf={PERM.technicalCatalogosHub}><CatalogosPage /></Guard> },
                    { path: 'catalogos-academicos', element: <Guard anyOf={PERM.catalogosAcademicos}><CatalogosAcademicosPage /></Guard> },
                    { path: 'catalogos/subsistemas-instituciones', element: <Guard anyOf={PERM.catalogosAcademicos}><SubsistemasInstitucionesPage /></Guard> },
                    { path: 'catalogos/sedes', element: <Guard anyOf={PERM.catalogosAcademicos}><SedesSubsedesPage /></Guard> },
                    { path: 'catalogos/municipios', element: <Guard anyOf={PERM.catalogosAcademicos}><MunicipiosPage /></Guard> },
                    { path: 'catalogos/programas-ofertas', element: <Guard anyOf={PERM.catalogosAcademicos}><ProgramasOfertasPage /></Guard> },
                    { path: 'catalogos/ciclos-periodos', element: <Guard anyOf={PERM.catalogosAcademicos}><CiclosPeriodosPage /></Guard> },
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
                    { path: 'docente/dashboard', element: <Guard anyOf={PERM.docenteDashboard}><DocenteDashboardPage /></Guard> },
                    { path: 'coordinador/dashboard', element: <Guard anyOf={PERM.coordinadorDashboard}><CoordinadorAcademicoDashboardPage /></Guard> },
                    { path: 'admin/parametros', element: <Guard anyOf={PERM.adminParametros}><ParametrosSistemaPage /></Guard> },
                    { path: 'admin/reportes-basicos', element: <Guard anyOf={PERM.adminReportes}><ReportesBasicosPage /></Guard> },
                    { path: '*', element: <SpaNotFoundPage /> },
                ],
            },
        ],
    },
    { path: '*', element: <SpaNotFoundPage />, errorElement: <SpaRouteErrorPage /> },
]);

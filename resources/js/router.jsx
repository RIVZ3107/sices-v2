import { createBrowserRouter, Navigate } from 'react-router-dom';
import { getToken } from './authStore';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { BandejasPage } from './pages/documentos/BandejasPage';
import { DocumentoShowPage } from './pages/documentos/DocumentoShowPage';
import { DocumentoWizardPage } from './pages/documentos/DocumentoWizardPage';
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

function PrivateOutlet() {
    return getToken() ? <AppLayout /> : <Navigate to="/login" replace />;
}

function GuestOutlet() {
    return getToken() ? <Navigate to="/app/dashboard" replace /> : <AuthLayout />;
}

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
                    { path: 'expedientes', element: <AlumnoDetallePage /> },
                    { path: 'documentos/bandejas', element: <BandejasPage /> },
                    { path: 'documentos/bandejas/:bandeja', element: <BandejasPage /> },
                    { path: 'documentos', element: <Navigate to="/app/documentos/bandejas/por-rol" replace /> },
                    { path: 'documentos/nuevo', element: <DocumentoWizardPage /> },
                    { path: 'documentos/:id/captura', element: <DocumentoWizardPage /> },
                    { path: 'documentos/:id/validacion', element: <DocumentoValidacionPage /> },
                    { path: 'documentos/:id/observaciones', element: <DocumentoObservacionesPage /> },
                    { path: 'documentos/validacion', element: <DocumentoValidacionPage /> },
                    { path: 'documentos/observaciones', element: <DocumentoObservacionesPage /> },
                    { path: 'observaciones', element: <DocumentoObservacionesPage /> },
                    { path: 'documentos/:id', element: <DocumentoShowPage /> },
                    { path: 'alumnos', element: <Navigate to="/app/expedientes" replace /> },
                    { path: 'alumnos/crear', element: <AlumnoFormPage /> },
                    { path: 'alumnos/nuevo', element: <Navigate to="/app/alumnos/crear" replace /> },
                    { path: 'alumnos/captura-guiado', element: <AlumnoCapturaWizard /> },
                    { path: 'alumnos/:id/expediente', element: <AlumnoDetallePage /> },
                    { path: 'alumnos/:id/captura-guiado', element: <AlumnoCapturaWizard /> },
                    { path: 'alumnos/:id/trayectoria', element: <TrayectoriaPage /> },
                    { path: 'certificacion/solicitud', element: <Navigate to="/app/expedientes?tab=certificacion" replace /> },
                    { path: 'matriculas', element: <Navigate to="/app/expedientes?tab=matricula" replace /> },
                    { path: 'materias-cursadas', element: <Navigate to="/app/expedientes?tab=calificaciones" replace /> },
                    { path: 'materias', element: <Navigate to="/app/materias-cursadas" replace /> },
                    { path: 'trayectorias', element: <Navigate to="/app/expedientes?tab=trayectoria" replace /> },
                    { path: 'importaciones', element: <ImportacionesAcademicasPage /> },
                    { path: 'importaciones/legacy-normativa', element: <LegacyNormativaRevisionPage /> },
                    { path: 'sistemas/listos-para-firma', element: <ListosParaFirmaPage /> },
                    { path: 'sistemas/listos-firma', element: <Navigate to="/app/sistemas/listos-para-firma" replace /> },
                    { path: 'sistemas/dashboard', element: <DashboardTecnicoPage /> },
                    { path: 'sistemas/logs', element: <LogsTecnicosPage /> },
                    { path: 'sistemas/configuracion', element: <ConfiguracionTecnicaPage /> },
                    { path: 'admin/dashboard', element: <AdminDashboardPage /> },
                    { path: 'superadmin/dashboard', element: <SuperAdminDashboardPage /> },
                    { path: 'admin/usuarios-roles', element: <UsuariosRolesPage /> },
                    { path: 'admin/catalogos', element: <CatalogosPage /> },
                    { path: 'auditoria', element: <AuditorDashboardPage /> },
                    { path: 'auditoria/dashboard', element: <AuditoriaPage /> },
                    { path: 'consulta/dashboard', element: <ConsultaDashboardPage /> },
                    { path: 'consulta/documentos', element: <ConsultaDocumentosPage /> },
                    { path: 'docente/dashboard', element: <DocenteDashboardPage /> },
                    { path: 'coordinador/dashboard', element: <CoordinadorAcademicoDashboardPage /> },
                    { path: 'admin/parametros', element: <ParametrosSistemaPage /> },
                    { path: 'admin/reportes-basicos', element: <ReportesBasicosPage /> },
                ],
            },
        ],
    },
]);

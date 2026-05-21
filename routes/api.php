<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BandejaDocumentoAcademicoController;
use App\Http\Controllers\Api\V1\Academico\ImportacionHistoricaMateriasController;
use App\Http\Controllers\Api\V1\Admin\MenuAdminController;
use App\Http\Controllers\Api\V1\Admin\RoleManagementController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\Certificacion\AlumnoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\CatalogoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoAcademicoProcesoController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoDecNormalController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoFirmaController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoObservacionController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarIntegracionController;
use App\Http\Controllers\Api\Certificacion\ConsultaPublicaController;
use App\Http\Controllers\Api\V1\Certificacion\InscripcionPeriodoController;
use App\Http\Controllers\Api\V1\Certificacion\MateriaCursadaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\MatriculaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\SolicitudMatriculaController;
use App\Http\Controllers\Api\V1\Certificacion\TrayectoriaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\ValidacionNormativaImportacionLegacyController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\EducacionSuperior\EducacionSuperiorMetricasController;
use App\Http\Controllers\Api\V1\EducacionSuperior\EducacionSuperiorReportesController;
use App\Http\Controllers\Api\V1\Me\MeAparienciaController;
use App\Http\Controllers\Api\V1\Me\UserMenuController;
use App\Http\Controllers\Api\V1\SicesLegacy\SicesLegacyConsultaController;
use App\Http\Controllers\Api\V1\Sistema\ConfiguracionVisualSistemaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1/auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('v1/me')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('menus', UserMenuController::class);
        Route::get('apariencia', MeAparienciaController::class);
    });

Route::prefix('v1/sistema/apariencia')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('actual', [ConfiguracionVisualSistemaController::class, 'actual']);
        Route::get('/', [ConfiguracionVisualSistemaController::class, 'index']);
        Route::post('/', [ConfiguracionVisualSistemaController::class, 'store']);
        Route::put('{configuracion}', [ConfiguracionVisualSistemaController::class, 'update'])
            ->whereNumber('configuracion');
        Route::post('{configuracion}/activar', [ConfiguracionVisualSistemaController::class, 'activar'])
            ->whereNumber('configuracion');
        Route::post('{configuracion}/restaurar-default', [ConfiguracionVisualSistemaController::class, 'restaurarDefault'])
            ->whereNumber('configuracion');
        Route::post('upload', [ConfiguracionVisualSistemaController::class, 'upload']);
    });

Route::get('v1/dashboard', DashboardController::class)
    ->middleware('auth:sanctum');

Route::get('v1/consulta-publica/documentos/{token}', [ConsultaPublicaController::class, 'showByToken']);

Route::prefix('v1/academico')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('importaciones/plantilla', [ImportacionHistoricaMateriasController::class, 'plantilla']);
        Route::get('importaciones', [ImportacionHistoricaMateriasController::class, 'index']);
        Route::post('importaciones', [ImportacionHistoricaMateriasController::class, 'store']);
        Route::get('importaciones/{historica_importacion}', [ImportacionHistoricaMateriasController::class, 'show']);
        Route::post('importaciones/{historica_importacion}/prevalidar', [ImportacionHistoricaMateriasController::class, 'prevalidar']);
        Route::post('importaciones/{historica_importacion}/confirmar', [ImportacionHistoricaMateriasController::class, 'confirmar']);
        Route::post('importaciones/{historica_importacion}/cancelar', [ImportacionHistoricaMateriasController::class, 'cancelar']);
    });

Route::prefix('v1/certificacion')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::middleware('permission_or:ver_catalogos|catalogos.ver|dashboard.ver')->group(function () {
            Route::get('catalogos/ciclos-escolares', [CatalogoCapturaController::class, 'ciclosEscolares']);
            Route::get('catalogos/subsistemas', [CatalogoCapturaController::class, 'subsistemas']);
            Route::get('catalogos/regiones', [CatalogoCapturaController::class, 'regiones']);
            Route::get('catalogos/instituciones', [CatalogoCapturaController::class, 'instituciones']);
            Route::get('catalogos/sedes', [CatalogoCapturaController::class, 'sedes']);
            Route::get('catalogos/programas', [CatalogoCapturaController::class, 'programas']);
            Route::get('catalogos/planes-estudio', [CatalogoCapturaController::class, 'planesEstudio']);
            Route::get('catalogos/ofertas-academicas', [CatalogoCapturaController::class, 'ofertasAcademicas']);
        });

        Route::get('alumnos', [AlumnoCapturaController::class, 'index'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::post('alumnos', [AlumnoCapturaController::class, 'store'])
            ->middleware('permission_or:gestionar_alumnos|alumnos.crear|expedientes.crear');
        Route::get('alumnos/{alumno}', [AlumnoCapturaController::class, 'show'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::put('alumnos/{alumno}', [AlumnoCapturaController::class, 'update'])
            ->middleware('permission_or:gestionar_alumnos|alumnos.editar|expedientes.editar');
        Route::get('alumnos/{alumno}/resumen-institucional', [AlumnoCapturaController::class, 'resumenInstitucional'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');

        Route::post('matriculas', [MatriculaCapturaController::class, 'store'])
            ->middleware('permission_or:asignar_matricula|matriculas.asignar');
        Route::get('matriculas/{matricula}', [MatriculaCapturaController::class, 'show'])
            ->middleware('permission_or:ver_matriculas|matriculas.ver');
        Route::get('matriculas/{matricula}/trayectoria-academica', [TrayectoriaCapturaController::class, 'showPorMatricula'])
            ->middleware('permission_or:ver_trayectorias|trayectoria.ver');
        Route::post(
            'matriculas/{matricula}/trayectoria-academica/recalcular',
            [TrayectoriaCapturaController::class, 'recalcularPorMatricula'],
        )->middleware('permission_or:gestionar_trayectorias|trayectoria.editar|trayectoria.recalcular');

        Route::get('solicitudes-matricula', [SolicitudMatriculaController::class, 'index'])
            ->middleware('permission_or:ver_solicitud_matricula|solicitudes_matricula.ver');
        Route::get('solicitudes-matricula/alumno/{alumno}', [SolicitudMatriculaController::class, 'ultimaPorAlumno'])
            ->middleware('permission_or:ver_solicitud_matricula|solicitudes_matricula.ver');
        Route::post('solicitudes-matricula', [SolicitudMatriculaController::class, 'store'])
            ->middleware('permission_or:crear_solicitud_matricula|solicitudes_matricula.crear');
        Route::post('solicitudes-matricula/{solicitudMatricula}/enviar', [SolicitudMatriculaController::class, 'enviar'])
            ->middleware('permission_or:enviar_solicitud_matricula|solicitudes_matricula.enviar');
        Route::post('solicitudes-matricula/{solicitudMatricula}/tomar-revision', [SolicitudMatriculaController::class, 'tomarEnRevision'])
            ->middleware('permission_or:revisar_solicitud_matricula|solicitudes_matricula.revisar');
        Route::post('solicitudes-matricula/{solicitudMatricula}/devolver-observaciones', [SolicitudMatriculaController::class, 'devolverConObservaciones'])
            ->middleware('permission_or:devolver_solicitud_matricula|solicitudes_matricula.devolver');
        Route::post('solicitudes-matricula/{solicitudMatricula}/atender-observaciones', [SolicitudMatriculaController::class, 'atenderObservaciones'])
            ->middleware('permission_or:atender_observacion_solicitud_matricula|solicitudes_matricula.atender_observaciones');
        Route::post('solicitudes-matricula/{solicitudMatricula}/aprobar', [SolicitudMatriculaController::class, 'aprobar'])
            ->middleware('permission_or:aprobar_solicitud_matricula|solicitudes_matricula.aprobar');
        Route::post('solicitudes-matricula/{solicitudMatricula}/rechazar', [SolicitudMatriculaController::class, 'rechazar'])
            ->middleware('permission_or:rechazar_solicitud_matricula|solicitudes_matricula.rechazar');
        Route::post('solicitudes-matricula/{solicitudMatricula}/asignar-matricula', [SolicitudMatriculaController::class, 'asignarMatricula'])
            ->middleware('permission_or:asignar_matricula|matriculas.asignar');

        Route::post('materias-cursadas', [MateriaCursadaCapturaController::class, 'store'])
            ->middleware('permission_or:gestionar_materias|calificaciones.capturar|materias.editar|calificaciones.capturar_propias');
        Route::post('inscripciones-periodo', [InscripcionPeriodoController::class, 'store'])
            ->middleware('permission_or:gestionar_matriculas|inscripciones.editar|inscripciones.crear');

        Route::put('trayectorias-academicas', [TrayectoriaCapturaController::class, 'upsert'])
            ->middleware('permission_or:gestionar_trayectorias|trayectoria.editar|trayectoria.recalcular');

        Route::post('documentos-academicos', [DocumentoAcademicoProcesoController::class, 'store'])
            ->middleware('permission_or:crear_documentos|documentos.crear|documentos.crear_borrador');
        Route::get('documentos-academicos/{documento}', [DocumentoAcademicoProcesoController::class, 'show'])
            ->middleware('permission_or:ver_documentos|documentos.ver');
        Route::get('documentos-academicos/{documento}/revision-institucional', [DocumentoAcademicoProcesoController::class, 'revisionInstitucional'])
            ->middleware('permission_or:ver_documentos|documentos.ver|certificacion.ver|validaciones_normativas.ver');
        Route::post('documentos-academicos/{documento}/validar', [DocumentoAcademicoProcesoController::class, 'validar'])
            ->middleware('permission_or:ver_documentos|documentos.ver');
        Route::post('documentos-academicos/{documento}/pasar-pendiente', [DocumentoAcademicoProcesoController::class, 'pasarPendiente'])
            ->middleware('permission_or:editar_documentos|documentos.editar');
        Route::post('documentos-academicos/{documento}/enviar-revision', [DocumentoAcademicoProcesoController::class, 'enviarRevision'])
            ->middleware('permission_or:enviar_revision|documentos.enviar_revision');
        Route::post('documentos-academicos/{documento}/aprobar', [DocumentoAcademicoProcesoController::class, 'aprobar'])
            ->middleware('permission_or:aprobar_documentos|documentos.aprobar|documentos.aprobar_institucionalmente|validaciones_normativas.aprobar|certificacion.autorizar_emision|certificacion.validar');
        Route::post('documentos-academicos/{documento}/rechazar', [DocumentoAcademicoProcesoController::class, 'rechazar'])
            ->middleware('permission_or:rechazar_documentos|documentos.rechazar|documentos.rechazar_institucionalmente|validaciones_normativas.rechazar');
        Route::post('documentos-academicos/{documento}/folio-interno', [DocumentoAcademicoProcesoController::class, 'asignarFolioInterno'])
            ->middleware('permission_or:preparar_documento_firma|folios.asignar|documentos.liberar_proceso_tecnico|certificacion.autorizar_emision');
        Route::post('documentos-academicos/{documento}/token-consulta-publica', [DocumentoAcademicoProcesoController::class, 'emitirTokenConsultaPublica'])
            ->middleware('permission_or:consulta_publica.emitir_token|consulta_publica.configurar|preparar_documento_firma|documentos.liberar_proceso_tecnico|certificacion.autorizar_emision');
        Route::post('documentos-academicos/{documento}/listo-para-firma', [DocumentoAcademicoProcesoController::class, 'marcarListoParaFirma'])
            ->middleware('permission_or:documentos.liberar_proceso_tecnico|preparar_documento_firma|certificacion.enviar_a_proceso_tecnico');
        Route::post('documentos-academicos/{documento}/firma/ejecutar', [DocumentoFirmaController::class, 'ejecutar'])
            ->middleware('permission_or:firma.ejecutar|solicitar_firma');
        Route::post('documentos-academicos/{documento}/dec-normal/payload', [DocumentoDecNormalController::class, 'generarPayload'])
            ->middleware('permission_or:generar_cadena|cadena_original.generar|ver_documentos|documentos.ver');
        Route::post('documentos-academicos/{documento}/dec-normal/cadena', [DocumentoDecNormalController::class, 'generarCadena'])
            ->middleware('permission_or:generar_cadena|cadena_original.generar');
        Route::post('documentos-academicos/{documento}/dec-normal/xml', [DocumentoDecNormalController::class, 'generarXml'])
            ->middleware('permission_or:generar_xml|xml.generar');
        Route::post('documentos-academicos/{documento}/dec-normal/validar-xml', [DocumentoDecNormalController::class, 'validarXml'])
            ->middleware('permission_or:generar_xml|xml.generar|xml.validar');
        Route::get('documentos-academicos/{documento}/dec-normal/errores', [DocumentoDecNormalController::class, 'errores'])
            ->middleware('permission_or:ver_xml|xml.ver|generar_xml|xml.generar');
        Route::get('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'index'])
            ->middleware('permission_or:ver_documentos|documentos.ver');
        Route::post('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'store'])
            ->middleware('permission_or:rechazar_documentos|documentos.rechazar|documentos.rechazar_institucionalmente|validaciones_normativas.rechazar|certificacion.validar|documentos.observar|observaciones.crear');
        Route::post('documentos-academicos/{documento}/observaciones/{observacion}/atender', [DocumentoObservacionController::class, 'atender'])
            ->middleware('permission_or:editar_documentos|documentos.editar');
        Route::post('documentos-academicos/{documento}/devolver-correccion', [DocumentoObservacionController::class, 'devolver'])
            ->middleware('permission_or:rechazar_documentos|documentos.rechazar|documentos.rechazar_institucionalmente');

        Route::get(
            'matriculas-legacy-normativa/pendientes',
            [ValidacionNormativaImportacionLegacyController::class, 'index']
        )->middleware('permission_or:revisar_importacion_legacy_normativa|importaciones_academicas.ver');
        Route::get(
            'matriculas-legacy-normativa/{matricula}',
            [ValidacionNormativaImportacionLegacyController::class, 'show']
        )->middleware('permission_or:revisar_importacion_legacy_normativa|importaciones_academicas.ver');
        Route::post(
            'matriculas-legacy-normativa/{matricula}/aprobar-validacion-normativa',
            [ValidacionNormativaImportacionLegacyController::class, 'aprobar']
        )->middleware('permission_or:aprobar_importacion_legacy_normativa|importaciones_academicas.importar');
        Route::post(
            'matriculas-legacy-normativa/{matricula}/rechazar-validacion-normativa',
            [ValidacionNormativaImportacionLegacyController::class, 'rechazar']
        )->middleware('permission_or:rechazar_importacion_legacy_normativa|importaciones_academicas.ver');

        Route::prefix('bandejas/documentos-academicos')
            ->middleware('permission_or:ver_documentos|documentos.ver')
            ->group(function () {
                Route::get('/', [BandejaDocumentoAcademicoController::class, 'index']);
                Route::get('/por-rol', [BandejaDocumentoAcademicoController::class, 'porRol']);
                Route::get('/borradores', [BandejaDocumentoAcademicoController::class, 'borradores']);
                Route::get('/por-enviar', [BandejaDocumentoAcademicoController::class, 'porEnviar']);
                Route::get('/en-revision', [BandejaDocumentoAcademicoController::class, 'enRevision']);
                Route::get('/pendientes-revision', [BandejaDocumentoAcademicoController::class, 'pendientesRevision']);
                Route::get('/aprobados', [BandejaDocumentoAcademicoController::class, 'aprobados']);
                Route::get('/rechazados', [BandejaDocumentoAcademicoController::class, 'rechazados']);
                Route::get('/cancelados', [BandejaDocumentoAcademicoController::class, 'cancelados']);
                Route::get('/listos-para-firma', [BandejaDocumentoAcademicoController::class, 'listosParaFirma']);
                Route::get('/firmados', [BandejaDocumentoAcademicoController::class, 'firmados']);
                Route::get('/errores-firma', [BandejaDocumentoAcademicoController::class, 'erroresFirma']);
                Route::get('/pendientes-tecnicos', [BandejaDocumentoAcademicoController::class, 'pendientesTecnicos']);
                Route::get('/resumen', [BandejaDocumentoAcademicoController::class, 'resumen']);
            });
    });

Route::prefix('v1/admin')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('roles', [RoleManagementController::class, 'index'])
            ->middleware('permission_or:ver_catalogos|catalogos.ver|dashboard.ver|roles.ver');
        Route::get('usuarios', [UserManagementController::class, 'index'])
            ->middleware('permission_or:ver_catalogos|catalogos.ver|dashboard.ver|usuarios.ver');
        Route::post('usuarios', [UserManagementController::class, 'store'])
            ->middleware('permission_or:gestionar_catalogos|catalogos.editar|catalogos.configurar|usuarios.crear');
        Route::put('usuarios/{user}', [UserManagementController::class, 'update'])
            ->middleware('permission_or:gestionar_catalogos|catalogos.editar|catalogos.configurar|usuarios.editar');

        Route::get('menus', [MenuAdminController::class, 'index'])
            ->middleware('permission:menus.administrar');
        Route::post('menus', [MenuAdminController::class, 'store'])
            ->middleware('permission:menus.administrar');
        Route::put('menus/{menu}', [MenuAdminController::class, 'update'])
            ->middleware('permission:menus.administrar');
        Route::delete('menus/{menu}', [MenuAdminController::class, 'destroy'])
            ->middleware('permission:menus.administrar');
        Route::post('menus/{menu}/roles', [MenuAdminController::class, 'syncRoles'])
            ->middleware('permission:menus.administrar');
        Route::post('menus/{menu}/permissions', [MenuAdminController::class, 'syncPermissions'])
            ->middleware('permission:menus.administrar');
    });

Route::prefix('v1/control-escolar')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('dashboard', [ControlEscolarController::class, 'dashboard'])
            ->middleware('permission_or:ver_documentos|documentos.ver|dashboard.ver');
        Route::get('alumnos', [ControlEscolarController::class, 'alumnos'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('expedientes', [ControlEscolarController::class, 'expedientes'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
<<<<<<< HEAD

        Route::prefix('integracion')
            ->middleware('permission_or:control_escolar.importar|certificacion.preparar|integraciones.ver|gestionar_trayectorias')
            ->group(function () {
                Route::get('health', [ControlEscolarIntegracionController::class, 'health']);
            });

        Route::middleware('permission_or:control_escolar.importar|certificacion.preparar|gestionar_trayectorias|crear_documentos|documentos.crear_borrador')
            ->group(function () {
                Route::get('alumnos/buscar', [ControlEscolarIntegracionController::class, 'buscar']);
                Route::post('alumnos/importar', [ControlEscolarIntegracionController::class, 'importar']);
            });

        Route::middleware('permission_or:control_escolar.importar|certificacion.preparar|validaciones_normativas.aprobar|documentos.liberar_proceso_tecnico|preparar_documento_firma')
            ->group(function () {
                Route::get('matriculas/{matricula}/validar-dec', [ControlEscolarIntegracionController::class, 'validarDec']);
                Route::post('matriculas/{matricula}/crear-documento-certificacion', [ControlEscolarIntegracionController::class, 'crearDocumentoCertificacion']);
            });
=======
        Route::get('inscripciones', [ControlEscolarController::class, 'inscripciones'])
            ->middleware('permission_or:inscripciones.ver|gestionar_inscripciones_periodo|ver_alumnos|alumnos.ver');
        Route::get('reinscripciones', [ControlEscolarController::class, 'reinscripciones'])
            ->middleware('permission_or:reinscripciones.ver|reinscripciones.revisar|reinscripciones.crear|ver_alumnos|alumnos.ver');
        Route::get('trayectoria', [ControlEscolarController::class, 'trayectoria'])
            ->middleware('permission_or:trayectoria.ver|ver_trayectorias|kardex.ver|ver_alumnos|alumnos.ver');
        Route::get('calificaciones', [ControlEscolarController::class, 'calificaciones'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar|calificaciones.revisar|ver_alumnos|alumnos.ver');
        Route::get('documentos', [ControlEscolarController::class, 'documentos'])
            ->middleware('permission_or:documentos.ver|ver_documentos|documentos.crear_borrador|expedientes.ver');
        Route::get('bajas-cambios', [ControlEscolarController::class, 'bajasCambios'])
            ->middleware('permission_or:expedientes.ver|expedientes.editar|ver_alumnos|alumnos.ver');
        Route::get('solicitudes', [ControlEscolarController::class, 'solicitudes'])
            ->middleware('permission_or:expedientes.ver|ver_solicitud_matricula|solicitudes_matricula.ver|documentos.ver|ver_documentos|inscripciones.ver|ver_alumnos|alumnos.ver');
        Route::get('observaciones', [ControlEscolarController::class, 'observaciones'])
            ->middleware('permission_or:observaciones.ver|documentos.ver|ver_documentos|expedientes.ver|ver_alumnos|alumnos.ver');
        Route::get('reportes', [ControlEscolarController::class, 'reportes'])
            ->middleware('permission_or:reportes.ver|exportar_reportes|expedientes.ver|ver_alumnos|alumnos.ver');
        Route::get('notificaciones', [ControlEscolarController::class, 'notificaciones'])
            ->middleware('permission:notificaciones.ver');
        Route::get('importaciones', [ControlEscolarController::class, 'importaciones'])
            ->middleware('permission_or:importaciones_academicas.ver|importar_calificaciones|calificaciones.ver|ver_alumnos|alumnos.ver');
>>>>>>> d926c721d87cf98b6a3f2798545c811d7a269764
    });

Route::get('v1/educacion-superior/metricas', EducacionSuperiorMetricasController::class)
    ->middleware('auth:sanctum');

Route::get('v1/educacion-superior/reportes-oficiales', EducacionSuperiorReportesController::class)
    ->middleware('auth:sanctum');

Route::prefix('v1/catalogos')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('sedes', [CatalogoCapturaController::class, 'sedes'])
            ->middleware('permission_or:ver_catalogos|catalogos.ver|dashboard.ver|sedes.ver');
    });

Route::prefix('v1/sices-legacy')
    ->middleware([
        'auth:sanctum',
        'permission_or:sices_legacy.consultar|sices_legacy.health|documentos.ver|expedientes.ver|integraciones.ver',
    ])
    ->group(function () {
        Route::get('health', [SicesLegacyConsultaController::class, 'health'])
            ->middleware('permission_or:sices_legacy.health|integraciones.ver');
        Route::get('alumnos/{alumno}/estado-sep', [SicesLegacyConsultaController::class, 'estadoSepAlumno']);
        Route::get('documentos/{documento}/estado-sep', [SicesLegacyConsultaController::class, 'estadoSepDocumento']);
        Route::get('certificados/por-curp/{curp}', [SicesLegacyConsultaController::class, 'porCurp']);
        Route::get('certificados/por-url-short/{urlShort}', [SicesLegacyConsultaController::class, 'porUrlShort']);
    });

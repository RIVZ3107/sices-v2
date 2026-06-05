<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BandejaDocumentoAcademicoController;
use App\Http\Controllers\Api\V1\Academico\ImportacionHistoricaMateriasController;
use App\Http\Controllers\Api\V1\Admin\MenuAdminController;
use App\Http\Controllers\Api\V1\Admin\RoleManagementController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\Certificacion\AlumnoCapturaController;
use App\Http\Controllers\Api\Catalogos\DocumentoAcademicoTipoController;
use App\Http\Controllers\Api\V1\Catalogos\CatalogosAcademicosController;
use App\Http\Controllers\Api\V1\Catalogos\CiclosEscolaresController;
use App\Http\Controllers\Api\V1\Certificacion\CatalogoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoAcademicoProcesoController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoCertificadoVistaController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoDecNormalController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoFirmaController;
use App\Http\Controllers\Api\V1\Certificacion\LegacyCertificadoTimbradoJsonController;
use App\Http\Controllers\Api\V1\Certificacion\SicesLegacyShadowExportController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoObservacionController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarExpedienteController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarReinscripcionController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarCalificacionController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarDocumentoController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarBajaCambioController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarTrayectoriaController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarIntegracionController;
use App\Http\Controllers\Api\Certificacion\ConsultaPublicaController;
use App\Http\Controllers\Api\V1\Certificacion\InscripcionPeriodoController;
use App\Http\Controllers\Api\V1\Certificacion\MateriaCursadaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\MatriculaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\SolicitudMatriculaController;
use App\Http\Controllers\Api\V1\Certificacion\TrayectoriaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\ValidacionNormativaImportacionLegacyController;
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

Route::prefix('v1/catalogos-academicos')
    ->middleware(['auth:sanctum', 'permission_or:ver_catalogos|catalogos.ver|catalogos.academicos.ver|dashboard.ver'])
    ->group(function () {
        Route::get('resumen', [CatalogosAcademicosController::class, 'resumen']);
        Route::get('filtros', [CatalogosAcademicosController::class, 'filtros']);
        Route::get('subsistemas', [CatalogosAcademicosController::class, 'subsistemas']);
        Route::get('municipios', [CatalogosAcademicosController::class, 'municipios']);
        Route::get('instituciones/{institucion}', [CatalogosAcademicosController::class, 'institucionDetalle'])->whereNumber('institucion');
        Route::get('instituciones/{institucion}/sedes', [CatalogosAcademicosController::class, 'institucionSedes'])->whereNumber('institucion');
        Route::get('instituciones/{institucion}/ofertas', [CatalogosAcademicosController::class, 'institucionOfertas'])->whereNumber('institucion');
        Route::get('sedes/{sede}/ofertas', [CatalogosAcademicosController::class, 'sedeOfertas'])->whereNumber('sede');
        Route::get('instituciones', [CatalogosAcademicosController::class, 'instituciones']);
        Route::get('sedes', [CatalogosAcademicosController::class, 'sedes']);
        Route::get('programas', [CatalogosAcademicosController::class, 'programas']);
        Route::get('planes', [CatalogosAcademicosController::class, 'planes']);
        Route::get('materias', [CatalogosAcademicosController::class, 'materias']);
        Route::get('ofertas-academicas', [CatalogosAcademicosController::class, 'ofertasAcademicas']);
        Route::get('planes/{plan}/materias', [CatalogosAcademicosController::class, 'planMaterias'])->whereNumber('plan');

        Route::middleware('permission_or:ciclos_escolares.ver|periodos_escolares.ver|catalogos.academicos.ver|catalogos.academicos.configurar|catalogos.configurar|ver_catalogos|catalogos.ver|dashboard.ver')->group(function () {
            Route::get('ciclos-escolares/resumen', [CiclosEscolaresController::class, 'resumen']);
            Route::get('ciclos-escolares', [CiclosEscolaresController::class, 'index']);
            Route::get('ciclos-escolares/{ciclo}', [CiclosEscolaresController::class, 'show'])->whereNumber('ciclo');
            Route::get('periodos-escolares', [CiclosEscolaresController::class, 'periodosIndex']);
            Route::get('ciclos-escolares/{ciclo}/periodos', [CiclosEscolaresController::class, 'periodosPorCiclo'])->whereNumber('ciclo');
        });

        Route::middleware('permission_or:ciclos_escolares.crear|periodos_escolares.crear|catalogos.academicos.configurar|catalogos.configurar|gestionar_catalogos')->group(function () {
            Route::post('ciclos-escolares', [CiclosEscolaresController::class, 'store']);
            Route::post('ciclos-escolares/{ciclo}/periodos', [CiclosEscolaresController::class, 'storePeriodo'])->whereNumber('ciclo');
        });

        Route::middleware('permission_or:ciclos_escolares.editar|periodos_escolares.editar|catalogos.academicos.configurar|catalogos.configurar|gestionar_catalogos')->group(function () {
            Route::put('ciclos-escolares/{ciclo}', [CiclosEscolaresController::class, 'update'])->whereNumber('ciclo');
            Route::patch('ciclos-escolares/{ciclo}/activar', [CiclosEscolaresController::class, 'activar'])->whereNumber('ciclo');
            Route::patch('ciclos-escolares/{ciclo}/marcar-actual', [CiclosEscolaresController::class, 'marcarActual'])->whereNumber('ciclo');
            Route::put('periodos-escolares/{periodo}', [CiclosEscolaresController::class, 'updatePeriodo'])->whereNumber('periodo');
            Route::patch('periodos-escolares/{periodo}/activar', [CiclosEscolaresController::class, 'activarPeriodo'])->whereNumber('periodo');
        });
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
        Route::post('documentos-academicos/{documento}/validar-informacion', [DocumentoAcademicoProcesoController::class, 'validarInformacion'])
            ->middleware('permission_or:certificacion.validar|validaciones_normativas.aprobar|documentos.observar');
        Route::post('documentos-academicos/{documento}/workflow/transicion', [DocumentoAcademicoProcesoController::class, 'aplicarTransicionWorkflow'])
            ->middleware('permission_or:ver_documentos|documentos.ver|enviar_revision|documentos.enviar_revision|certificacion.validar|aprobar_documentos|documentos.aprobar|certificacion.autorizar_emision|logs.ver|integraciones.ver');
        Route::post('documentos-academicos/{documento}/aprobar', [DocumentoAcademicoProcesoController::class, 'aprobar'])
            ->middleware('permission_or:aprobar_documentos|documentos.aprobar|documentos.aprobar_institucionalmente|validaciones_normativas.aprobar|certificacion.autorizar_emision|certificacion.validar');
        Route::post('documentos-academicos/{documento}/rechazar', [DocumentoAcademicoProcesoController::class, 'rechazar'])
            ->middleware('permission_or:rechazar_documentos|documentos.rechazar|documentos.rechazar_institucionalmente|validaciones_normativas.rechazar|certificacion.validar|documentos.observar');
        Route::post('documentos-academicos/{documento}/folio-interno', [DocumentoAcademicoProcesoController::class, 'asignarFolioInterno'])
            ->middleware('permission_or:preparar_documento_firma|folios.asignar|documentos.liberar_proceso_tecnico|certificacion.autorizar_emision');
        Route::post('documentos-academicos/{documento}/token-consulta-publica', [DocumentoAcademicoProcesoController::class, 'emitirTokenConsultaPublica'])
            ->middleware('permission_or:consulta_publica.emitir_token|consulta_publica.configurar|preparar_documento_firma|documentos.liberar_proceso_tecnico|certificacion.autorizar_emision');
        Route::post('documentos-academicos/{documento}/listo-para-firma', [DocumentoAcademicoProcesoController::class, 'marcarListoParaFirma'])
            ->middleware('permission_or:documentos.liberar_proceso_tecnico|preparar_documento_firma|certificacion.enviar_a_proceso_tecnico');
        Route::get('firma/config', [DocumentoFirmaController::class, 'config'])
            ->middleware('permission_or:firma.ejecutar|firma.ver|firma.preflight|sistemas.integraciones.ver');
        Route::post('documentos-academicos/{documento}/firma/ejecutar', [DocumentoFirmaController::class, 'ejecutar'])
            ->middleware('permission:firma.ejecutar');
        Route::get('documentos-academicos/{documento}/certificado-vista-json', [DocumentoCertificadoVistaController::class, 'show'])
            ->middleware('permission_or:pdf.ver|pdf.generar|firma.ejecutar|documentos.ver|ver_documentos');
        Route::post('documentos-academicos/{documento}/dec-normal/payload', [DocumentoDecNormalController::class, 'generarPayload'])
            ->middleware('permission_or:generar_cadena|cadena_original.generar|ver_documentos|documentos.ver');
        Route::post('documentos-academicos/{documento}/dec-normal/cadena', [DocumentoDecNormalController::class, 'generarCadena'])
            ->middleware('permission_or:generar_cadena|cadena_original.generar');
        Route::post('documentos-academicos/{documento}/dec-normal/xml', [DocumentoDecNormalController::class, 'generarXml'])
            ->middleware('permission_or:generar_xml|xml.generar');
        Route::post('documentos-academicos/{documento}/dec-normal/validar-xml', [DocumentoDecNormalController::class, 'validarXml'])
            ->middleware('permission_or:generar_xml|xml.generar|xml.validar');
        Route::post('documentos-academicos/{documento}/dec-normal/preflight', [DocumentoDecNormalController::class, 'preflight'])
            ->middleware('permission_or:xml.validar|firma.preflight|firma.ejecutar|integraciones.ver|sistemas.integraciones.ver');
        Route::get('documentos-academicos/{documento}/dec-normal/errores', [DocumentoDecNormalController::class, 'errores'])
            ->middleware('permission_or:ver_xml|xml.ver|generar_xml|xml.generar');
        Route::get('documentos-academicos/{documento}/legacy-timbrado-json', [LegacyCertificadoTimbradoJsonController::class, 'show'])
            ->middleware('permission_or:sices_legacy.exportar|sistemas.integraciones.ver|firma.preflight|firma.ejecutar|cadena_original.generar');
        Route::post('documentos-academicos/{documento}/sices-legacy/shadow-export', [SicesLegacyShadowExportController::class, 'exportar'])
            ->middleware('permission_or:sices_legacy.exportar|sistemas.integraciones.ver|firma.preflight');
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
                Route::get('/{bandeja}', [BandejaDocumentoAcademicoController::class, 'resolverDinamico'])
                    ->where('bandeja', '[a-z0-9\-]+');
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
        Route::get('alumnos/resumen', [ControlEscolarController::class, 'alumnosResumen'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('alumnos/recientes', [ControlEscolarController::class, 'alumnosRecientes'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('alumnos/exportar', [ControlEscolarController::class, 'alumnosExportar'])
            ->middleware('permission_or:alumnos.exportar|reportes.ver|exportar_reportes|ver_alumnos|alumnos.ver');
        Route::post('alumnos/importar-csv', [ControlEscolarController::class, 'alumnosImportar'])
            ->middleware('permission_or:alumnos.importar|importaciones_academicas.importar|control_escolar.importar|gestionar_alumnos');
        Route::post('alumnos', [ControlEscolarController::class, 'alumnosStore'])
            ->middleware('permission_or:gestionar_alumnos|alumnos.crear|expedientes.crear');
        Route::get('alumnos', [ControlEscolarController::class, 'alumnos'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('expedientes/exportar', [ControlEscolarExpedienteController::class, 'exportar'])
            ->middleware('permission_or:expedientes.exportar|reportes.ver|exportar_reportes|expedientes.ver');
        Route::get('expedientes/resumen', [ControlEscolarExpedienteController::class, 'resumen'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('expedientes/documentos-requeridos', [ControlEscolarExpedienteController::class, 'documentosRequeridos'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('expedientes/actividad-reciente', [ControlEscolarExpedienteController::class, 'actividadReciente'])
            ->middleware('permission_or:expedientes.actividad.ver|expedientes.ver|ver_alumnos');
        Route::post('expedientes/validar-masivo', [ControlEscolarExpedienteController::class, 'validarMasivo'])
            ->middleware('permission_or:expedientes.validacion.masiva|expedientes.validar|expedientes.editar');
        Route::post('expedientes/observar-masivo', [ControlEscolarExpedienteController::class, 'observarMasivo'])
            ->middleware('permission_or:expedientes.observacion.masiva|expedientes.observar|observaciones.crear');
        Route::post('expedientes', [ControlEscolarExpedienteController::class, 'store'])
            ->middleware('permission_or:expedientes.crear|gestionar_alumnos');
        Route::post('expedientes/{alumno}/documentos', [ControlEscolarExpedienteController::class, 'cargarDocumento'])
            ->whereNumber('alumno')
            ->middleware('permission_or:expedientes.documentos.cargar|documentos.crear_borrador|documentos.crear');
        Route::post('expedientes/{alumno}/validar', [ControlEscolarExpedienteController::class, 'validar'])
            ->whereNumber('alumno')
            ->middleware('permission_or:expedientes.validar|expedientes.editar|expedientes.revisar');
        Route::post('expedientes/{alumno}/observar', [ControlEscolarExpedienteController::class, 'observar'])
            ->whereNumber('alumno')
            ->middleware('permission_or:expedientes.observar|observaciones.crear|documentos.observar');
        Route::get('expedientes', [ControlEscolarExpedienteController::class, 'index'])
            ->middleware('permission_or:ver_alumnos|alumnos.ver|expedientes.ver');
        Route::get('inscripciones', [ControlEscolarController::class, 'inscripciones'])
            ->middleware('permission_or:inscripciones.ver|gestionar_inscripciones_periodo|ver_alumnos|alumnos.ver');
        Route::get('reinscripciones/exportar', [ControlEscolarReinscripcionController::class, 'exportar'])
            ->middleware('permission_or:reinscripciones.exportar|reportes.ver|exportar_reportes');
        Route::get('reinscripciones/elegibles', [ControlEscolarReinscripcionController::class, 'elegibles'])
            ->middleware('permission_or:reinscripciones.ver|reinscripciones.crear|ver_alumnos|alumnos.ver');
        Route::get('reinscripciones/flujo', [ControlEscolarReinscripcionController::class, 'flujo'])
            ->middleware('permission_or:reinscripciones.ver|ver_alumnos|alumnos.ver');
        Route::get('reinscripciones/motivos-bloqueo', [ControlEscolarReinscripcionController::class, 'motivosBloqueo'])
            ->middleware('permission_or:reinscripciones.ver|ver_alumnos|alumnos.ver');
        Route::get('reinscripciones/resumen', [ControlEscolarReinscripcionController::class, 'resumen'])
            ->middleware('permission_or:reinscripciones.ver|ver_alumnos|alumnos.ver');
        Route::post('reinscripciones/desbloquear-masivo', [ControlEscolarReinscripcionController::class, 'desbloquearMasivo'])
            ->middleware('permission_or:reinscripciones.desbloqueo.masivo|reinscripciones.desbloquear');
        Route::post('reinscripciones/completar-masivo', [ControlEscolarReinscripcionController::class, 'completarMasivo'])
            ->middleware('permission_or:reinscripciones.completar.masivo|reinscripciones.completar');
        Route::post('reinscripciones', [ControlEscolarReinscripcionController::class, 'store'])
            ->middleware('permission_or:reinscripciones.crear|reinscripciones.editar');
        Route::post('reinscripciones/{reinscripcion}/desbloquear', [ControlEscolarReinscripcionController::class, 'desbloquear'])
            ->whereNumber('reinscripcion')
            ->middleware('permission_or:reinscripciones.desbloquear|reinscripciones.autorizar_excepcion');
        Route::post('reinscripciones/{reinscripcion}/completar', [ControlEscolarReinscripcionController::class, 'completar'])
            ->whereNumber('reinscripcion')
            ->middleware('permission_or:reinscripciones.completar');
        Route::post('reinscripciones/{reinscripcion}/observar', [ControlEscolarReinscripcionController::class, 'observar'])
            ->whereNumber('reinscripcion')
            ->middleware('permission_or:reinscripciones.observar');
        Route::post('reinscripciones/{reinscripcion}/cancelar', [ControlEscolarReinscripcionController::class, 'cancelar'])
            ->whereNumber('reinscripcion')
            ->middleware('permission_or:reinscripciones.cancelar');
        Route::get('reinscripciones/{reinscripcion}/ficha', [ControlEscolarReinscripcionController::class, 'ficha'])
            ->whereNumber('reinscripcion')
            ->middleware('permission_or:reinscripciones.ficha.generar|reinscripciones.ficha.descargar|reinscripciones.completar');
        Route::get('reinscripciones', [ControlEscolarReinscripcionController::class, 'index'])
            ->middleware('permission_or:reinscripciones.ver|reinscripciones.revisar|reinscripciones.crear|ver_alumnos|alumnos.ver');
        Route::prefix('trayectoria')->group(function (): void {
            Route::get('alumnos/buscar', [ControlEscolarTrayectoriaController::class, 'buscar'])
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias|alumnos.ver|ver_alumnos');
            Route::get('alumnos/{alumno}/exportar', [ControlEscolarTrayectoriaController::class, 'exportar'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.exportar|trayectoria.ver|kardex.exportar|exportar_reportes');
            Route::get('alumnos/{alumno}/constancia', [ControlEscolarTrayectoriaController::class, 'constancia'])
                ->whereNumber('alumno')
                ->middleware('permission_or:constancias.generar|trayectoria.ver');
            Route::get('alumnos/{alumno}/kardex/pdf', [ControlEscolarTrayectoriaController::class, 'kardexPdf'])
                ->whereNumber('alumno')
                ->middleware('permission_or:kardex.exportar|trayectoria.exportar|kardex.ver|trayectoria.ver');
            Route::get('alumnos/{alumno}/actividad-reciente', [ControlEscolarTrayectoriaController::class, 'actividad'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias|alumnos.ver');
            Route::get('alumnos/{alumno}/equivalencias', [ControlEscolarTrayectoriaController::class, 'equivalencias'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias');
            Route::get('alumnos/{alumno}/estadisticas', [ControlEscolarTrayectoriaController::class, 'estadisticas'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|reportes.ver|kardex.ver');
            Route::get('alumnos/{alumno}/historial-periodos', [ControlEscolarTrayectoriaController::class, 'historialPeriodos'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|kardex.ver|ver_trayectorias');
            Route::get('alumnos/{alumno}/plan-estudios', [ControlEscolarTrayectoriaController::class, 'planEstudios'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|materias.ver|ver_materias');
            Route::get('alumnos/{alumno}/kardex', [ControlEscolarTrayectoriaController::class, 'kardex'])
                ->whereNumber('alumno')
                ->middleware('permission_or:kardex.ver|trayectoria.ver|alumnos.kardex.ver|ver_trayectorias');
            Route::get('alumnos/{alumno}/ultimo-periodo', [ControlEscolarTrayectoriaController::class, 'ultimoPeriodo'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias|alumnos.ver');
            Route::get('alumnos/{alumno}/resumen', [ControlEscolarTrayectoriaController::class, 'resumen'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias|alumnos.ver');
            Route::get('alumnos/{alumno}', [ControlEscolarTrayectoriaController::class, 'show'])
                ->whereNumber('alumno')
                ->middleware('permission_or:trayectoria.ver|ver_trayectorias|kardex.ver|alumnos.ver');
        });
        Route::get('trayectoria', [ControlEscolarController::class, 'trayectoria'])
            ->middleware('permission_or:trayectoria.ver|ver_trayectorias|kardex.ver|ver_alumnos|alumnos.ver');
        Route::get('calificaciones/exportar', [ControlEscolarCalificacionController::class, 'exportar'])
            ->middleware('permission_or:calificaciones.exportar|calificaciones.ver');
        Route::get('calificaciones/plantilla', [ControlEscolarCalificacionController::class, 'plantilla'])
            ->middleware('permission_or:calificaciones.importar|calificaciones.plantilla.descargar|importaciones_academicas.importar');
        Route::post('calificaciones/importar', [ControlEscolarCalificacionController::class, 'importar'])
            ->middleware('permission_or:calificaciones.importar|importaciones_academicas.importar');
        Route::get('calificaciones/historial', [ControlEscolarCalificacionController::class, 'historial'])
            ->middleware('permission_or:calificaciones.historial.ver|calificaciones.ver');
        Route::get('calificaciones/fechas-importantes', [ControlEscolarCalificacionController::class, 'fechasImportantes'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar');
        Route::get('calificaciones/pendientes-atencion', [ControlEscolarCalificacionController::class, 'pendientesAtencion'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar');
        Route::get('calificaciones/avance', [ControlEscolarCalificacionController::class, 'avance'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar');
        Route::get('calificaciones/resumen', [ControlEscolarCalificacionController::class, 'resumen'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar|alumnos.ver');
        Route::post('calificaciones/{calificacion}/solicitar-correccion', [ControlEscolarCalificacionController::class, 'solicitarCorreccion'])
            ->whereNumber('calificacion')
            ->middleware('permission_or:calificaciones.correccion.solicitar|calificaciones.capturar');
        Route::get('calificaciones/{grupoMateria}/exportar', [ControlEscolarCalificacionController::class, 'exportarGrupo'])
            ->middleware('permission_or:calificaciones.exportar|calificaciones.ver');
        Route::post('calificaciones/{grupoMateria}/cerrar-captura', [ControlEscolarCalificacionController::class, 'cerrarCaptura'])
            ->middleware('permission_or:calificaciones.cerrar_captura|calificaciones.cerrar');
        Route::post('calificaciones/{grupoMateria}/capturar', [ControlEscolarCalificacionController::class, 'capturar'])
            ->middleware('permission_or:calificaciones.capturar|calificaciones.editar');
        Route::get('calificaciones/{grupoMateria}/alumnos', [ControlEscolarCalificacionController::class, 'alumnos'])
            ->middleware('permission_or:calificaciones.capturar|calificaciones.ver|calificaciones.editar');
        Route::get('calificaciones/{grupoMateria}', [ControlEscolarCalificacionController::class, 'show'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar');
        Route::get('calificaciones', [ControlEscolarCalificacionController::class, 'index'])
            ->middleware('permission_or:calificaciones.ver|calificaciones.capturar|calificaciones.revisar|ver_alumnos|alumnos.ver');
        Route::get('documentos/exportar', [ControlEscolarDocumentoController::class, 'exportar'])
            ->middleware('permission_or:documentos.exportar|documentos.ver');
        Route::get('documentos/tipos-autorizados', [ControlEscolarDocumentoController::class, 'tiposAutorizados'])
            ->middleware('permission_or:documentos.tipos.ver|documentos.ver|documentos.crear|documentos.crear_borrador');
        Route::get('documentos/pendientes-atencion', [ControlEscolarDocumentoController::class, 'pendientesAtencion'])
            ->middleware('permission_or:documentos.pendientes.ver|documentos.ver');
        Route::get('documentos/fechas-importantes', [ControlEscolarDocumentoController::class, 'fechasImportantes'])
            ->middleware('permission_or:documentos.ver|documentos.crear_borrador');
        Route::get('documentos/resumen', [ControlEscolarDocumentoController::class, 'resumen'])
            ->middleware('permission_or:documentos.ver|ver_documentos|documentos.crear_borrador|expedientes.ver');
        Route::get('documentos/{documento}/acuse', [ControlEscolarDocumentoController::class, 'acuse'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.acuse.descargar|documentos.ver');
        Route::get('documentos/{documento}/descargar', [ControlEscolarDocumentoController::class, 'descargar'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.descargar|expedientes.documentos.descargar|documentos.ver');
        Route::post('documentos/{documento}/cancelar', [ControlEscolarDocumentoController::class, 'cancelar'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.cancelar|rechazar_documentos');
        Route::post('documentos/{documento}/atender-observacion', [ControlEscolarDocumentoController::class, 'atenderObservacion'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.observaciones.atender|observaciones.atender|editar_documentos');
        Route::post('documentos/{documento}/enviar-validacion', [ControlEscolarDocumentoController::class, 'enviarValidacion'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.enviar_validacion|documentos.enviar_revision|enviar_revision');
        Route::put('documentos/{documento}', [ControlEscolarDocumentoController::class, 'update'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.editar|editar_documentos');
        Route::post('documentos', [ControlEscolarDocumentoController::class, 'store'])
            ->middleware('permission_or:documentos.crear|documentos.crear_borrador|crear_documentos');
        Route::get('documentos/{documento}', [ControlEscolarDocumentoController::class, 'show'])
            ->whereNumber('documento')
            ->middleware('permission_or:documentos.ver|ver_documentos|documentos.crear_borrador|expedientes.ver');
        Route::get('documentos', [ControlEscolarDocumentoController::class, 'index'])
            ->middleware('permission_or:documentos.ver|ver_documentos|documentos.crear_borrador|expedientes.ver');
        Route::get('bajas-cambios/exportar', [ControlEscolarBajaCambioController::class, 'exportar'])
            ->middleware('permission_or:bajas_cambios.exportar|bajas_cambios.ver');
        Route::post('bajas-cambios/aprobar-masivo', [ControlEscolarBajaCambioController::class, 'aprobarMasivo'])
            ->middleware('permission_or:bajas_cambios.aprobar_masivo|bajas_cambios.aprobar');
        Route::post('bajas-cambios/rechazar-masivo', [ControlEscolarBajaCambioController::class, 'rechazarMasivo'])
            ->middleware('permission_or:bajas_cambios.rechazar_masivo|bajas_cambios.rechazar');
        Route::get('bajas-cambios/flujo', [ControlEscolarBajaCambioController::class, 'flujo'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios/riesgo-operativo', [ControlEscolarBajaCambioController::class, 'riesgoOperativo'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios/motivos-frecuentes', [ControlEscolarBajaCambioController::class, 'motivosFrecuentes'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios/cambios-recientes', [ControlEscolarBajaCambioController::class, 'cambiosRecientes'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios/resumen', [ControlEscolarBajaCambioController::class, 'resumen'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios/{solicitud}/dictamen', [ControlEscolarBajaCambioController::class, 'dictamen'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.dictamen.generar|bajas_cambios.dictamen.descargar');
        Route::post('bajas-cambios/{solicitud}/aplicar', [ControlEscolarBajaCambioController::class, 'aplicar'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.aplicar');
        Route::post('bajas-cambios/{solicitud}/observar', [ControlEscolarBajaCambioController::class, 'observar'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.observar');
        Route::post('bajas-cambios/{solicitud}/rechazar', [ControlEscolarBajaCambioController::class, 'rechazar'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.rechazar');
        Route::post('bajas-cambios/{solicitud}/aprobar', [ControlEscolarBajaCambioController::class, 'aprobar'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.aprobar');
        Route::post('bajas-cambios/{solicitud}/revisar', [ControlEscolarBajaCambioController::class, 'revisar'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.revisar');
        Route::put('bajas-cambios/{solicitud}', [ControlEscolarBajaCambioController::class, 'update'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.editar');
        Route::post('bajas-cambios', [ControlEscolarBajaCambioController::class, 'store'])
            ->middleware('permission_or:bajas_cambios.crear');
        Route::get('bajas-cambios/{solicitud}', [ControlEscolarBajaCambioController::class, 'show'])
            ->whereNumber('solicitud')
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|alumnos.ver');
        Route::get('bajas-cambios', [ControlEscolarBajaCambioController::class, 'index'])
            ->middleware('permission_or:bajas_cambios.ver|expedientes.ver|expedientes.editar|alumnos.ver');
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

        Route::middleware('permission_or:ver_catalogos|catalogos.ver|certificacion.ver|documentos.ver|documentos.crear|crear_documentos|documentos.crear_borrador|dashboard.ver')->group(function () {
            Route::get('documentos-academicos/tipos', [DocumentoAcademicoTipoController::class, 'index']);
            Route::get('documentos-academicos/tipos/{tipo}', [DocumentoAcademicoTipoController::class, 'show']);
        });
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

<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BandejaDocumentoAcademicoController;
use App\Http\Controllers\Api\V1\Admin\RoleManagementController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\Academico\ImportacionHistoricaMateriasController;
use App\Http\Controllers\Api\V1\Certificacion\AlumnoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\CatalogoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\ValidacionNormativaImportacionLegacyController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoAcademicoProcesoController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoDecNormalController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoObservacionController;
use App\Http\Controllers\Api\V1\Certificacion\InscripcionPeriodoController;
use App\Http\Controllers\Api\V1\Certificacion\MateriaCursadaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\MatriculaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\TrayectoriaCapturaController;
use App\Http\Controllers\Api\V1\ControlEscolar\ControlEscolarController;
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
        Route::middleware('permission:ver_catalogos')->group(function () {
            Route::get('catalogos/ciclos-escolares', [CatalogoCapturaController::class, 'ciclosEscolares']);
            Route::get('catalogos/subsistemas', [CatalogoCapturaController::class, 'subsistemas']);
            Route::get('catalogos/regiones', [CatalogoCapturaController::class, 'regiones']);
            Route::get('catalogos/instituciones', [CatalogoCapturaController::class, 'instituciones']);
            Route::get('catalogos/sedes', [CatalogoCapturaController::class, 'sedes']);
            Route::get('catalogos/ofertas-academicas', [CatalogoCapturaController::class, 'ofertasAcademicas']);
        });

        Route::get('alumnos', [AlumnoCapturaController::class, 'index'])
            ->middleware('permission:ver_alumnos');
        Route::post('alumnos', [AlumnoCapturaController::class, 'store'])
            ->middleware('permission:gestionar_alumnos');
        Route::get('alumnos', [AlumnoCapturaController::class, 'index'])
            ->middleware('permission:ver_alumnos');
        Route::get('alumnos/{alumno}', [AlumnoCapturaController::class, 'show'])
            ->middleware('permission:ver_alumnos');
        Route::put('alumnos/{alumno}', [AlumnoCapturaController::class, 'update'])
            ->middleware('permission:gestionar_alumnos');
        Route::get('alumnos/{alumno}/resumen-institucional', [AlumnoCapturaController::class, 'resumenInstitucional'])
            ->middleware('permission:ver_alumnos');

        Route::post('matriculas', [MatriculaCapturaController::class, 'store'])
            ->middleware('permission:gestionar_matriculas');
        Route::get('matriculas/{matricula}', [MatriculaCapturaController::class, 'show'])
            ->middleware('permission:ver_matriculas');
        Route::get('matriculas/{matricula}/trayectoria-academica', [TrayectoriaCapturaController::class, 'showPorMatricula'])
            ->middleware('permission:ver_trayectorias');
        Route::post(
            'matriculas/{matricula}/trayectoria-academica/recalcular',
            [TrayectoriaCapturaController::class, 'recalcularPorMatricula'],
        )->middleware('permission:gestionar_trayectorias');

        Route::post('materias-cursadas', [MateriaCursadaCapturaController::class, 'store'])
            ->middleware('permission:gestionar_materias');
        Route::post('inscripciones-periodo', [InscripcionPeriodoController::class, 'store'])
            ->middleware('permission:gestionar_matriculas');

        Route::put('trayectorias-academicas', [TrayectoriaCapturaController::class, 'upsert'])
            ->middleware('permission:gestionar_trayectorias');

        Route::post('documentos-academicos', [DocumentoAcademicoProcesoController::class, 'store']);
        Route::get('documentos-academicos/{documento}', [DocumentoAcademicoProcesoController::class, 'show']);
        Route::post('documentos-academicos/{documento}/validar', [DocumentoAcademicoProcesoController::class, 'validar']);
        Route::post('documentos-academicos/{documento}/pasar-pendiente', [DocumentoAcademicoProcesoController::class, 'pasarPendiente']);
        Route::post('documentos-academicos/{documento}/enviar-revision', [DocumentoAcademicoProcesoController::class, 'enviarRevision']);
        Route::post('documentos-academicos/{documento}/aprobar', [DocumentoAcademicoProcesoController::class, 'aprobar']);
        Route::post('documentos-academicos/{documento}/rechazar', [DocumentoAcademicoProcesoController::class, 'rechazar']);
        Route::post('documentos-academicos/{documento}/folio-interno', [DocumentoAcademicoProcesoController::class, 'asignarFolioInterno']);
        Route::post('documentos-academicos/{documento}/token-consulta-publica', [DocumentoAcademicoProcesoController::class, 'emitirTokenConsultaPublica']);
        Route::post('documentos-academicos/{documento}/listo-para-firma', [DocumentoAcademicoProcesoController::class, 'marcarListoParaFirma']);
        Route::post('documentos-academicos/{documento}/dec-normal/payload', [DocumentoDecNormalController::class, 'generarPayload']);
        Route::post('documentos-academicos/{documento}/dec-normal/cadena', [DocumentoDecNormalController::class, 'generarCadena']);
        Route::post('documentos-academicos/{documento}/dec-normal/xml', [DocumentoDecNormalController::class, 'generarXml']);
        Route::post('documentos-academicos/{documento}/dec-normal/validar-xml', [DocumentoDecNormalController::class, 'validarXml']);
        Route::get('documentos-academicos/{documento}/dec-normal/errores', [DocumentoDecNormalController::class, 'errores']);
        Route::get('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'index'])
            ->middleware('permission:ver_documentos');
        Route::post('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'store'])
            ->middleware('permission:rechazar_documentos');
        Route::post('documentos-academicos/{documento}/observaciones/{observacion}/atender', [DocumentoObservacionController::class, 'atender'])
            ->middleware('permission:editar_documentos');
        Route::post('documentos-academicos/{documento}/devolver-correccion', [DocumentoObservacionController::class, 'devolver'])
            ->middleware('permission:rechazar_documentos');

        Route::get(
            'matriculas-legacy-normativa/pendientes',
            [ValidacionNormativaImportacionLegacyController::class, 'index']
        )->middleware('permission:revisar_importacion_legacy_normativa');
        Route::get(
            'matriculas-legacy-normativa/{matricula}',
            [ValidacionNormativaImportacionLegacyController::class, 'show']
        )->middleware('permission:revisar_importacion_legacy_normativa');
        Route::post(
            'matriculas-legacy-normativa/{matricula}/aprobar-validacion-normativa',
            [ValidacionNormativaImportacionLegacyController::class, 'aprobar']
        )->middleware('permission:aprobar_importacion_legacy_normativa');
        Route::post(
            'matriculas-legacy-normativa/{matricula}/rechazar-validacion-normativa',
            [ValidacionNormativaImportacionLegacyController::class, 'rechazar']
        )->middleware('permission:rechazar_importacion_legacy_normativa');

        Route::prefix('bandejas/documentos-academicos')
            ->middleware('permission:ver_documentos')
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
            ->middleware('permission:ver_catalogos');
        Route::get('usuarios', [UserManagementController::class, 'index'])
            ->middleware('permission:ver_catalogos');
        Route::post('usuarios', [UserManagementController::class, 'store'])
            ->middleware('permission:gestionar_catalogos');
        Route::put('usuarios/{user}', [UserManagementController::class, 'update'])
            ->middleware('permission:gestionar_catalogos');
    });

Route::prefix('v1/control-escolar')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('dashboard', [ControlEscolarController::class, 'dashboard'])
            ->middleware('permission:ver_documentos');
        Route::get('expedientes', [ControlEscolarController::class, 'expedientes'])
            ->middleware('permission:ver_alumnos');
    });

Route::prefix('v1/catalogos')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('sedes', [CatalogoCapturaController::class, 'sedes'])
            ->middleware('permission:ver_catalogos');
    });

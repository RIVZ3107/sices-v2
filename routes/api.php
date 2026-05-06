<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BandejaDocumentoAcademicoController;
use App\Http\Controllers\Api\V1\Admin\RoleManagementController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\Certificacion\AlumnoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\CatalogoCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoAcademicoProcesoController;
use App\Http\Controllers\Api\V1\Certificacion\DocumentoObservacionController;
use App\Http\Controllers\Api\V1\Certificacion\MateriaCursadaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\MatriculaCapturaController;
use App\Http\Controllers\Api\V1\Certificacion\TrayectoriaCapturaController;
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

Route::prefix('v1/certificacion')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::middleware('permission:ver_catalogos')->group(function () {
            Route::get('catalogos/ciclos-escolares', [CatalogoCapturaController::class, 'ciclosEscolares']);
            Route::get('catalogos/subsistemas', [CatalogoCapturaController::class, 'subsistemas']);
            Route::get('catalogos/regiones', [CatalogoCapturaController::class, 'regiones']);
            Route::get('catalogos/instituciones', [CatalogoCapturaController::class, 'instituciones']);
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

        Route::post('matriculas', [MatriculaCapturaController::class, 'store'])
            ->middleware('permission:gestionar_matriculas');
        Route::get('matriculas/{matricula}', [MatriculaCapturaController::class, 'show'])
            ->middleware('permission:ver_matriculas');

        Route::post('materias-cursadas', [MateriaCursadaCapturaController::class, 'store'])
            ->middleware('permission:gestionar_materias');

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
        Route::get('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'index'])
            ->middleware('permission:ver_documentos');
        Route::post('documentos-academicos/{documento}/observaciones', [DocumentoObservacionController::class, 'store'])
            ->middleware('permission:rechazar_documentos');
        Route::post('documentos-academicos/{documento}/observaciones/{observacion}/atender', [DocumentoObservacionController::class, 'atender'])
            ->middleware('permission:editar_documentos');
        Route::post('documentos-academicos/{documento}/devolver-correccion', [DocumentoObservacionController::class, 'devolver'])
            ->middleware('permission:rechazar_documentos');

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

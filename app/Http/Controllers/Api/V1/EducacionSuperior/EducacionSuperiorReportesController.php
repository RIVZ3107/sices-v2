<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\EducacionSuperior;

use App\Http\Controllers\Controller;
use App\Services\EducacionSuperior\EducacionSuperiorReportesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducacionSuperiorReportesController extends Controller
{
    public function __invoke(Request $request, EducacionSuperiorReportesService $service): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])
            || $user->can('reportes_oficiales.ver')
            || $user->can('reportes.ver')
            || $user->can('exportar_reportes'),
            403
        );

        return response()->json([
            'ok' => true,
            'data' => $service->build($user),
        ]);
    }
}

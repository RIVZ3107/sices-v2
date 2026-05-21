<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\EducacionSuperior;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\EducacionSuperiorMetricasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducacionSuperiorMetricasController extends Controller
{
    public function __invoke(Request $request, EducacionSuperiorMetricasService $service): JsonResponse
    {
        return response()->json([
            'data' => $service->build($request->user()),
        ]);
    }
}

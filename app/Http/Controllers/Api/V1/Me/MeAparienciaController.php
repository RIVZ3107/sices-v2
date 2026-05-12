<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Me;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Sistema\ConfiguracionVisualSistemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeAparienciaController extends Controller
{
    public function __invoke(Request $request, ConfiguracionVisualSistemaService $service): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $service->dtoPublico(),
            'meta' => ['usuario' => $user->id],
        ]);
    }
}

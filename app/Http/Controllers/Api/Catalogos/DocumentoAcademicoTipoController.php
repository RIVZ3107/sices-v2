<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Catalogos;

use App\Http\Controllers\Controller;
use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentoAcademicoTipoController extends Controller
{
    public function __construct(
        protected DocumentoAcademicoTipoService $tipos,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $subsistema = $request->query('subsistema');
        $items = $this->tipos->listar(is_string($subsistema) ? $subsistema : null);

        return response()->json([
            'data' => $items,
            'meta' => [
                'subsistema' => $subsistema,
                'total' => count($items),
            ],
        ]);
    }

    public function show(string $tipo, Request $request): JsonResponse
    {
        $subsistema = $request->query('subsistema');
        $item = $this->tipos->obtener($tipo, is_string($subsistema) ? $subsistema : null);

        if ($item === null) {
            return response()->json([
                'message' => 'Tipo documental no encontrado o no permitido para el subsistema indicado.',
            ], 404);
        }

        return response()->json(['data' => $item]);
    }
}

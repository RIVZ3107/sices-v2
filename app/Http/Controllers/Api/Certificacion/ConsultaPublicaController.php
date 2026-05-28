<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Models\UrlShortToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultaPublicaController extends Controller
{
    /**
     * Consulta pública por token (sin autenticación).
     */
    public function showByToken(string $token): JsonResponse
    {
        $registro = UrlShortToken::query()
            ->where('token', $token)
            ->where('estado', 'activo')
            ->first();

        if ($registro === null) {
            return response()->json(['message' => 'Token no válido o revocado.'], 404);
        }

        if ($registro->expires_at !== null && $registro->expires_at->isPast()) {
            return response()->json(['message' => 'Token expirado.'], 410);
        }

        $documento = DocumentoAcademico::query()
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido'])
            ->find($registro->documento_academico_id);

        if ($documento === null) {
            return response()->json(['message' => 'Documento no encontrado.'], 404);
        }

        if ($documento->estado_firma !== EstadoFirma::FIRMADO->value) {
            return response()->json(['message' => 'El documento aún no está disponible en consulta pública.'], 403);
        }

        return response()->json([
            'data' => [
                'folio_interno' => $documento->folio_interno,
                'folio_digital_sep' => $documento->folio_digital_sep,
                'tipo_documento' => $documento->tipo_documento,
                'fecha_firma' => $documento->fecha_firma?->toIso8601String(),
                'alumno' => [
                    'nombre' => trim(implode(' ', array_filter([
                        $documento->alumno?->nombre,
                        $documento->alumno?->primer_apellido,
                        $documento->alumno?->segundo_apellido,
                    ]))),
                ],
                'verificacion' => [
                    'disponible' => true,
                    'folio_digital_sep' => $documento->folio_digital_sep,
                ],
            ],
        ]);
    }

    /**
     * Emisión de token (autenticado; delega validación al proceso documental).
     */
    public function emitirToken(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        abort(403, 'Use POST /api/v1/certificacion/documentos-academicos/{documento}/token-consulta-publica');
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoEstadoHistorial;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DocumentoEstadoService
{
    /** @var array<string, class-string<\BackedEnum>> */
    private const CAMPOS_ENUM = [
        'estado_workflow' => EstadoWorkflow::class,
        'estado_cadena' => EstadoCadena::class,
        'estado_xml' => EstadoXml::class,
        'estado_firma' => EstadoFirma::class,
        'estado_pdf' => EstadoPdf::class,
    ];

    public function cambiarEstado(
        DocumentoAcademico $documento,
        string $campo,
        string $estadoNuevo,
        ?int $usuarioId = null,
        ?string $motivo = null,
        array $metadata = [],
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        if (! isset(self::CAMPOS_ENUM[$campo])) {
            throw new InvalidArgumentException("Campo de estado no soportado: {$campo}");
        }

        $enumClass = self::CAMPOS_ENUM[$campo];
        $caso = $enumClass::tryFrom($estadoNuevo);
        if ($caso === null) {
            throw new InvalidArgumentException("Valor de estado inválido para {$campo}: {$estadoNuevo}");
        }

        return DB::transaction(function () use ($documento, $campo, $estadoNuevo, $usuarioId, $motivo, $metadata, $ip, $userAgent) {
            $documento->refresh();
            $valorAnterior = $documento->getAttribute($campo);
            $anteriorStr = $valorAnterior !== null ? (string) $valorAnterior : null;

            DocumentoEstadoHistorial::query()->create([
                'documento_academico_id' => $documento->id,
                'campo' => $campo,
                'estado_anterior' => $anteriorStr,
                'estado_nuevo' => $estadoNuevo,
                'motivo' => $motivo,
                'changed_by' => $usuarioId,
                'ip' => $ip,
                'user_agent' => $userAgent,
                'metadata' => array_merge($metadata, [
                    'fuente' => 'DocumentoEstadoService',
                ]),
            ]);

            $documento->forceFill([$campo => $estadoNuevo])->save();

            return $documento->refresh();
        });
    }
}

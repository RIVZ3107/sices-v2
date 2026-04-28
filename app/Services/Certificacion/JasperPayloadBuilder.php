<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Exceptions\Certificacion\PlantillaDocumentoPdfNoEncontradaException;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\PlantillaDocumento;
use InvalidArgumentException;

/**
 * Arma el payload JSON para motor Jasper / PDF (bloque preparatorio; sin Jasper real).
 */
class JasperPayloadBuilder
{
    public function __construct(
        protected DocumentoAcademicoPayloadBuilder $documentoPayloadBuilder,
        protected DocumentStorageService $storage,
    ) {}

    /**
     * Persiste una nueva versión de payload PDF con snapshot actualizado del dominio + bloque Jasper controlado.
     */
    public function obtenerOCrearPayloadPdf(DocumentoAcademico $documento, ?int $usuarioId = null): DocumentoPayload
    {
        $tipo = $this->tipoPayloadPdfParaDocumento($documento);

        return $this->storage->guardarPayloadVersionado(
            $documento,
            $tipo,
            $this->construirPayloadRender($documento),
            $usuarioId,
        );
    }

    /**
     * Payload denormalizado para Jasper/PDF (simulado o futuro render real).
     *
     * @return array<string, mixed>
     */
    public function construirPayloadRender(DocumentoAcademico $documento): array
    {
        $tipoPayload = $this->tipoPayloadPdfParaDocumento($documento);
        $base = $this->documentoPayloadBuilder->construir($documento, $tipoPayload);

        return array_merge($base, [
            'motor_pdf' => [
                'nombre' => config('certificacion.pdf.default_engine', 'jasper'),
                'jasper_habilitado_config' => config('certificacion.jasper.enabled', false),
                'pdf_simulado_config' => config('certificacion.pdf.simulada', true),
                'jasper_base_path_config' => config('certificacion.jasper.base_path', ''),
            ],
            'bloque_pdf_controlado' => [
                'modo' => 'pdf_base_simulado',
                'estado_validacion' => 'pendiente_template_sep_real',
                'requiere_revision_senior' => true,
                'sin_jasper_real' => true,
                'sin_java_bridge_real' => true,
            ],
        ]);
    }

    /**
     * Plantilla documental aplicable (motor según configuración por defecto).
     *
     * @throws PlantillaDocumentoPdfNoEncontradaException
     */
    public function resolverPlantilla(DocumentoAcademico $documento): PlantillaDocumento
    {
        $tipo = $documento->tipo_documento;
        if ($tipo === null || $tipo === '') {
            throw new InvalidArgumentException('El documento no tiene tipo_documento.');
        }

        $motor = (string) config('certificacion.pdf.default_engine', 'jasper');

        $subsistemaId = $documento->subsistema_id;
        $institucionId = $documento->institucion_id;
        $nivelId = $this->resolverNivelAcademicoId($documento);

        $base = PlantillaDocumento::query()
            ->where('tipo_documento', $tipo)
            ->where('motor', $motor)
            ->where('activo', true);

        $intentos = [
            fn () => $institucionId && $subsistemaId && $nivelId
                ? (clone $base)->where('institucion_id', $institucionId)->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)->orderBy('codigo')->first()
                : null,
            fn () => $institucionId && $subsistemaId
                ? (clone $base)->where('institucion_id', $institucionId)->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')->orderBy('codigo')->first()
                : null,
            fn () => $institucionId && $nivelId
                ? (clone $base)->where('institucion_id', $institucionId)->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)->orderBy('codigo')->first()
                : null,
            fn () => $institucionId
                ? (clone $base)->where('institucion_id', $institucionId)->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('codigo')->first()
                : null,
            fn () => $subsistemaId && $nivelId
                ? (clone $base)->whereNull('institucion_id')->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)->orderBy('codigo')->first()
                : null,
            fn () => $subsistemaId
                ? (clone $base)->whereNull('institucion_id')->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')->orderBy('codigo')->first()
                : null,
            fn () => $nivelId
                ? (clone $base)->whereNull('institucion_id')->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)->orderBy('codigo')->first()
                : null,
            fn () => (clone $base)->whereNull('institucion_id')->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('codigo')->first(),
        ];

        foreach ($intentos as $resolver) {
            $r = $resolver();
            if ($r instanceof PlantillaDocumento) {
                return $r;
            }
        }

        throw new PlantillaDocumentoPdfNoEncontradaException(
            "No hay plantilla PDF/Jasper activa para tipo_documento [{$tipo}] y motor [{$motor}]."
        );
    }

    /**
     * @throws InvalidArgumentException
     */
    public function tipoPayloadPdfParaDocumento(DocumentoAcademico $documento): string
    {
        return match ($documento->tipo_documento) {
            'certificado' => 'CERTIFICADO_PDF',
            'titulo' => 'TITULO_PDF',
            'grado' => 'GRADO_PDF',
            default => throw new InvalidArgumentException('tipo_documento no soportado para PDF.'),
        };
    }

    protected function resolverNivelAcademicoId(DocumentoAcademico $documento): ?int
    {
        $documento->loadMissing('ofertaAcademica.programaEstudio');

        return $documento->ofertaAcademica?->programaEstudio?->nivel_academico_id;
    }
}

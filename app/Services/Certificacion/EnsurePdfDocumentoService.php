<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Exceptions\Certificacion\DocumentoNoFirmadoParaPdfException;
use App\Exceptions\Certificacion\PdfGeneracionDeshabilitadaException;
use App\Exceptions\Certificacion\PlantillaDocumentoPdfNoEncontradaException;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoVersion;
use App\Models\IntegracionLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Genera PDF en modo base/simulado y deja trazabilidad (auditoría + log de integración).
 */
class EnsurePdfDocumentoService
{
    public function __construct(
        protected JasperPayloadBuilder $payloadBuilder,
        protected JasperRenderService $renderService,
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
        protected DocumentStorageService $storage,
    ) {}

    /**
     * Flujo completo controlado: no invoca Jasper real ni rutas productivas.
     *
     * @throws DocumentoNoFirmadoParaPdfException
     * @throws PdfGeneracionDeshabilitadaException
     * @throws PlantillaDocumentoPdfNoEncontradaException
     */
    public function generarPdfBaseControlado(DocumentoAcademico $documento, ?int $usuarioId = null): DocumentoVersion
    {
        if (! (bool) config('certificacion.pdf.generation_enabled', true)) {
            throw new PdfGeneracionDeshabilitadaException('La generación de PDF está deshabilitada en configuración.');
        }

        return DB::transaction(function () use ($documento, $usuarioId) {
            $documento->refresh();

            if ($documento->estado_firma !== EstadoFirma::FIRMADO->value) {
                throw new DocumentoNoFirmadoParaPdfException(
                    'El documento debe estar firmado antes de generar el PDF base.'
                );
            }

            $correlationId = Str::uuid()->toString();
            $idempotencyKey = 'pdf-gen-'.$documento->id.'-'.$correlationId;

            $payloadPdf = $this->payloadBuilder->obtenerOCrearPayloadPdf($documento, $usuarioId);
            $plantilla = $this->payloadBuilder->resolverPlantilla($documento);

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_pdf',
                EstadoPdf::GENERANDO->value,
                $usuarioId,
                'Generación PDF base iniciada (simulada).',
                ['plantilla_id' => $plantilla->id],
            );

            $inicio = hrtime(true);

            try {
                /** @var array<string, mixed> $payloadArr */
                $payloadArr = $payloadPdf->payload_json ?? [];
                $pdfBinario = $this->renderService->render($payloadArr, $plantilla);

                $duracionMs = (int) ((hrtime(true) - $inicio) / 1_000_000);
                $sha = hash('sha256', $pdfBinario);

                $version = $this->storage->registrarVersionDocumental(
                    $documento->fresh(),
                    'PDF_OFICIAL',
                    [
                        'documento_payload_id' => $payloadPdf->id,
                        'contenido' => $pdfBinario,
                        'sha256' => $sha,
                        'size_bytes' => strlen($pdfBinario),
                        'metadata' => [
                            'modo' => 'pdf_base_simulado',
                            'estado_validacion' => 'pendiente_template_sep_real',
                            'requiere_revision_senior' => true,
                            'plantilla_codigo' => $plantilla->codigo,
                            'nombre_mostrar' => 'PDF_OFICIAL_no_valido_sep',
                        ],
                    ],
                    $usuarioId,
                );

                IntegracionLog::query()->create([
                    'documento_academico_id' => $documento->id,
                    'tipo' => 'PDF_GENERATION',
                    'endpoint' => config('certificacion.jasper.base_path') ?: null,
                    'method' => 'INTERNAL_SIM',
                    'correlation_id' => $correlationId,
                    'idempotency_key' => $idempotencyKey,
                    'request_payload' => [
                        'plantilla_codigo' => $plantilla->codigo,
                        'motor' => config('certificacion.pdf.default_engine'),
                        'pdf_simulado' => true,
                    ],
                    'response_payload' => [
                        'documento_version_id' => $version->id,
                        'sha256' => $sha,
                        'bytes' => strlen($pdfBinario),
                        'jasper_real' => false,
                        'modo' => 'pdf_base_simulado',
                    ],
                    'http_status' => 200,
                    'estado' => 'SUCCESS',
                    'error_message' => null,
                    'duration_ms' => $duracionMs,
                    'metadata' => [
                        'bloque' => 'ensure_pdf_documento',
                        'requiere_revision_senior' => true,
                        'sin_pdf_oficial_sep' => true,
                    ],
                ]);

                IntegracionLog::query()->create([
                    'documento_academico_id' => $documento->id,
                    'tipo' => 'JASPER_RENDER',
                    'endpoint' => null,
                    'method' => 'SIMULADO',
                    'correlation_id' => $correlationId.'-jasper',
                    'idempotency_key' => $idempotencyKey.'-jasper',
                    'request_payload' => ['plantilla_codigo' => $plantilla->codigo],
                    'response_payload' => [
                        'documento_version_id' => $version->id,
                        'simulado' => true,
                        'java_bridge' => false,
                    ],
                    'http_status' => null,
                    'estado' => 'SUCCESS',
                    'error_message' => null,
                    'duration_ms' => $duracionMs,
                    'metadata' => ['nota' => 'Marcador de proceso Jasper simulado; sin compilación .jasper real.'],
                ]);

                $this->estados->cambiarEstado(
                    $documento->fresh(),
                    'estado_pdf',
                    EstadoPdf::GENERADO->value,
                    $usuarioId,
                    'PDF base registrado (simulado).',
                    ['documento_version_id' => $version->id],
                );

                $this->auditoria->registrar(
                    'PDF_BASE_GENERADO',
                    DocumentoAcademico::class,
                    $documento->id,
                    [
                        'documento_version_id' => $version->id,
                        'sha256' => $sha,
                        'plantilla_codigo' => $plantilla->codigo,
                    ],
                    $usuarioId,
                    null,
                    null,
                    [
                        'modo' => 'pdf_simulado',
                        'sin_validez_oficial_sep' => true,
                        'requiere_revision_senior' => true,
                    ],
                );

                return $version->fresh();
            } catch (Throwable $e) {
                $this->registrarFalloIntegracion($documento, $correlationId, $idempotencyKey, $e);
                $this->estados->cambiarEstado(
                    $documento->fresh(),
                    'estado_pdf',
                    EstadoPdf::ERROR_PDF->value,
                    $usuarioId,
                    'Error en generación PDF base: '.$e->getMessage(),
                    [],
                );

                throw $e;
            }
        });
    }

    protected function registrarFalloIntegracion(
        DocumentoAcademico $documento,
        string $correlationId,
        string $idempotencyKey,
        Throwable $e,
    ): void {
        IntegracionLog::query()->create([
            'documento_academico_id' => $documento->id,
            'tipo' => 'PDF_GENERATION',
            'endpoint' => null,
            'method' => 'INTERNAL_SIM',
            'correlation_id' => $correlationId,
            'idempotency_key' => $idempotencyKey,
            'request_payload' => ['documento_academico_id' => $documento->id],
            'response_payload' => ['exception' => $e::class],
            'http_status' => null,
            'estado' => 'FAILED',
            'error_message' => $e->getMessage(),
            'duration_ms' => null,
            'metadata' => ['trace_first_line' => $e->getFile().':'.$e->getLine()],
        ]);
    }
}

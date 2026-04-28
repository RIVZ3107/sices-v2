<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Exceptions\Certificacion\PayloadDocumentoInvalidoException;
use App\Exceptions\Certificacion\ReglaCadenaNoEncontradaException;
use App\Models\CadenaOriginalGenerada;
use App\Models\CadenaOriginalRegla;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use Illuminate\Support\Facades\DB;

/**
 * Generación de cadena original en modo base/simulado (no validada SEP).
 */
class CadenaOriginalBuilder
{
    public function __construct(
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
    ) {}

    public function generar(
        DocumentoAcademico $documento,
        DocumentoPayload $payload,
        ?int $usuarioId = null,
    ): CadenaOriginalGenerada {
        if ($payload->documento_academico_id !== $documento->id) {
            throw new PayloadDocumentoInvalidoException('El payload no pertenece al documento académico indicado.');
        }

        $payloadJson = $payload->payload_json;
        if (! is_array($payloadJson) || $payloadJson === []) {
            throw new PayloadDocumentoInvalidoException('El payload JSON es inválido o está vacío.');
        }

        $hashCalculado = $this->hashPayloadJson($payloadJson);
        if ($payload->payload_hash !== $hashCalculado) {
            throw new PayloadDocumentoInvalidoException('El hash del payload no coincide con el contenido almacenado.');
        }

        return DB::transaction(function () use ($documento, $payload, $payloadJson, $usuarioId, $hashCalculado) {
            $documento->refresh();

            $regla = $this->resolverReglaActiva($documento);
            $cadenaTexto = $this->construirCadenaDesdePayload($payloadJson, $regla);
            $cadenaHash = $this->calcularHash($cadenaTexto);
            $version = $this->siguienteVersion($documento);

            $metadataBase = array_merge($this->metadataBaseControlada(), [
                'regla_codigo' => $regla->codigo,
                'regla_id' => $regla->id,
                'payload_hash_verificado' => $hashCalculado,
            ]);

            $generada = CadenaOriginalGenerada::query()->create([
                'documento_academico_id' => $documento->id,
                'documento_payload_id' => $payload->id,
                'cadena_original_regla_id' => $regla->id,
                'version' => $version,
                'payload_hash' => $payload->payload_hash,
                'cadena_original' => $cadenaTexto,
                'cadena_hash' => $cadenaHash,
                'estado' => 'generada',
                'error_message' => null,
                'metadata' => $metadataBase,
                'created_by' => $usuarioId,
            ]);

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_cadena',
                EstadoCadena::GENERADA->value,
                $usuarioId,
                'Cadena original generada (modo base controlado).',
                ['cadena_original_generada_id' => $generada->id],
            );

            $this->auditoria->registrar(
                evento: 'CADENA_GENERADA',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $documento->id,
                payload: [
                    'cadena_original_generada_id' => $generada->id,
                    'version' => $version,
                    'cadena_hash' => $cadenaHash,
                ],
                userId: $usuarioId,
                metadata: $metadataBase,
            );

            return $generada->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function construirCadenaDesdePayload(array $payload, CadenaOriginalRegla $regla): string
    {
        $normalizacion = is_array($regla->normalizacion) ? $regla->normalizacion : [];
        $estructura = is_array($regla->estructura_campos) ? $regla->estructura_campos : [];
        $ordenRaw = $estructura['orden_campos'] ?? [];
        $ordenCampos = is_array($ordenRaw) ? $ordenRaw : [];

        $flat = $this->aplanarPayload($payload);

        if ($ordenCampos !== []) {
            $partes = [];
            foreach ($ordenCampos as $clave) {
                if (! is_string($clave)) {
                    continue;
                }
                $valor = $this->obtenerPorRuta($payload, $clave);
                $partes[] = $this->normalizarValor($valor, $normalizacion);
            }

            return $this->unirPartes($partes, $estructura);
        }

        $partesOrdenadas = [];
        ksort($flat);
        foreach ($flat as $k => $v) {
            $partesOrdenadas[] = $k.'='.$this->normalizarValor($v, $normalizacion);
        }

        return $this->unirPartes($partesOrdenadas, array_merge($estructura, [
            'generado_sin_orden_formal' => true,
            'pendiente_validacion_sep' => true,
        ]));
    }

    public function calcularHash(string $cadena): string
    {
        return hash('sha256', $cadena);
    }

    public function siguienteVersion(DocumentoAcademico $documento): int
    {
        $max = CadenaOriginalGenerada::query()
            ->where('documento_academico_id', $documento->id)
            ->max('version');

        return (int) $max + 1;
    }

    private function resolverReglaActiva(DocumentoAcademico $documento): CadenaOriginalRegla
    {
        $tipo = $documento->tipo_documento;
        if ($tipo === null || $tipo === '') {
            throw new ReglaCadenaNoEncontradaException('El documento no tiene tipo_documento definido.');
        }

        $subsistemaId = $documento->subsistema_id;
        $nivelId = $this->resolverNivelAcademicoId($documento);

        $base = CadenaOriginalRegla::query()
            ->where('tipo_documento', $tipo)
            ->where('activo', true);

        if ($subsistemaId && $nivelId) {
            $r = (clone $base)->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)
                ->orderBy('codigo')->first();
            if ($r) {
                return $r;
            }
        }

        if ($subsistemaId) {
            $r = (clone $base)->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')
                ->orderBy('codigo')->first();
            if ($r) {
                return $r;
            }
        }

        if ($nivelId) {
            $r = (clone $base)->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)
                ->orderBy('codigo')->first();
            if ($r) {
                return $r;
            }
        }

        $r = (clone $base)->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('codigo')->first();
        if ($r) {
            return $r;
        }

        throw new ReglaCadenaNoEncontradaException(
            "No hay regla de cadena activa para tipo_documento [{$tipo}] con el contexto actual."
        );
    }

    /**
     * @param  array<string, mixed>  $payloadJson
     */
    private function hashPayloadJson(array $payloadJson): string
    {
        $canon = $this->canonicalizar($payloadJson);
        $json = json_encode($canon, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $json === false ? '' : hash('sha256', $json);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function canonicalizar(array $data): array
    {
        ksort($data);

        foreach ($data as $k => $v) {
            if (is_array($v)) {
                $data[$k] = $this->canonicalizar($v);
            }
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $normalizacion
     */
    private function normalizarValor(mixed $valor, array $normalizacion): string
    {
        if (is_array($valor) || is_object($valor)) {
            $valor = json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '';
        }

        $s = (string) $valor;

        if ($normalizacion['trim'] ?? true) {
            $s = trim($s);
        }

        if ($normalizacion['uppercase'] ?? false) {
            $s = mb_strtoupper($s, 'UTF-8');
        }

        if ($normalizacion['remover_dobles_espacios'] ?? false) {
            $s = preg_replace('/\s+/', ' ', $s) ?? $s;
        }

        return $s;
    }

    /**
     * @param  array<int, string>  $partes
     * @param  array<string, mixed>  $estructura
     */
    private function unirPartes(array $partes, array $estructura): string
    {
        $sep = $estructura['separador'] ?? '|';
        $prefijo = $estructura['prefijo_controlado'] ?? 'BASE_CONTROLADA';

        return $prefijo.$sep.implode($sep, $partes).$sep.'PENDIENTE_REVISION_SEP';
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string>
     */
    private function aplanarPayload(array $payload, string $prefijo = ''): array
    {
        $out = [];

        foreach ($payload as $key => $value) {
            $path = $prefijo === '' ? (string) $key : $prefijo.'.'.$key;

            if (is_array($value) && $this->esArrayAsociativo($value)) {
                $out = array_merge($out, $this->aplanarPayload($value, $path));
            } else {
                $out[$path] = is_scalar($value) || $value === null
                    ? (string) $value
                    : (json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function esArrayAsociativo(array $data): bool
    {
        return array_keys($data) !== range(0, count($data) - 1);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function obtenerPorRuta(array $payload, string $ruta): mixed
    {
        $partes = explode('.', $ruta);
        $actual = $payload;

        foreach ($partes as $p) {
            if (! is_array($actual) || ! array_key_exists($p, $actual)) {
                return '';
            }
            $actual = $actual[$p];
        }

        return $actual ?? '';
    }

    private function resolverNivelAcademicoId(DocumentoAcademico $documento): ?int
    {
        $documento->loadMissing('ofertaAcademica.programaEstudio');

        return $documento->ofertaAcademica?->programaEstudio?->nivel_academico_id;
    }

    /**
     * @return array<string, mixed>
     */
    private function metadataBaseControlada(): array
    {
        return [
            'modo' => 'base_controlada',
            'estado_validacion' => 'pendiente_validacion_sep',
            'requiere_revision_senior' => true,
        ];
    }
}

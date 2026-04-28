<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoXml;
use App\Exceptions\Certificacion\PayloadDocumentoInvalidoException;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\XmlPlantilla;
use Illuminate\Support\Facades\DB;

/**
 * Generación de XML documental en modo base/simulado (no validado ante SEP ni timbrado real).
 */
class XmlDocumentoAcademicoBuilder
{
    public function __construct(
        protected DocumentStorageService $storage,
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
    ) {}

    public function generar(
        DocumentoAcademico $documento,
        DocumentoPayload $payload,
        CadenaOriginalGenerada $cadena,
        ?int $usuarioId = null,
    ): DocumentoVersion {
        if ($payload->documento_academico_id !== $documento->id) {
            throw new PayloadDocumentoInvalidoException('El payload no pertenece al documento académico indicado.');
        }

        if ($cadena->documento_academico_id !== $documento->id) {
            throw new PayloadDocumentoInvalidoException('La cadena original no pertenece al documento académico indicado.');
        }

        if ($cadena->documento_payload_id !== $payload->id) {
            throw new PayloadDocumentoInvalidoException('La cadena original no corresponde al payload proporcionado.');
        }

        $payloadJson = $payload->payload_json;
        if (! is_array($payloadJson) || $payloadJson === []) {
            throw new PayloadDocumentoInvalidoException('El payload JSON es inválido o está vacío.');
        }

        return DB::transaction(function () use ($documento, $payload, $cadena, $payloadJson, $usuarioId) {
            $documento->refresh();
            $plantilla = $this->resolverPlantilla($documento);
            $xml = $this->construirXmlBase($payloadJson, $cadena, $plantilla);
            $sha256 = hash('sha256', $xml);
            $sizeBytes = strlen($xml);

            $metadata = array_merge($this->metadataBaseControlada(), [
                'plantilla_codigo' => $plantilla?->codigo,
                'plantilla_id' => $plantilla?->id,
                'cadena_original_generada_id' => $cadena->id,
            ]);

            $version = $this->storage->registrarVersionDocumental(
                $documento,
                'XML_ORIGINAL',
                [
                    'documento_payload_id' => $payload->id,
                    'cadena_original_generada_id' => $cadena->id,
                    'contenido' => $xml,
                    'sha256' => $sha256,
                    'size_bytes' => $sizeBytes,
                    'metadata' => $metadata,
                ],
                $usuarioId,
            );

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_xml',
                EstadoXml::GENERADO->value,
                $usuarioId,
                'XML base generado (modo base controlado).',
                ['documento_version_id' => $version->id],
            );

            $this->auditoria->registrar(
                'XML_GENERADO',
                DocumentoAcademico::class,
                $documento->id,
                [
                    'documento_version_id' => $version->id,
                    'sha256' => $sha256,
                    'tipo' => 'XML_ORIGINAL',
                ],
                $usuarioId,
                null,
                null,
                $metadata,
            );

            return $version->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function construirXmlBase(
        array $payload,
        CadenaOriginalGenerada $cadena,
        ?XmlPlantilla $plantilla = null,
    ): string {
        $tipoDoc = $this->valorTexto($payload['documento_academico']['tipo_documento'] ?? '');
        $folio = $this->valorTexto($payload['documento_academico']['folio_interno'] ?? '');
        $token = $this->valorTexto($payload['documento_academico']['token_consulta_publica'] ?? '');
        $alumno = is_array($payload['alumno'] ?? null) ? $payload['alumno'] : [];
        $inst = $payload['institucional'] ?? $payload['contexto_institucional'] ?? [];
        $inst = is_array($inst) ? $inst : [];
        $programa = is_array($payload['programa'] ?? null) ? $payload['programa'] : [];
        $plan = is_array($payload['plan'] ?? null) ? $payload['plan'] : [];
        $trayectoria = is_array($payload['trayectoria'] ?? null) ? $payload['trayectoria'] : [];
        $materias = is_array($payload['materias'] ?? null) ? $payload['materias'] : [];

        $rootNs = $plantilla?->namespace ?: 'urn:sices:documento:academico:base-controlado';
        $nsDecl = $rootNs !== ''
            ? ' xmlns="'.htmlspecialchars($rootNs, ENT_XML1 | ENT_COMPAT, 'UTF-8').'"'
            : '';

        $plantillaCodigo = $plantilla !== null ? $this->valorTexto($plantilla->codigo) : 'SIN_PLANTILLA_MINIMAL';

        $meta = json_encode([
            'modo' => 'base_controlada',
            'plantilla_codigo' => $plantillaCodigo,
            'pendiente_revision_senior_sep' => true,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<DocumentoAcademicoSimulado'.$nsDecl.' tipo="base_controlada">';
        $xml .= '<meta><![CDATA['.$meta.']]></meta>';
        $xml .= '<plantilla_referencia codigo="'.$this->escXml($plantillaCodigo).'"/>';
        $xml .= '<tipo_documento>'.$this->escXml($tipoDoc !== '' ? $tipoDoc : 'desconocido').'</tipo_documento>';
        $xml .= '<folio_interno>'.$this->escXml($folio).'</folio_interno>';
        $xml .= '<token_consulta_publica>'.$this->escXml($token).'</token_consulta_publica>';
        $xml .= '<alumno>'.$this->xmlHijosOTexto($alumno).'</alumno>';
        $xml .= '<institucional>'.$this->xmlHijosOTexto($inst).'</institucional>';
        $xml .= '<programa>'.$this->xmlHijosOTexto($programa).'</programa>';
        $xml .= '<plan>'.$this->xmlHijosOTexto($plan).'</plan>';
        $xml .= '<trayectoria>'.$this->xmlHijosOTexto($trayectoria).'</trayectoria>';
        $xml .= '<materias>'.$this->xmlMaterias($materias).'</materias>';
        $xml .= '<cadena_original>'.$this->escXml($cadena->cadena_original).'</cadena_original>';
        $xml .= '<cadena_hash>'.$this->escXml($cadena->cadena_hash).'</cadena_hash>';
        $xml .= '</DocumentoAcademicoSimulado>';

        return $xml;
    }

    public function resolverPlantilla(DocumentoAcademico $documento): ?XmlPlantilla
    {
        $tipo = $documento->tipo_documento;
        if ($tipo === null || $tipo === '') {
            return null;
        }

        $subsistemaId = $documento->subsistema_id;
        $nivelId = $this->resolverNivelAcademicoId($documento);

        $base = XmlPlantilla::query()
            ->where('tipo_documento', $tipo)
            ->where('activo', true);

        if ($subsistemaId && $nivelId) {
            $p = (clone $base)->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)
                ->orderBy('codigo')->first();
            if ($p) {
                return $p;
            }
        }

        if ($subsistemaId) {
            $p = (clone $base)->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')
                ->orderBy('codigo')->first();
            if ($p) {
                return $p;
            }
        }

        if ($nivelId) {
            $p = (clone $base)->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)
                ->orderBy('codigo')->first();
            if ($p) {
                return $p;
            }
        }

        return (clone $base)->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('codigo')->first();
    }

    /**
     * @param  array<string|int, mixed>  $datos
     */
    private function xmlHijosOTexto(array $datos): string
    {
        if ($datos === []) {
            return '<pendiente revision="sep" base_controlado="true"/>';
        }

        $out = '';
        foreach ($datos as $clave => $valor) {
            $tag = is_string($clave) ? preg_replace('/[^a-zA-Z0-9_\-]/', '_', $clave) : 'item';
            $tag = $tag !== '' ? $tag : 'item';
            if (is_array($valor)) {
                $out .= '<'.$tag.'>'.$this->xmlHijosOTexto($valor).'</'.$tag.'>';
            } else {
                $out .= '<'.$tag.'>'.$this->escXml((string) $valor).'</'.$tag.'>';
            }
        }

        return $out;
    }

    /**
     * @param  array<int, mixed>  $materias
     */
    private function xmlMaterias(array $materias): string
    {
        if ($materias === []) {
            return '<pendiente revision="sep" base_controlado="true"/>';
        }

        $out = '';
        foreach ($materias as $idx => $m) {
            if (! is_array($m)) {
                $out .= '<materia indice="'.$idx.'">'.$this->escXml((string) $m).'</materia>';

                continue;
            }
            $out .= '<materia indice="'.$idx.'">'.$this->xmlHijosOTexto($m).'</materia>';
        }

        return $out;
    }

    private function valorTexto(mixed $v): string
    {
        if ($v === null) {
            return '';
        }

        return is_string($v) ? $v : (is_scalar($v) ? (string) $v : '');
    }

    private function escXml(string $s): string
    {
        return htmlspecialchars($s, ENT_XML1 | ENT_COMPAT, 'UTF-8');
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

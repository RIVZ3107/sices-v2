<?php

declare(strict_types=1);

namespace App\Services\DocumentosAcademicos;

use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use App\Models\Subsistema;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

/**
 * Consulta del catálogo de tipos documentales (config/sices_documentos.php).
 * No ejecuta firma, XML, PDF ni Informix.
 */
class DocumentoAcademicoTipoService
{
    /** @return list<string> */
    public function tiposMinimos(): array
    {
        return config('sices_documentos.tipos_minimos', []);
    }

    /** @return array<string, array{key: string, label: string, descripcion: string}> */
    public function subsistemas(): array
    {
        return config('sices_documentos.subsistemas', []);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listar(?string $subsistema = null): array
    {
        $subsistema = $this->normalizarSubsistema($subsistema);
        $tipos = config('sices_documentos.tipos', []);
        $items = [];

        foreach ($tipos as $def) {
            if ($subsistema !== null && ! $this->permitidoParaSubsistema($def['key'], $subsistema)) {
                continue;
            }
            $items[] = $this->formatearTipo($def, $subsistema);
        }

        return $items;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function obtener(string $tipo, ?string $subsistema = null): ?array
    {
        $def = $this->definicionTipo($tipo);
        if ($def === null) {
            return null;
        }

        $subsistema = $this->normalizarSubsistema($subsistema);
        if ($subsistema !== null && ! $this->permitidoParaSubsistema($tipo, $subsistema)) {
            return null;
        }

        return $this->formatearTipo($def, $subsistema);
    }

    public function existeEnCatalogo(string $tipo): bool
    {
        return $this->definicionTipo($tipo) !== null;
    }

    public function permitidoParaSubsistema(string $tipo, string $subsistema): bool
    {
        $def = $this->definicionTipo($tipo);
        if ($def === null) {
            return false;
        }

        $subsistema = $this->normalizarSubsistema($subsistema);
        if ($subsistema === null) {
            return false;
        }

        return in_array($subsistema, $def['subsistemas_permitidos'] ?? [], true);
    }

    /**
     * Capacidades resumidas para UI y validaciones ligeras.
     *
     * @return array<string, mixed>
     */
    public function capacidades(string $tipo, string $subsistema): array
    {
        $reglas = $this->reglas($tipo, $subsistema);
        if ($reglas === null) {
            throw new InvalidArgumentException("Tipo {$tipo} no permitido para subsistema {$subsistema}.");
        }

        return [
            'tipo' => $tipo,
            'subsistema' => $this->normalizarSubsistema($subsistema),
            'pipeline_key' => $reglas['pipeline_key'],
            'plantilla_key_default' => $reglas['plantilla_key_default'],
            'requiere_payload_json' => (bool) $reglas['requiere_payload_json'],
            'requiere_xml_sep' => (bool) $reglas['requiere_xml_sep'],
            'requiere_firma_sep' => (bool) $reglas['requiere_firma_sep'],
            'requiere_firma_local' => (bool) $reglas['requiere_firma_local'],
            'requiere_folio_control' => (bool) $reglas['requiere_folio_control'],
            'requiere_url_short' => (bool) $reglas['requiere_url_short'],
            'requiere_pdf' => (bool) $reglas['requiere_pdf'],
            'requiere_consulta_publica' => (bool) $reglas['requiere_consulta_publica'],
            'permite_jasper_fallback' => (bool) $reglas['permite_jasper_fallback'],
            'permite_editor_plantilla_futuro' => (bool) $reglas['permite_editor_plantilla_futuro'],
            'permite_puente_informix' => (bool) $reglas['permite_puente_informix'],
        ];
    }

    /**
     * @throws ValidationException
     */
    public function validarTipoParaSubsistema(string $tipo, string $subsistema): void
    {
        if (! $this->existeEnCatalogo($tipo)) {
            throw ValidationException::withMessages([
                'tipo_documento' => ['El tipo documental no está registrado en el catálogo institucional.'],
            ]);
        }

        $subsistemaNorm = $this->normalizarSubsistema($subsistema);
        if ($subsistemaNorm === null) {
            throw ValidationException::withMessages([
                'subsistema' => ['No fue posible determinar el subsistema académico para este documento.'],
            ]);
        }

        if (! $this->permitidoParaSubsistema($tipo, $subsistemaNorm)) {
            throw ValidationException::withMessages([
                'tipo_documento' => ['El tipo documental seleccionado no está permitido para este subsistema.'],
            ]);
        }
    }

    public function resolveSubsistemaClaveFromMatricula(Matricula $matricula): ?string
    {
        if ($matricula->relationLoaded('subsistema') && $matricula->subsistema) {
            return $this->normalizarSubsistema($matricula->subsistema->clave);
        }

        if ($matricula->subsistema_id) {
            $clave = Subsistema::query()->whereKey($matricula->subsistema_id)->value('clave');

            return $this->normalizarSubsistema(is_string($clave) ? $clave : null);
        }

        return null;
    }

    public function resolveSubsistemaClaveFromDocumento(DocumentoAcademico $documento): ?string
    {
        if ($documento->matricula_id) {
            $matricula = $documento->relationLoaded('matricula')
                ? $documento->matricula
                : Matricula::query()->with('subsistema')->find($documento->matricula_id);

            if ($matricula) {
                return $this->resolveSubsistemaClaveFromMatricula($matricula);
            }
        }

        if ($documento->subsistema_id) {
            $clave = Subsistema::query()->whereKey($documento->subsistema_id)->value('clave');

            return $this->normalizarSubsistema(is_string($clave) ? $clave : null);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    public function fusionarMetadataConCapacidades(array $metadata, string $tipo, string $subsistema): array
    {
        $subsistemaNorm = $this->normalizarSubsistema($subsistema);
        if ($subsistemaNorm === null) {
            throw ValidationException::withMessages([
                'subsistema' => ['No fue posible determinar el subsistema académico para este documento.'],
            ]);
        }

        $this->validarTipoParaSubsistema($tipo, $subsistemaNorm);
        $cap = $this->capacidadesParaRespuesta($tipo, $subsistemaNorm);

        return array_merge($metadata, [
            'tipo_documental_catalogo' => $tipo,
            'subsistema_catalogo' => $subsistemaNorm,
            'capacidades_documento' => $cap,
            'capacidades_registradas_en' => now()->toIso8601String(),
        ]);
    }

    /**
     * Payload de capacidades para API (sin metadatos internos).
     *
     * @return array<string, mixed>
     */
    public function capacidadesParaRespuesta(string $tipo, string $subsistema): array
    {
        $cap = $this->capacidades($tipo, $subsistema);
        unset($cap['tipo'], $cap['subsistema']);

        return $cap;
    }

    /**
     * @return array<string, mixed>
     */
    public function capacidadesDesdeDocumento(DocumentoAcademico $documento): array
    {
        $meta = $documento->metadata ?? [];
        if (is_array($meta['capacidades_documento'] ?? null) && ($meta['tipo_documental_catalogo'] ?? $documento->tipo_documento)) {
            return $meta['capacidades_documento'];
        }

        $sub = $this->resolveSubsistemaClaveFromDocumento($documento);
        $tipo = (string) ($documento->tipo_documento ?? '');
        if ($sub === null || $tipo === '' || ! $this->permitidoParaSubsistema($tipo, $sub)) {
            return [];
        }

        return $this->capacidadesParaRespuesta($tipo, $sub);
    }

    public function documentoPermiteCambioTipoDocumento(DocumentoAcademico $documento): bool
    {
        return $documento->estado_workflow === 'borrador';
    }

    /**
     * @return array<string, mixed>|null
     */
    public function reglas(string $tipo, string $subsistema): ?array
    {
        $def = $this->definicionTipo($tipo);
        if ($def === null) {
            return null;
        }

        $subsistema = $this->normalizarSubsistema($subsistema);
        if ($subsistema === null || ! $this->permitidoParaSubsistema($tipo, $subsistema)) {
            return null;
        }

        return $def['reglas'][$subsistema] ?? null;
    }

    /**
     * Validación de integridad del catálogo (usada en pruebas).
     */
    public function validarIntegridadCatalogo(): void
    {
        $minimos = $this->tiposMinimos();
        $tipos = config('sices_documentos.tipos', []);

        foreach ($minimos as $key) {
            if (! isset($tipos[$key])) {
                throw new InvalidArgumentException("Falta definición del tipo mínimo: {$key}");
            }
        }

        foreach ($tipos as $key => $def) {
            $permitidos = $def['subsistemas_permitidos'] ?? [];
            $reglas = $def['reglas'] ?? [];

            if (($def['key'] ?? $key) !== $key) {
                throw new InvalidArgumentException("Clave inconsistente en tipo {$key}");
            }

            if ($reglas === []) {
                throw new InvalidArgumentException("Tipo {$key} sin reglas por subsistema");
            }

            foreach ($permitidos as $sub) {
                if (! isset($reglas[$sub])) {
                    throw new InvalidArgumentException("Tipo {$key} sin reglas para subsistema {$sub}");
                }
                $this->validarRegla($key, $sub, $reglas[$sub]);
            }

            foreach (array_keys($reglas) as $subRegla) {
                if (! in_array($subRegla, $permitidos, true)) {
                    throw new InvalidArgumentException(
                        "Tipo {$key}: reglas definidas para subsistema no permitido {$subRegla}",
                    );
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $regla
     */
    private function validarRegla(string $tipo, string $subsistema, array $regla): void
    {
        if (empty($regla['pipeline_key'])) {
            throw new InvalidArgumentException("Tipo {$tipo}/{$subsistema} sin pipeline_key");
        }

        if (! array_key_exists('requiere_payload_json', $regla) || $regla['requiere_payload_json'] !== true) {
            throw new InvalidArgumentException("Tipo {$tipo}/{$subsistema} debe declarar requiere_payload_json true");
        }

        if (! empty($regla['requiere_xml_sep']) && ! array_key_exists('requiere_firma_sep', $regla)) {
            throw new InvalidArgumentException(
                "Tipo {$tipo}/{$subsistema}: requiere_xml_sep exige requiere_firma_sep definido",
            );
        }

        if (! empty($regla['requiere_consulta_publica']) && empty($regla['requiere_url_short'])) {
            throw new InvalidArgumentException(
                "Tipo {$tipo}/{$subsistema}: consulta pública requiere URL short",
            );
        }
    }

    /**
     * @param  array<string, mixed>  $def
     * @return array<string, mixed>
     */
    private function formatearTipo(array $def, ?string $subsistema): array
    {
        $out = [
            'key' => $def['key'],
            'label' => $def['label'],
            'descripcion' => $def['descripcion'],
            'subsistemas_permitidos' => $def['subsistemas_permitidos'],
            'estados_aplicables' => $def['estados_aplicables'] ?? [],
        ];

        if ($subsistema !== null) {
            $out['subsistema'] = $subsistema;
            $out['reglas'] = $this->reglas($def['key'], $subsistema);
            $out['capacidades'] = $this->capacidades($def['key'], $subsistema);
        } else {
            $out['reglas_por_subsistema'] = [];
            foreach ($def['subsistemas_permitidos'] as $sub) {
                $out['reglas_por_subsistema'][$sub] = $def['reglas'][$sub] ?? null;
            }
        }

        return $out;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function definicionTipo(string $tipo): ?array
    {
        $tipos = config('sices_documentos.tipos', []);

        return $tipos[$tipo] ?? null;
    }

    private function normalizarSubsistema(?string $subsistema): ?string
    {
        if ($subsistema === null || $subsistema === '') {
            return null;
        }

        $map = [
            'normal' => 'NORMAL',
            'normales' => 'NORMAL',
            'NORMAL' => 'NORMAL',
            'upn' => 'UPN',
            'UPN' => 'UPN',
        ];

        $clave = $map[strtolower($subsistema)] ?? strtoupper($subsistema);

        return isset(config('sices_documentos.subsistemas')[$clave]) ? $clave : null;
    }
}

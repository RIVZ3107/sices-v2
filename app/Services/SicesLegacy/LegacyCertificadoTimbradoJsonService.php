<?php

declare(strict_types=1);

namespace App\Services\SicesLegacy;

use App\Data\SicesLegacy\LegacyCertificadoTimbradoExportData;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Arma el JSON con nombres de campo del legacy (e11superior_cert / e11materias_cert)
 * para cadena original, XML y timbrado SEP en SICES PHP.
 */
class LegacyCertificadoTimbradoJsonService
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    public function exportar(DocumentoAcademico $documento, ?int $userId = null): LegacyCertificadoTimbradoExportData
    {
        $documento = $documento->fresh() ?? $documento;

        $this->auditoria->registrar(
            evento: 'sices_legacy.timbrado_json_export_intento',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['documento_id' => $documento->id],
            userId: $userId,
        );

        $documento->loadMissing([
            'alumno',
            'matricula',
            'region',
            'sede',
            'institucion',
            'cicloEscolar',
            'ofertaAcademica.programaEstudio',
            'ofertaAcademica.planEstudio',
            'materiasSnapshot',
        ]);

        $errores = $this->collectErrores($documento);
        $urlShort = $this->resolverUrlShortOpcional($documento);
        $certificado = $this->buildE11SuperiorCert($documento);
        $materias = $this->buildE11MateriasCert($documento);

        $valido = $errores === [];

        if ($valido) {
            $this->auditoria->registrar(
                evento: 'sices_legacy.timbrado_json_export_ok',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $documento->id,
                payload: [
                    'url_short' => $urlShort,
                    'materias_count' => count($materias),
                ],
                userId: $userId,
            );
        } else {
            $this->auditoria->registrar(
                evento: 'sices_legacy.timbrado_json_export_fallo',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $documento->id,
                payload: ['errores' => array_slice($errores, 0, 20)],
                userId: $userId,
            );
        }

        return new LegacyCertificadoTimbradoExportData(
            documentoId: $documento->id,
            urlShort: $urlShort,
            e11superiorCert: $certificado,
            e11materiasCert: $materias,
            valido: $valido,
            errores: $errores,
        );
    }

    /**
     * @return array<string, string>
     */
    public function buildE11SuperiorCert(DocumentoAcademico $documento): array
    {
        $alumno = $documento->alumno;
        $curp = strtoupper(trim((string) ($alumno?->curp ?? '')));
        $digito = trim((string) ($alumno?->curp_digito ?? ''));
        if ($digito === '' && strlen($curp) === 18) {
            $digito = substr($curp, 16, 2);
        }

        $sede = $documento->sede;
        $cct = trim((string) ($sede?->cct ?? $sede?->clave ?? ''));
        $nombreEscuela = trim((string) ($sede?->nombre ?? $documento->institucion?->nombre ?? ''));

        $programa = $documento->ofertaAcademica?->programaEstudio;
        $plan = $documento->ofertaAcademica?->planEstudio;

        $metaDoc = is_array($documento->metadata) ? $documento->metadata : [];
        $metaSede = is_array($sede?->metadata) ? $sede->metadata : [];
        $idEntidad = (string) (
            $metaDoc['legacy_id_entidad']
            ?? $documento->region?->clave
            ?? $documento->region_id
            ?? ''
        );
        $municipio = (string) (
            $metaDoc['legacy_municipio']
            ?? $metaSede['posible_municipio_detectado']
            ?? $metaSede['municipio']
            ?? ''
        );

        $promedio = $this->resolverPromedio($documento);
        $fechaExp = $documento->fecha_aprobacion?->format('Y-m-d')
            ?? $documento->fecha_solicitud?->format('Y-m-d')
            ?? now()->format('Y-m-d');

        return [
            'nombre' => $this->texto($alumno?->nombre),
            'primerApellido' => $this->texto($alumno?->primer_apellido),
            'segundoApellido' => $this->texto($alumno?->segundo_apellido),
            'curp' => $curp,
            'odigitoCurp' => $digito,
            'claveInstitucion' => $this->texto($documento->institucion?->clave),
            'cct' => $cct,
            'nombreEscuela' => $nombreEscuela,
            'idEntidad' => $idEntidad,
            'municipio' => $municipio,
            'claveCarrera' => $this->texto($programa?->clave),
            'carrera' => $this->texto($programa?->nombre),
            'planEstudios' => $this->texto($plan?->clave ?? $plan?->nombre),
            'tipoCertificado' => $this->mapTipoCertificadoLegacy($documento),
            'fechaExpedicion' => $fechaExp,
            'promedio' => $promedio,
        ];
    }

    /**
     * @return list<array<string, string>>
     */
    public function buildE11MateriasCert(DocumentoAcademico $documento): array
    {
        $snapshots = $documento->materiasSnapshot;
        if ($snapshots->isEmpty()) {
            $snapshots = DocumentoMateriaSnapshot::query()
                ->where('documento_academico_id', $documento->id)
                ->orderBy('orden')
                ->orderBy('id')
                ->get();
        }

        $rows = [];
        foreach ($snapshots as $snap) {
            $rows[] = [
                'clave_materia' => $this->texto($snap->clave),
                'nombre_materia' => $this->texto($snap->nombre),
                'calificacionFinal_materia' => $this->formatCalificacion($snap->calificacion_final),
                'semestre_materia' => $snap->semestre !== null ? (string) $snap->semestre : '',
                'periodo' => $this->texto($snap->periodo),
            ];
        }

        return $rows;
    }

    /**
     * @return list<string>
     */
    public function collectErrores(DocumentoAcademico $documento): array
    {
        $errores = [];
        $cert = $this->buildE11SuperiorCert($documento);

        $requeridosCert = [
            'nombre', 'primerApellido', 'curp', 'odigitoCurp', 'claveInstitucion',
            'cct', 'nombreEscuela', 'idEntidad', 'claveCarrera', 'carrera',
            'planEstudios', 'tipoCertificado', 'fechaExpedicion', 'promedio',
        ];
        foreach ($requeridosCert as $campo) {
            if (($cert[$campo] ?? '') === '') {
                $errores[] = "Falta e11superior_cert.{$campo}.";
            }
        }

        if (! in_array($cert['tipoCertificado'], ['T', 'P'], true)) {
            $errores[] = 'tipoCertificado debe ser T (total/término) o P (parcial).';
        }

        if ($documento->alumno === null) {
            $errores[] = 'El documento no tiene alumno asociado.';
        }

        if ($documento->matricula_id === null) {
            $errores[] = 'Falta matrícula institucional.';
        }

        if ($documento->institucion_id === null || $documento->sede_id === null) {
            $errores[] = 'Faltan institución y sede (CCT).';
        }

        $materias = $this->buildE11MateriasCert($documento);
        if ($materias === []) {
            $errores[] = 'No hay registros para e11materias_cert.';
        }

        foreach ($materias as $i => $m) {
            $n = $i + 1;
            if ($m['clave_materia'] === '') {
                $errores[] = "Materia #{$n}: falta clave_materia.";
            }
            if ($m['nombre_materia'] === '') {
                $errores[] = "Materia #{$n}: falta nombre_materia.";
            }
            if ($m['calificacionFinal_materia'] === '') {
                $errores[] = "Materia #{$n}: falta calificacionFinal_materia.";
            }
        }

        return $errores;
    }

    protected function mapTipoCertificadoLegacy(DocumentoAcademico $documento): string
    {
        $tipo = strtolower((string) ($documento->tipo_certificacion ?? 'total'));

        return match ($tipo) {
            'parcial' => 'P',
            'total', 'termino' => 'T',
            default => 'T',
        };
    }

    protected function resolverPromedio(DocumentoAcademico $documento): string
    {
        $snapshot = is_array($documento->snapshot_json) ? $documento->snapshot_json : [];
        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $valor = $snapshot['promedio'] ?? $meta['promedio'] ?? null;

        if ($valor === null && $documento->relationLoaded('materiasSnapshot') && $documento->materiasSnapshot->isNotEmpty()) {
            $avg = $documento->materiasSnapshot->avg(fn ($m) => (float) ($m->calificacion_final ?? 0));
            $valor = $avg;
        }

        if ($valor === null || $valor === '') {
            return '';
        }

        return number_format((float) $valor, 2, '.', '');
    }

    protected function resolverUrlShortOpcional(DocumentoAcademico $documento): ?string
    {
        $shadow = is_array($documento->metadata['legacy_shadow'] ?? null)
            ? $documento->metadata['legacy_shadow']
            : [];
        $token = trim((string) ($shadow['url_short'] ?? $documento->token_consulta_publica ?? ''));
        if ($token !== '') {
            return $token;
        }

        try {
            return (string) (UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->value('token') ?? '');
        } catch (\Throwable) {
            return null;
        }
    }

    protected function formatCalificacion(mixed $calificacion): string
    {
        if ($calificacion === null || $calificacion === '') {
            return '';
        }

        return number_format((float) $calificacion, 1, '.', '');
    }

    protected function texto(mixed $valor): string
    {
        if ($valor === null) {
            return '';
        }

        return trim(Str::squish((string) $valor));
    }
}

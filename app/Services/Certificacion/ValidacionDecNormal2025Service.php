<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Support\Certificacion\Specs\DecNormal2025Spec;
use DOMDocument;
use Illuminate\Validation\ValidationException;

class ValidacionDecNormal2025Service
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function validarPayload(array $payload): void
    {
        $errores = [];

        $idEntidadFirmante = (string) ($payload['ServicioFirmante']['idEntidad'] ?? '');
        $idEntidadEducativo = (string) ($payload['ServicioEducativo']['idEntidadFederativa'] ?? '');
        if ($idEntidadFirmante === '' || $idEntidadEducativo === '' || $idEntidadFirmante !== $idEntidadEducativo) {
            $errores[] = 'ServicioFirmante.idEntidad debe coincidir con ServicioEducativo.idEntidadFederativa.';
        }

        $curp = (string) ($payload['Alumno']['curp'] ?? '');
        if (strlen($curp) !== 18) {
            $errores[] = 'Alumno.curp debe ser CURP completa de 18 caracteres para DEC Normal.';
        }
        $curpResponsable = (string) ($payload['FirmaResponsable']['curp'] ?? '');
        if (strlen($curpResponsable) !== 18) {
            $errores[] = 'FirmaResponsable.curp debe tener 18 caracteres.';
        }

        foreach ([
            'ServicioEducativo.nombreSecretariaInstituto' => $payload['ServicioEducativo']['nombreSecretariaInstituto'] ?? '',
            'ServicioEducativo.nombreEscuelaDependencia' => $payload['ServicioEducativo']['nombreEscuelaDependencia'] ?? '',
            'ServicioEducativo.cct' => $payload['ServicioEducativo']['cct'] ?? '',
            'ServicioEducativo.claveInstitucion' => $payload['ServicioEducativo']['claveInstitucion'] ?? '',
            'Carrera.claveCarrera' => $payload['Carrera']['claveCarrera'] ?? '',
            'Carrera.carrera' => $payload['Carrera']['carrera'] ?? '',
            'Carrera.planEstudios' => $payload['Carrera']['planEstudios'] ?? '',
        ] as $campo => $valor) {
            if (trim((string) $valor) === '') {
                $errores[] = "{$campo} es obligatorio para DEC Normal.";
            }
        }

        $asignaturas = $payload['AsignaturasCursos']['AsignaturaCurso'] ?? [];
        if (! is_array($asignaturas) || count($asignaturas) < 1) {
            $errores[] = 'AsignaturasCursos debe contener al menos una asignatura.';
        } else {
            foreach ($asignaturas as $idx => $asignatura) {
                foreach (['clave', 'nombre', 'calificacionFinal', 'semestre', 'periodo'] as $campo) {
                    if (! isset($asignatura[$campo]) || trim((string) $asignatura[$campo]) === '') {
                        $errores[] = "AsignaturaCurso[$idx].$campo es obligatorio.";
                    }
                }
            }
        }

        foreach (['asignaturasCursadas', 'asignaturasTotal', 'creditosTotales', 'promedioAprovechamiento'] as $campo) {
            if (trim((string) ($payload['Acreditacion'][$campo] ?? '')) === '') {
                $errores[] = "Acreditacion.$campo es obligatorio.";
            }
        }

        if ($errores !== []) {
            throw ValidationException::withMessages(['dec_normal_2025' => $errores]);
        }
    }

    public function validarDocumentoParaDec(DocumentoAcademico $documento): void
    {
        if ($documento->materiasSnapshot()->count() === 0) {
            throw ValidationException::withMessages([
                'materias_snapshot' => ['No se puede generar cadena/XML DEC sin snapshot de materias.'],
            ]);
        }
    }

    /**
     * @return array{ok:bool,errores:list<string>}
     */
    public function validarXmlContraXsd(string $xml): array
    {
        libxml_use_internal_errors(true);
        libxml_clear_errors();

        $dom = new DOMDocument();
        if (! $dom->loadXML($xml)) {
            return [
                'ok' => false,
                'errores' => collect(libxml_get_errors())
                    ->map(fn ($error) => trim($error->message))
                    ->filter()
                    ->values()
                    ->all(),
            ];
        }

        $xsdPath = base_path('resources/xsd/'.DecNormal2025Spec::XSD);
        if (! is_file($xsdPath)) {
            return ['ok' => false, 'errores' => ["No existe XSD DEC configurado: {$xsdPath}"]];
        }

        $ok = $dom->schemaValidate($xsdPath);
        $errores = collect(libxml_get_errors())
            ->map(fn ($error) => trim($error->message))
            ->filter()
            ->values()
            ->all();
        libxml_clear_errors();

        return ['ok' => $ok, 'errores' => $errores];
    }
}

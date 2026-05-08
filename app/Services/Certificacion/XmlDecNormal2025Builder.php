<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoVersion;
use App\Support\Certificacion\Specs\DecNormal2025Spec;
use Illuminate\Validation\ValidationException;

class XmlDecNormal2025Builder
{
    public function __construct(
        protected DocumentStorageService $storage,
        protected ValidacionDecNormal2025Service $validacion,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function buildXml(array $payload, string $cadenaOriginal): string
    {
        if (! str_starts_with($cadenaOriginal, '||') || ! str_ends_with($cadenaOriginal, '||')) {
            throw ValidationException::withMessages([
                'cadena_original' => ['La cadena original DEC debe iniciar y terminar con doble pipe.'],
            ]);
        }

        $this->validacion->validarPayload($payload);

        $xml = '<?xml version="'.DecNormal2025Spec::XML_VERSION.'" encoding="UTF-8"?>';
        $xml .= '<Dec xmlns="'.DecNormal2025Spec::XML_NAMESPACE.'" version="'.$this->esc((string) $payload['Dec']['version']).'" tipoCertificado="'.$this->esc((string) $payload['Dec']['tipoCertificado']).'">';
        $xml .= '<ServicioFirmante servicio="'.$this->esc((string) $payload['ServicioFirmante']['servicio']).'" idEntidad="'.$this->esc((string) $payload['ServicioFirmante']['idEntidad']).'" />';
        $xml .= '<FirmaResponsable curp="'.$this->esc((string) $payload['FirmaResponsable']['curp']).'" cargo="'.$this->esc((string) $payload['FirmaResponsable']['cargo']).'" />';
        $xml .= '<ServicioEducativo nombreSecretariaInstituto="'.$this->esc((string) $payload['ServicioEducativo']['nombreSecretariaInstituto']).'" nombreEscuelaDependencia="'.$this->esc((string) $payload['ServicioEducativo']['nombreEscuelaDependencia']).'" cct="'.$this->esc((string) $payload['ServicioEducativo']['cct']).'" nombreEscuelaDesaparecida="'.$this->esc((string) $payload['ServicioEducativo']['nombreEscuelaDesaparecida']).'" cctDesaparecida="'.$this->esc((string) $payload['ServicioEducativo']['cctDesaparecida']).'" claveInstitucion="'.$this->esc((string) $payload['ServicioEducativo']['claveInstitucion']).'" idEntidadFederativa="'.$this->esc((string) $payload['ServicioEducativo']['idEntidadFederativa']).'" idMunicipio="'.$this->esc((string) $payload['ServicioEducativo']['idMunicipio']).'" estatusEscuela="'.$this->esc((string) $payload['ServicioEducativo']['estatusEscuela']).'" />';
        $xml .= '<Carrera claveCarrera="'.$this->esc((string) $payload['Carrera']['claveCarrera']).'" carrera="'.$this->esc((string) $payload['Carrera']['carrera']).'" idModalidad="'.$this->esc((string) $payload['Carrera']['idModalidad']).'" planEstudios="'.$this->esc((string) $payload['Carrera']['planEstudios']).'" />';
        $xml .= '<Alumno curp="'.$this->esc((string) $payload['Alumno']['curp']).'" nombre="'.$this->esc((string) $payload['Alumno']['nombre']).'" primerApellido="'.$this->esc((string) $payload['Alumno']['primerApellido']).'" segundoApellido="'.$this->esc((string) $payload['Alumno']['segundoApellido']).'" idGenero="'.$this->esc((string) $payload['Alumno']['idGenero']).'" />';
        $xml .= '<Acreditacion idTipoCertificacion="'.$this->esc((string) $payload['Acreditacion']['idTipoCertificacion']).'" fechaExpedicion="'.$this->esc((string) $payload['Acreditacion']['fechaExpedicion']).'" asignaturasCursadas="'.$this->esc((string) $payload['Acreditacion']['asignaturasCursadas']).'" asignaturasTotal="'.$this->esc((string) $payload['Acreditacion']['asignaturasTotal']).'" creditosTotales="'.$this->esc((string) $payload['Acreditacion']['creditosTotales']).'" promedioAprovechamiento="'.$this->esc((string) $payload['Acreditacion']['promedioAprovechamiento']).'" />';
        $xml .= '<AsignaturasCursos>';
        foreach (($payload['AsignaturasCursos']['AsignaturaCurso'] ?? []) as $asignatura) {
            $xml .= '<AsignaturaCurso clave="'.$this->esc((string) $asignatura['clave']).'" nombre="'.$this->esc((string) $asignatura['nombre']).'" calificacionFinal="'.$this->esc((string) $asignatura['calificacionFinal']).'" semestre="'.$this->esc((string) $asignatura['semestre']).'" periodo="'.$this->esc((string) $asignatura['periodo']).'" />';
        }
        $xml .= '</AsignaturasCursos>';
        $xml .= '</Dec>';

        return $xml;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function generarYGuardar(DocumentoAcademico $documento, array $payload, string $cadenaOriginal, ?int $actorId = null): DocumentoVersion
    {
        $this->validacion->validarDocumentoParaDec($documento);
        $xml = $this->buildXml($payload, $cadenaOriginal);

        return $this->storage->registrarVersionDocumental(
            $documento,
            DocumentoVersionTipo::XML_DEC_LOCAL->value,
            [
                'contenido' => $xml,
                'sha256' => hash('sha256', $xml),
                'size_bytes' => strlen($xml),
                'spec_code' => DecNormal2025Spec::SPEC_CODE,
                'spec_version' => DecNormal2025Spec::SPEC_VERSION,
                'generado_por' => $actorId,
                'generado_en' => now(),
            ],
            $actorId,
        );
    }

    private function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }
}

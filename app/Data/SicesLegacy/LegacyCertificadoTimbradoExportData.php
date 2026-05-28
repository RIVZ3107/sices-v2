<?php

declare(strict_types=1);

namespace App\Data\SicesLegacy;

/**
 * JSON de exportación hacia SICES legacy (e11superior_cert + e11materias_cert).
 *
 * @phpstan-type CertificadoLegacy array{
 *   nombre: string,
 *   primerApellido: string,
 *   segundoApellido: string,
 *   curp: string,
 *   odigitoCurp: string,
 *   claveInstitucion: string,
 *   cct: string,
 *   nombreEscuela: string,
 *   idEntidad: string,
 *   municipio: string,
 *   claveCarrera: string,
 *   carrera: string,
 *   planEstudios: string,
 *   tipoCertificado: string,
 *   fechaExpedicion: string,
 *   promedio: string
 * }
 * @phpstan-type MateriaLegacy array{
 *   clave_materia: string,
 *   nombre_materia: string,
 *   calificacionFinal_materia: string,
 *   semestre_materia: string,
 *   periodo: string
 * }
 */
final readonly class LegacyCertificadoTimbradoExportData
{
    /**
     * @param  CertificadoLegacy  $e11superiorCert
     * @param  list<MateriaLegacy>  $e11materiasCert
     * @param  list<string>  $errores
     */
    public function __construct(
        public int $documentoId,
        public ?string $urlShort,
        public array $e11superiorCert,
        public array $e11materiasCert,
        public bool $valido,
        public array $errores = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'documento_id' => $this->documentoId,
            'url_short' => $this->urlShort,
            'e11superior_cert' => $this->e11superiorCert,
            'e11materias_cert' => $this->e11materiasCert,
            'validacion' => [
                'valido' => $this->valido,
                'errores' => $this->errores,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toResponseArray(): array
    {
        return [
            'success' => $this->valido,
            'message' => $this->valido
                ? 'JSON legacy generado correctamente.'
                : 'El documento no cumple requisitos para exportación legacy.',
            'data' => $this->toArray(),
        ];
    }
}

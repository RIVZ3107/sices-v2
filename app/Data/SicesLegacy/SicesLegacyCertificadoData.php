<?php

declare(strict_types=1);

namespace App\Data\SicesLegacy;

final readonly class SicesLegacyCertificadoData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public ?int $idSices,
        public ?string $curp,
        public ?string $matricula,
        public ?string $nombreCompleto,
        public ?string $tipoCertificado,
        public ?string $cicloEscolar,
        public ?string $urlShort,
        public ?string $folioDigitalSep,
        public ?string $osituac,
        public ?string $istatus,
        public ?int $opdf,
        public bool $tieneXmlLocal,
        public bool $tieneXmlSep,
        public ?string $fechaModificacion,
        public ?string $institucion,
        public ?string $cct,
        public ?string $carrera,
        public ?string $planEstudios,
        public array $raw = [],
    ) {}

    public function timbrado(): bool
    {
        $sit = strtoupper(trim((string) $this->osituac));

        return $this->tieneXmlSep
            || $sit === 'F'
            || $sit === 'T'
            || (trim((string) $this->folioDigitalSep) !== '');
    }

    public function pdfGenerado(): bool
    {
        return (int) $this->opdf === 1;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id_sices' => $this->idSices,
            'curp' => $this->curp,
            'matricula' => $this->matricula,
            'nombre_completo' => $this->nombreCompleto,
            'tipo_certificado' => $this->tipoCertificado,
            'ciclo_escolar' => $this->cicloEscolar,
            'url_short' => $this->urlShort,
            'folio_digital_sep' => $this->folioDigitalSep,
            'osituac' => $this->osituac,
            'istatus' => $this->istatus,
            'opdf' => $this->opdf,
            'tiene_xml_local' => $this->tieneXmlLocal,
            'tiene_xml_sep' => $this->tieneXmlSep,
            'timbrado' => $this->timbrado(),
            'pdf_generado' => $this->pdfGenerado(),
            'fecha_modificacion' => $this->fechaModificacion,
            'institucion' => $this->institucion,
            'cct' => $this->cct,
            'carrera' => $this->carrera,
            'plan_estudios' => $this->planEstudios,
        ];
    }
}

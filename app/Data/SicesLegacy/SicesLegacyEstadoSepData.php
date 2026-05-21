<?php

declare(strict_types=1);

namespace App\Data\SicesLegacy;

final readonly class SicesLegacyEstadoSepData
{
    public function __construct(
        public bool $existeEnSices,
        public bool $timbrado,
        public bool $pdfGenerado,
        public ?string $folioDigitalSep,
        public ?string $urlShort,
        public ?string $tipoCertificado,
        public ?string $cicloEscolar,
        public ?string $osituac,
        public ?string $istatus,
        public ?string $ultimaActualizacion,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'existe_en_sices' => $this->existeEnSices,
            'timbrado' => $this->timbrado,
            'pdf_generado' => $this->pdfGenerado,
            'folio_digital_sep' => $this->folioDigitalSep,
            'url_short' => $this->urlShort,
            'tipo_certificado' => $this->tipoCertificado,
            'ciclo_escolar' => $this->cicloEscolar,
            'osituac' => $this->osituac,
            'istatus' => $this->istatus,
            'ultima_actualizacion' => $this->ultimaActualizacion,
        ];
    }

    public static function vacio(): self
    {
        return new self(
            existeEnSices: false,
            timbrado: false,
            pdfGenerado: false,
            folioDigitalSep: null,
            urlShort: null,
            tipoCertificado: null,
            cicloEscolar: null,
            osituac: null,
            istatus: null,
            ultimaActualizacion: null,
        );
    }
}

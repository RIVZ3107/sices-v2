<?php

declare(strict_types=1);

namespace App\Data\Firma;

final readonly class FirmaDocumentoResult
{
    /**
     * @param  list<string>  $errors
     */
    public function __construct(
        public bool $success,
        public string $message,
        public int $documentoId,
        public ?string $urlShort = null,
        public ?string $folioDigitalSep = null,
        public string $estadoFirma = 'no_firmado',
        public ?string $errorCode = null,
        public array $errors = [],
        public ?string $canalFirma = null,
        public ?bool $pdfGenerado = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toResponseArray(): array
    {
        if (! $this->success) {
            return [
                'success' => false,
                'message' => $this->message,
                'error_code' => $this->errorCode,
                'errors' => $this->errors,
                'data' => array_filter([
                    'documento_id' => $this->documentoId,
                    'estado_firma' => $this->estadoFirma,
                    'url_short' => $this->urlShort,
                    'canal_firma' => $this->canalFirma,
                ]),
            ];
        }

        return [
            'success' => true,
            'message' => $this->message,
            'data' => array_filter([
                'documento_id' => $this->documentoId,
                'url_short' => $this->urlShort,
                'folio_digital_sep' => $this->folioDigitalSep,
                'estado_firma' => $this->estadoFirma,
                'canal_firma' => $this->canalFirma,
                'pdf_generado' => $this->pdfGenerado,
            ], fn ($v) => $v !== null),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Data\SicesLegacy;

final readonly class ShadowExportResult
{
    /**
     * @param  list<string>  $errors
     */
    public function __construct(
        public bool $success,
        public string $message,
        public ?int $documentoId = null,
        public ?string $urlShort = null,
        public ?string $legacyId = null,
        public int $materiasExportadas = 0,
        public array $errors = [],
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
                'errors' => $this->errors,
            ];
        }

        return [
            'success' => true,
            'message' => $this->message,
            'data' => [
                'documento_id' => $this->documentoId,
                'url_short' => $this->urlShort,
                'legacy_id' => $this->legacyId,
                'materias_exportadas' => $this->materiasExportadas,
            ],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Data\Legacy;

final readonly class LegacyShadowResult
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public bool $success,
        public string $message,
        public ?string $legacyCertId = null,
        public ?string $urlShort = null,
        public array $metadata = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'legacy_cert_id' => $this->legacyCertId,
            'url_short' => $this->urlShort,
            'metadata' => $this->metadata,
        ];
    }
}

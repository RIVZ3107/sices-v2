<?php

declare(strict_types=1);

namespace Tests\Support\Since;

use App\Data\Firma\SinceFirmaResponse;
use App\Infrastructure\Since\SinceFirmaClient;
use App\Services\Certificacion\OpenSslSelloService;

/**
 * Cliente fake para tests (sin HTTP al servicio 34).
 */
final class FakeSinceFirmaClient extends SinceFirmaClient
{
    /** @var list<array{url_short: string, prod: bool|null}> */
    public array $calls = [];

    public ?SinceFirmaResponse $nextResponse = null;

    public function __construct(?OpenSslSelloService $openSsl = null)
    {
        parent::__construct($openSsl ?? app(OpenSslSelloService::class));
    }

    public function firmarPorUrlShort(string $urlShort, ?bool $produccion = null): SinceFirmaResponse
    {
        $this->calls[] = [
            'url_short' => $urlShort,
            'prod' => $produccion,
        ];

        if ($this->nextResponse !== null) {
            return $this->nextResponse;
        }

        return new SinceFirmaResponse(
            success: true,
            message: 'Firma fake OK.',
            xmlFirmado: '<?xml version="1.0"?><DecFirmadoSEP/>',
            folioDigital: 'FOLIO-FAKE-001',
            selloSep: 'SELLO-FAKE-SEP',
            httpStatus: 200,
            simulada: true,
            rawSanitized: ['modo' => 'fake_test'],
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Infrastructure\Since\SinceFirmaClient;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Services\Firma\LegacySinceSigningBridgeService;
use Illuminate\Console\Command;

/**
 * Prueba manual contra el servicio 34 real. No usar en tests automatizados.
 */
class SinceFirmaTestCommand extends Command
{
    protected $signature = 'since:firma-test
                            {urlshort : Token url_short del certificado en legacy}
                            {--prod=0 : 1=producción (34), 0=desarrollo (38)}
                            {--persist : Persistir resultado en MySQL vía bridge (requiere documento con metadata)}';

    protected $description = 'Prueba manual de firma SEP/SINCE (servicio 34) por urlshort+prod';

    public function handle(SinceFirmaClient $client, LegacySinceSigningBridgeService $bridge): int
    {
        if (! $client->firmaHabilitada()) {
            $this->error('SINCE_FIRMA_ENABLED=false. Active la firma en .env antes de probar.');

            return self::FAILURE;
        }

        $urlShort = trim((string) $this->argument('urlshort'));
        $prod = filter_var($this->option('prod'), FILTER_VALIDATE_BOOL);

        $this->info('Llamando servicio 34…');
        $this->line('  urlshort: '.$urlShort);
        $this->line('  prod: '.($prod ? '1' : '0'));
        $this->line('  endpoint: '.($prod ? config('since.firma.prod_url') : config('since.firma.dev_url')));

        if ($this->option('persist')) {
            $documento = DocumentoAcademico::query()
                ->where('token_consulta_publica', $urlShort)
                ->orWhere('metadata->legacy_shadow->url_short', $urlShort)
                ->first();

            if ($documento === null) {
                $this->error('No se encontró documento_academico para urlshort (--persist).');

                return self::FAILURE;
            }

            $result = $bridge->firmar($documento);
            $this->table(
                ['campo', 'valor'],
                [
                    ['success', $result->success ? 'true' : 'false'],
                    ['message', $result->message],
                    ['estado_firma', $result->estadoFirma],
                    ['folio_digital_sep', $result->folioDigitalSep ?? '—'],
                    ['error_code', $result->errorCode ?? '—'],
                ],
            );

            return $result->success ? self::SUCCESS : self::FAILURE;
        }

        $respuesta = $client->firmarPorUrlShort($urlShort, $prod);

        $this->table(
            ['campo', 'valor'],
            [
                ['HTTP', (string) ($respuesta->httpStatus ?? '—')],
                ['success', $respuesta->success ? 'true' : 'false'],
                ['message', $respuesta->message],
                ['error_code', $respuesta->errorCode ?? '—'],
                ['folioDigital', $respuesta->folioDigital ?? '—'],
                ['xml_firmado_len', $respuesta->xmlFirmado !== null ? (string) strlen($respuesta->xmlFirmado) : '0'],
                ['sello_sep_len', $respuesta->selloSep !== null ? (string) strlen($respuesta->selloSep) : '0'],
            ],
        );

        if (! $respuesta->success) {
            $this->warn('Respuesta SEP (sanitizada):');
            $this->line(json_encode($respuesta->rawSanitized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return self::FAILURE;
        }

        $this->info('Firma OK (sin persistir en BD).');

        if (DocumentoFirma::query()->exists()) {
            $this->comment('Nota: no se guardó registro en documento_firmas (sin --persist).');
        }

        return self::SUCCESS;
    }
}

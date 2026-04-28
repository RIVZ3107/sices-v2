<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Exceptions\Certificacion\JasperRenderRealNoDisponibleException;
use App\Models\PlantillaDocumento;

/**
 * Fachada de render PDF vía Jasper. En este bloque solo hay generación simulada; sin JavaBridge ni .jasper reales.
 */
class JasperRenderService
{
    public function __construct(
        protected OpenSslSelloService $openSsl,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function render(array $payload, PlantillaDocumento $plantilla): string
    {
        if ($this->debeRenderizarEnModoSimulado()) {
            return $this->renderSimulado($payload, $plantilla);
        }

        if (! (bool) config('certificacion.jasper.enabled', false)) {
            throw new JasperRenderRealNoDisponibleException(
                'Jasper está deshabilitado (JASPER_ENABLED=false); use generación simulada o habilite el motor al integrar JavaBridge.'
            );
        }

        throw new JasperRenderRealNoDisponibleException(
            'Render Jasper real (compilación + JavaBridge) no implementado en este bloque.'
        );
    }

    /**
     * PDF mínimo de pruebas; no es un documento oficial ni representa salida Jasper.
     *
     * @param  array<string, mixed>  $payload
     */
    public function renderSimulado(array $payload, PlantillaDocumento $plantilla): string
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $ref = hash('sha256', (string) $json).'|'.$plantilla->codigo;
        $sello = $this->openSsl->sellarCadenaSimulada($ref);

        return $this->construirPdfBinarioSimulado($plantilla->codigo, $sello, $ref);
    }

    public function debeRenderizarEnModoSimulado(): bool
    {
        $sim = (bool) config('certificacion.pdf.simulada', true);
        $jasperOn = (bool) config('certificacion.jasper.enabled', false);

        return $sim || ! $jasperOn;
    }

    /**
     * Bytes de marcador tipo PDF (no garantiza parseo por visor; suficiente para hash/versionamiento interno).
     */
    protected function construirPdfBinarioSimulado(string $codigoPlantilla, string $selloB64, string $refHash): string
    {
        return implode("\n", [
            '%PDF-1.4',
            '% SICES — PDF base simulado; sin Jasper/JavaBridge real.',
            '% plantilla_codigo: '.$codigoPlantilla,
            '% ref_digest: '.$refHash,
            '% sello_simulado_b64: '.$selloB64,
            '%%EOF',
        ]);
    }
}

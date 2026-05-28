<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Enums\Certificacion\EstadoFirma;
use App\Exceptions\Legacy\SicesLegacyDisabledException;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\DocumentoVersion;
use App\Support\Certificacion\CertificadoXmlParser;
use Illuminate\Validation\ValidationException;

/**
 * Orquesta XML (MySQL v2 o Informix legacy) → JSON de vista para plantilla PDF en React.
 */
class CertificadoVistaJsonService
{
    public function __construct(
        protected SicesLegacyCertificadoRepositoryInterface $legacyCertificados,
        protected CertificadoXmlParser $xmlParser,
        protected JasperPayloadBuilder $jasperPayloadBuilder,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function construirVista(DocumentoAcademico $documento, bool $requiereFirmado = true): array
    {
        $documento = $documento->fresh([
            'alumno',
            'institucion',
            'sede',
            'ofertaAcademica.programaEstudio',
            'materiasSnapshot',
        ]);

        if ($requiereFirmado && $documento->estado_firma !== EstadoFirma::FIRMADO->value) {
            throw ValidationException::withMessages([
                'estado_firma' => ['El certificado PDF solo está disponible cuando el documento está firmado.'],
            ]);
        }

        $urlShort = $this->resolverUrlShort($documento);
        $xmlPack = $this->resolverXml($documento, $urlShort);

        $alumno = $documento->alumno;
        $nombreAlumno = trim(implode(' ', array_filter([
            $alumno?->nombre,
            $alumno?->primer_apellido,
            $alumno?->segundo_apellido,
        ])));

        $materias = $documento->materiasSnapshot
            ->sortBy('orden')
            ->values()
            ->map(fn (DocumentoMateriaSnapshot $m) => [
                'clave' => $m->clave,
                'nombre' => $m->nombre,
                'calificacion' => $m->calificacion_final,
                'semestre' => $m->semestre,
                'periodo' => $m->periodo,
            ])
            ->all();

        $parseado = $xmlPack['contenido'] !== ''
            ? $this->xmlParser->parse($xmlPack['contenido'])
            : [];

        $plantilla = [];
        try {
            $plantilla = $this->jasperPayloadBuilder->construirPayloadRender($documento);
        } catch (\Throwable) {
            $plantilla = [];
        }

        return [
            'documento' => [
                'folio_interno' => $documento->folio_interno,
                'folio_digital_sep' => $documento->folio_digital_sep ?? ($parseado['folio_digital'] ?? null),
                'tipo_documento' => $documento->tipo_documento,
                'fecha_firma' => $documento->fecha_firma?->toIso8601String(),
                'estado_firma' => $documento->estado_firma,
            ],
            'alumno' => [
                'nombre_completo' => $nombreAlumno !== '' ? $nombreAlumno : ($parseado['nombre'] ?? null),
                'curp' => $alumno?->curp ?? ($parseado['curp'] ?? null),
            ],
            'institucion' => [
                'nombre' => $documento->institucion?->nombre ?? ($parseado['institucion'] ?? null),
                'sede' => $documento->sede?->nombre,
                'programa' => $documento->ofertaAcademica?->programaEstudio?->nombre ?? ($parseado['carrera'] ?? null),
            ],
            'materias' => $materias !== [] ? $materias : ($parseado['materias'] ?? []),
            'xml' => [
                'fuente' => $xmlPack['fuente'],
                'url_short' => $urlShort,
                'parseado' => $parseado,
            ],
            'plantilla_pdf' => $plantilla,
        ];
    }

    /**
     * @return array{fuente: string, contenido: string}
     */
    protected function resolverXml(DocumentoAcademico $documento, ?string $urlShort): array
    {
        foreach (['XML_FIRMADO_SEP', 'XML_ORIGINAL', 'XML_DEC'] as $tipo) {
            $version = DocumentoVersion::query()
                ->where('documento_academico_id', $documento->id)
                ->where('tipo', $tipo)
                ->where('activo', true)
                ->orderByDesc('id')
                ->first();

            if ($version !== null && trim((string) $version->contenido) !== '') {
                return ['fuente' => 'mysql_'.$tipo, 'contenido' => (string) $version->contenido];
            }
        }

        if ($urlShort !== null && config('sices_legacy.enabled')) {
            try {
                $xmlInformix = $this->legacyCertificados->obtenerXmlSepPorUrlShort($urlShort);
                if ($xmlInformix !== null && trim($xmlInformix) !== '') {
                    return ['fuente' => 'informix_xml_sep', 'contenido' => $xmlInformix];
                }
            } catch (SicesLegacyDisabledException) {
                // Sin Informix: solo MySQL.
            }
        }

        return ['fuente' => 'ninguna', 'contenido' => ''];
    }

    protected function resolverUrlShort(DocumentoAcademico $documento): ?string
    {
        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $shadow = is_array($meta['legacy_shadow'] ?? null) ? $meta['legacy_shadow'] : [];
        $token = trim((string) ($shadow['url_short'] ?? $documento->token_consulta_publica ?? ''));

        return $token !== '' ? $token : null;
    }
}

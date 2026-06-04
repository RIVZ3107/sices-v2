<?php

declare(strict_types=1);

namespace App\Services\Importacion;

/**
 * Contabilidad por entidad: leídos = insertar + actualizar + omitidos
 * (ofertas: candidatos_generados = insertar + actualizar + omitidos).
 */
final class SiseesCatalogosEntidadResumen
{
    private const MAX_MUESTRAS = 25;

    /** @var array<string, int> */
    private array $omitidosPorMotivo = [];

    /** @var list<array{legacy_id: int|string|null, motivo: string, detalle: string}> */
    private array $muestrasOmitidos = [];

    public function __construct(
        public readonly string $entidad,
        public string $tablaLegacy = '',
        public int $leidos = 0,
        public int $insertar = 0,
        public int $actualizar = 0,
        public int $omitidos = 0,
        public ?int $registrosLegacyLeidos = null,
        public ?int $candidatosGenerados = null,
    ) {}

    public static function crear(string $entidad, string $tablaLegacy = ''): self
    {
        return new self($entidad, $tablaLegacy);
    }

    public function contarLeido(): void
    {
        $this->leidos++;
    }

    /** @var list<array<string, mixed>> */
    private array $muestrasInsertar = [];

    public function contarInsertar(): void
    {
        $this->insertar++;
    }

    /**
     * @param  array<string, mixed>  $muestra
     */
    public function contarInsertarConMuestra(array $muestra): void
    {
        $this->insertar++;
        if (count($this->muestrasInsertar) < self::MAX_MUESTRAS) {
            $this->muestrasInsertar[] = $muestra;
        }
    }

    public function contarActualizar(): void
    {
        $this->actualizar++;
    }

    public function omitir(string $motivo, int|string|null $legacyId, string $detalle): void
    {
        $this->omitidos++;
        $this->omitidosPorMotivo[$motivo] = ($this->omitidosPorMotivo[$motivo] ?? 0) + 1;

        if (count($this->muestrasOmitidos) < self::MAX_MUESTRAS) {
            $this->muestrasOmitidos[] = [
                'legacy_id' => $legacyId,
                'motivo' => $motivo,
                'detalle' => $detalle,
            ];
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $out = [
            'entidad' => $this->entidad,
            'tabla_legacy' => $this->tablaLegacy,
            'leidos' => $this->leidos,
            'insertar' => $this->insertar,
            'actualizar' => $this->actualizar,
            'omitidos' => $this->omitidos,
            'omitidos_por_motivo' => $this->omitidosPorMotivo,
            'muestras_omitidos' => $this->muestrasOmitidos,
            'muestras_insertar' => $this->muestrasInsertar,
        ];

        if ($this->registrosLegacyLeidos !== null) {
            $out['registros_legacy_leidos'] = $this->registrosLegacyLeidos;
        }
        if ($this->candidatosGenerados !== null) {
            $out['candidatos_generados'] = $this->candidatosGenerados;
        }

        return $out;
    }

    /**
     * @return list<string> errores de contabilidad
     */
    public function validarContabilidad(): array
    {
        $errores = [];

        if ($this->candidatosGenerados !== null) {
            $suma = $this->insertar + $this->actualizar + $this->omitidos;
            if ($suma !== $this->candidatosGenerados) {
                $errores[] = sprintf(
                    '%s: candidatos_generados (%d) ≠ insertar+actualizar+omitidos (%d+%d+%d=%d)',
                    $this->entidad,
                    $this->candidatosGenerados,
                    $this->insertar,
                    $this->actualizar,
                    $this->omitidos,
                    $suma,
                );
            }

            return $errores;
        }

        $suma = $this->insertar + $this->actualizar + $this->omitidos;
        if ($this->leidos !== $suma) {
            $errores[] = sprintf(
                '%s: leídos (%d) ≠ insertar+actualizar+omitidos (%d+%d+%d=%d)',
                $this->entidad,
                $this->leidos,
                $this->insertar,
                $this->actualizar,
                $this->omitidos,
                $suma,
            );
        }

        return $errores;
    }
}

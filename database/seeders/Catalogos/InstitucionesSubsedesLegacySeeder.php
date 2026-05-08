<?php

declare(strict_types=1);

namespace Database\Seeders\Catalogos;

use App\Models\Institucion;
use App\Models\Sede;
use Illuminate\Database\Seeder;
use RuntimeException;

final class InstitucionesSubsedesLegacySeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/e11instituciones_subsedes.json');
        if (! is_file($path)) {
            throw new RuntimeException('No se encontró archivo fuente: '.$path);
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('No fue posible leer archivo fuente: '.$path);
        }

        try {
            /** @var mixed $payload */
            $payload = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new RuntimeException('JSON inválido en '.$path.': '.$e->getMessage(), previous: $e);
        }

        if (! is_array($payload)) {
            throw new RuntimeException('El catálogo legacy de subsedes debe ser un arreglo JSON.');
        }

        $faltantes = [];
        $filasActivas = [];
        foreach ($payload as $row) {
            if (! is_array($row)) {
                continue;
            }
            if (strtoupper(trim((string) ($row['istatus'] ?? ''))) !== 'A') {
                continue;
            }

            $rcve = (string) ($row['rcve_institucion'] ?? '');
            $institucion = $this->buscarInstitucionPadre($rcve);
            if ($institucion === null) {
                $faltantes[$rcve] = true;
                continue;
            }
            if ((int) ($institucion->subsistema_id ?? 0) <= 0) {
                throw new RuntimeException('La institución padre '.$rcve.' no tiene subsistema_id configurado.');
            }
            $filasActivas[] = [$row, $institucion];
        }

        if ($faltantes !== []) {
            $listado = implode(', ', array_keys($faltantes));
            throw new RuntimeException(
                'No se encontró institución padre para rcve_institucion: '.$listado.'. Ejecuta primero el seeder de instituciones.'
            );
        }

        $leidos = count($payload);
        $procesados = 0;
        foreach ($filasActivas as [$row, $institucion]) {
            $kcve = (int) ($row['kcve_subsede'] ?? 0);
            $nombre = mb_strtoupper(trim((string) ($row['nombre_subsede'] ?? '')), 'UTF-8');
            if ($kcve <= 0 || $nombre === '') {
                continue;
            }

            Sede::query()->updateOrCreate(
                ['legacy_kcve_subsede' => $kcve],
                [
                    'institucion_id' => (int) $institucion->id,
                    'region_id' => $institucion->region_id,
                    'clave' => 'LEGACY-SUBSEDE-'.$kcve,
                    'cct' => null,
                    'nombre' => $nombre,
                    'nombre_corto' => null,
                    'tipo_sede' => 'subsede_legacy',
                    'activo' => true,
                    'legacy_rcve_institucion' => (int) ($row['rcve_institucion'] ?? 0),
                    'legacy_rcvect' => (int) ($row['rcvect'] ?? 0),
                    'metadata' => [
                        'origen' => 'catalogo_legacy_e11instituciones_subsedes',
                        'legacy' => [
                            'kcve_subsede' => $kcve,
                            'rcve_institucion' => (int) ($row['rcve_institucion'] ?? 0),
                            'rcvect' => (int) ($row['rcvect'] ?? 0),
                            'ifecreg' => $row['ifecreg'] ?? null,
                            'iusrreg' => $row['iusrreg'] ?? null,
                            'ifecmod' => $row['ifecmod'] ?? null,
                            'iusrmod' => $row['iusrmod'] ?? null,
                        ],
                    ],
                ]
            );
            $procesados++;
        }

        $total = Sede::query()
            ->where('metadata->origen', 'catalogo_legacy_e11instituciones_subsedes')
            ->where('activo', true)
            ->count();

        $this->command?->line('Subsedes legacy leídas: '.$leidos);
        $this->command?->line('Subsedes legacy activas: '.count($filasActivas));
        $this->command?->line('Subsedes legacy procesadas: '.$procesados);
        $this->command?->line('Total final subsedes legacy activas: '.$total);
    }

    private function buscarInstitucionPadre(string $rcveInstitucion): ?Institucion
    {
        $rcveInstitucion = trim($rcveInstitucion);
        if ($rcveInstitucion === '') {
            return null;
        }

        return Institucion::query()
            ->where('clave', $rcveInstitucion)
            ->orWhere('metadata->legacy->rcve_institucion', (int) $rcveInstitucion)
            ->first();
    }
}

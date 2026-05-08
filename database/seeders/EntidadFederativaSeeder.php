<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EntidadFederativa;
use Illuminate\Database\Seeder;
use RuntimeException;

class EntidadFederativaSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/e11entidadesfederativas.json');
        if (! is_file($path)) {
            throw new RuntimeException('No se encontró el archivo de entidades federativas: '.$path);
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('No fue posible leer el archivo de entidades federativas: '.$path);
        }

        try {
            /** @var mixed $decoded */
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new RuntimeException('JSON inválido en '.$path.': '.$e->getMessage(), previous: $e);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('El archivo de entidades federativas debe contener un arreglo JSON de registros.');
        }

        $totalLeidos = count($decoded);
        $totalActivosDetectados = 0;
        $procesados = 0;

        foreach ($decoded as $row) {
            if (! is_array($row)) {
                continue;
            }

            $istatus = strtoupper(trim((string) ($row['istatus'] ?? '')));
            if ($istatus !== 'A') {
                continue;
            }
            $totalActivosDetectados++;

            $id = (int) ($row['id_entidad_federativa'] ?? 0);
            $nombreOficial = trim((string) ($row['c_nom_ent'] ?? ''));
            $abreviatura = $this->cleanAbreviatura((string) ($row['c_entidad_abr'] ?? ''));

            if ($id <= 0 || $nombreOficial === '' || $abreviatura === '') {
                continue;
            }

            EntidadFederativa::query()->updateOrCreate(
                ['id' => $id],
                [
                    'clave_entidad' => str_pad((string) $id, 2, '0', STR_PAD_LEFT),
                    'nombre' => $this->toTitleCase($nombreOficial),
                    'nombre_oficial' => mb_strtoupper($nombreOficial, 'UTF-8'),
                    'abreviatura' => $abreviatura,
                    'estatus' => 'activo',
                    'metadata' => [
                        'istatus_original' => 'A',
                        'fuente' => 'e11entidadesfederativas.json',
                    ],
                ]
            );
            $procesados++;
        }

        $totalFinal = EntidadFederativa::query()->activos()->count();

        $this->command?->line('Registros leídos: '.$totalLeidos);
        $this->command?->line('Registros activos detectados: '.$totalActivosDetectados);
        $this->command?->line('Registros procesados: '.$procesados);
        $this->command?->line('Total final de entidades federativas: '.$totalFinal);

        if ($totalFinal !== 32) {
            throw new RuntimeException('El total final de entidades federativas debe ser 32 y se obtuvo '.$totalFinal.'.');
        }
    }

    private function toTitleCase(string $nombre): string
    {
        $nombre = mb_strtolower(trim($nombre), 'UTF-8');

        return mb_convert_case($nombre, MB_CASE_TITLE, 'UTF-8');
    }

    private function cleanAbreviatura(string $abreviatura): string
    {
        $abbr = trim($abreviatura);
        $abbr = rtrim($abbr, '.');
        $abbr = preg_replace('/\s+/', ' ', $abbr) ?? $abbr;

        return mb_strtoupper($abbr, 'UTF-8');
    }
}

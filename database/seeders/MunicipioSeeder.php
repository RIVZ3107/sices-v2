<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EntidadFederativa;
use App\Models\Municipio;
use Illuminate\Database\Seeder;
use RuntimeException;

class MunicipioSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/e11municipios.json');
        if (! is_file($path)) {
            throw new RuntimeException('No se encontró el archivo de municipios: '.$path);
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('No fue posible leer el archivo de municipios: '.$path);
        }

        try {
            /** @var mixed $decoded */
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new RuntimeException('JSON inválido en '.$path.': '.$e->getMessage(), previous: $e);
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('El archivo de municipios debe contener un arreglo JSON de registros.');
        }

        $totalLeidos = count($decoded);
        $totalActivosDetectados = 0;
        $procesados = 0;

        foreach ($decoded as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }

            $istatus = strtoupper(trim((string) ($row['istatus'] ?? '')));
            if ($istatus !== 'A') {
                continue;
            }
            $totalActivosDetectados++;

            $entidadId = (int) ($row['kid_entidad_federativa'] ?? 0);
            $clave = str_pad(trim((string) ($row['cv_mun'] ?? '')), 3, '0', STR_PAD_LEFT);
            $nombreOficial = trim((string) ($row['c_nom_mun'] ?? ''));

            if ($entidadId <= 0 || $clave === '' || mb_strlen($clave) !== 3 || $nombreOficial === '') {
                continue;
            }

            if (! EntidadFederativa::query()->whereKey($entidadId)->exists()) {
                continue;
            }

            Municipio::query()->updateOrCreate(
                [
                    'entidad_federativa_id' => $entidadId,
                    'clave_municipio' => $clave,
                ],
                [
                    'nombre' => $this->toTitleCase($nombreOficial),
                    'nombre_oficial' => mb_strtoupper($nombreOficial, 'UTF-8'),
                    'estatus' => 'activo',
                    'metadata' => [
                        'istatus_original' => 'A',
                        'fuente' => 'e11municipios.json',
                    ],
                ]
            );
            $procesados++;
        }

        $totalFinalEdomex = Municipio::query()
            ->where('entidad_federativa_id', 15)
            ->where('estatus', 'activo')
            ->count();

        $this->command?->line('Registros leídos: '.$totalLeidos);
        $this->command?->line('Registros activos detectados: '.$totalActivosDetectados);
        $this->command?->line('Registros procesados: '.$procesados);
        $this->command?->line('Total final de municipios EdoMéx: '.$totalFinalEdomex);

        if ($totalFinalEdomex !== 125) {
            throw new RuntimeException('El total final de municipios activos de EdoMéx debe ser 125 y se obtuvo '.$totalFinalEdomex.'.');
        }
    }

    private function toTitleCase(string $nombre): string
    {
        $nombre = mb_strtolower(trim($nombre), 'UTF-8');

        return mb_convert_case($nombre, MB_CASE_TITLE, 'UTF-8');
    }
}

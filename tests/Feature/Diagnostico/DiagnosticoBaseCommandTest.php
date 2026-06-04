<?php

declare(strict_types=1);

namespace Tests\Feature\Diagnostico;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

final class DiagnosticoBaseCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        putenv('ALLOW_DEMO_SEEDERS');
        unset($_ENV['ALLOW_DEMO_SEEDERS'], $_SERVER['ALLOW_DEMO_SEEDERS']);
        parent::tearDown();
    }

    public function test_comando_existe_y_corre_sin_borrar_datos(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=false');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'false';

        $this->seed(DatabaseSeeder::class);
        $usersAntes = User::query()->count();

        $exit = Artisan::call('sices:diagnosticar-base');

        $this->assertSame(0, $exit);
        $this->assertSame($usersAntes, User::query()->count());
    }

    public function test_genera_markdown_y_json(): void
    {
        $this->seed(DatabaseSeeder::class);

        Artisan::call('sices:diagnosticar-base');

        $dir = storage_path('app/reportes/diagnostico-base');
        $this->assertDirectoryExists($dir);

        $md = glob($dir.DIRECTORY_SEPARATOR.'diagnostico_base_*.md');
        $json = glob($dir.DIRECTORY_SEPARATOR.'diagnostico_base_*.json');

        $this->assertNotEmpty($md);
        $this->assertNotEmpty($json);
        $this->assertStringContainsString('Diagnóstico de base', (string) file_get_contents($md[0]));

        $payload = json_decode((string) file_get_contents($json[0]), true);
        $this->assertIsArray($payload);
        $this->assertArrayHasKey('tablas', $payload);
        $this->assertArrayHasKey('recomendaciones', $payload);
    }

    public function test_no_falla_sin_columna_estatus_ni_clave_ni_tabla_vacia(): void
    {
        $this->seed(DatabaseSeeder::class);

        $exit = Artisan::call('sices:diagnosticar-base');

        $this->assertSame(0, $exit);

        $jsonFiles = glob(storage_path('app/reportes/diagnostico-base/diagnostico_base_*.json'));
        $this->assertNotEmpty($jsonFiles);
        $data = json_decode((string) file_get_contents($jsonFiles[count($jsonFiles) - 1]), true);

        $programas = collect($data['tablas'] ?? [])->firstWhere('tabla', 'programas_estudio');
        $this->assertNotNull($programas);
        $this->assertNotContains('estatus', $programas['columnas'] ?? []);

        $output = Artisan::output();
        $this->assertStringNotContainsString('SQLSTATE', $output);
    }

    public function test_limpia_archivos_generados_en_tear_down(): void
    {
        $dir = storage_path('app/reportes/diagnostico-base');
        if (File::isDirectory($dir)) {
            foreach (glob($dir.DIRECTORY_SEPARATOR.'diagnostico_base_*') ?: [] as $f) {
                @unlink($f);
            }
        }
        $this->assertTrue(true);
    }
}

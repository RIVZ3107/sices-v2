<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogos;

use App\Models\Institucion;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use Database\Seeders\Catalogos\InstitucionesSubsedesLegacySeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InstitucionesSubsedesLegacySeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->crearInstitucionesPadreLegacy();
    }

    public function test_carga_14_subsedes_y_no_duplica(): void
    {
        $this->seed(InstitucionesSubsedesLegacySeeder::class);
        $this->assertSame(14, Sede::query()->whereNotNull('legacy_kcve_subsede')->count());

        $this->seed(InstitucionesSubsedesLegacySeeder::class);
        $this->assertSame(14, Sede::query()->whereNotNull('legacy_kcve_subsede')->count());
    }

    public function test_relaciones_principales_por_institucion_padre(): void
    {
        $this->seed(InstitucionesSubsedesLegacySeeder::class);

        $toluca151 = Sede::query()->where('legacy_kcve_subsede', 1)->firstOrFail();
        $this->assertSame(150005, (int) $toluca151->legacy_rcve_institucion);
        $this->assertSame('U.P.N. UNIDAD 151 TOLUCA', $toluca151->nombre);

        $acambay = Sede::query()->where('legacy_kcve_subsede', 2)->firstOrFail();
        $this->assertSame(150005, (int) $acambay->legacy_rcve_institucion);

        $unidad152 = Sede::query()->where('legacy_kcve_subsede', 6)->firstOrFail();
        $this->assertSame(150474, (int) $unidad152->legacy_rcve_institucion);
        $this->assertSame('U.P.N. UNIDAD 152 ATIZAPÁN', $unidad152->nombre);

        $nicolas = Sede::query()->where('legacy_kcve_subsede', 14)->firstOrFail();
        $this->assertSame(150474, (int) $nicolas->legacy_rcve_institucion);

        $ensvt = Sede::query()->where('legacy_kcve_subsede', 10)->firstOrFail();
        $this->assertSame(150162, (int) $ensvt->legacy_rcve_institucion);

        $normalRural = Sede::query()->where('legacy_kcve_subsede', 13)->firstOrFail();
        $this->assertSame(150012, (int) $normalRural->legacy_rcve_institucion);
    }

    public function test_falla_si_falta_institucion_padre(): void
    {
        Institucion::query()->where('clave', '150005')->delete();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('No se encontró institución padre para rcve_institucion: 150005');
        $this->seed(InstitucionesSubsedesLegacySeeder::class);
    }

    public function test_endpoint_catalogos_sedes_filtra_por_institucion(): void
    {
        $this->seed(InstitucionesSubsedesLegacySeeder::class);

        $u = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        Permission::findOrCreate('ver_catalogos', 'web');
        $u->assignRole('superadmin');
        $u->givePermissionTo('ver_catalogos');
        Sanctum::actingAs($u);

        $inst = Institucion::query()->where('clave', '150474')->firstOrFail();
        $res = $this->getJson('/api/v1/catalogos/sedes?institucion_id='.$inst->id)
            ->assertOk();

        $names = collect($res->json('data'))->pluck('nombre')->all();
        $this->assertContains('U.P.N. UNIDAD 152 ATIZAPÁN', $names);
        $this->assertContains('REGIONAL NICOLÁS ROMERO', $names);
    }

    private function crearInstitucionesPadreLegacy(): void
    {
        $upn = Subsistema::query()->where('clave', 'UPN')->firstOrFail();
        $normal = Subsistema::query()->where('clave', 'NORMAL')->firstOrFail();

        $regionUpn = Region::query()->create([
            'subsistema_id' => $upn->id,
            'clave' => 'REG-UPN-LEG',
            'nombre' => 'REGIÓN UPN LEGACY',
            'activo' => true,
        ]);
        $regionNormal = Region::query()->create([
            'subsistema_id' => $normal->id,
            'clave' => 'REG-NORM-LEG',
            'nombre' => 'REGIÓN NORMAL LEGACY',
            'activo' => true,
        ]);

        $rows = [
            ['clave' => '150005', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id, 'nombre' => 'UPN LEGACY 150005'],
            ['clave' => '150474', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id, 'nombre' => 'UPN LEGACY 150474'],
            ['clave' => '150475', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id, 'nombre' => 'UPN LEGACY 150475'],
            ['clave' => '150162', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id, 'nombre' => 'NORMAL LEGACY 150162'],
            ['clave' => '150340', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id, 'nombre' => 'NORMAL LEGACY 150340'],
            ['clave' => '150012', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id, 'nombre' => 'NORMAL LEGACY 150012'],
        ];

        foreach ($rows as $r) {
            Institucion::query()->updateOrCreate(
                ['clave' => $r['clave']],
                [
                    'subsistema_id' => $r['subsistema_id'],
                    'region_id' => $r['region_id'],
                    'nombre' => $r['nombre'],
                    'activo' => true,
                    'metadata' => ['legacy' => ['rcve_institucion' => (int) $r['clave']]],
                ]
            );
        }
    }
}

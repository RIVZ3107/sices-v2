<?php

declare(strict_types=1);

namespace Tests\Unit\ControlEscolar;

use App\Models\MateriaCursada;
use App\Services\ControlEscolar\ControlEscolarDecDataValidator;
use Tests\TestCase;

class ControlEscolarDecDataValidatorTest extends TestCase
{
    public function test_falla_si_materia_sin_clave(): void
    {
        $errores = app(ControlEscolarDecDataValidator::class)->validarMateriasCursadas(collect([
            new MateriaCursada(['clave' => '', 'nombre' => 'X', 'calificacion' => 10, 'semestre' => 1]),
        ]));

        $this->assertNotEmpty($errores);
    }

    public function test_falla_si_materia_sin_periodo_ni_semestre(): void
    {
        $errores = app(ControlEscolarDecDataValidator::class)->validarMateriasCursadas(collect([
            new MateriaCursada(['clave' => 'MAT1', 'nombre' => 'X', 'calificacion' => 10]),
        ]));

        $this->assertNotEmpty($errores);
    }
}

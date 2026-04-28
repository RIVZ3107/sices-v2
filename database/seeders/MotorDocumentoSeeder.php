<?php

namespace Database\Seeders;

use App\Enums\Certificacion\MotorDocumento;
use Illuminate\Database\Seeder;

class MotorDocumentoSeeder extends Seeder
{
    /**
     * Motores declarados para plantillas PDF/documento (jasper|dompdf|browsershot).
     * Datos aplicados en PlantillaDocumentoSeeder cuando corresponda.
     */
    public function run(): void
    {
        foreach (MotorDocumento::cases() as $motor) {
            $this->command?->info("Motor documento: {$motor->value} — {$motor->label()}");
        }
    }
}

<?php

namespace Database\Seeders;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use Illuminate\Database\Seeder;

class EstadoCatalogoSeeder extends Seeder
{
    /**
     * No existe tabla dedicada de catálogo de estados.
     * Documentación única en config/certificacion.php y enums App\Enums\Certificacion\*.
     */
    public function run(): void
    {
        $mapa = [
            'workflow' => EstadoWorkflow::values(),
            'cadena' => EstadoCadena::values(),
            'xml' => EstadoXml::values(),
            'firma' => EstadoFirma::values(),
            'pdf' => EstadoPdf::values(),
        ];

        foreach ($mapa as $familia => $valores) {
            $lista = implode(', ', $valores);
            $this->command?->info("Estados {$familia}: {$lista}");
        }

        $this->command?->warn('Sin tabla física estados_catalogo: revise config/certificacion.php y enums.');
    }
}

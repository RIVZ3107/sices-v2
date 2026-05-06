<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReportDuplicadosMatriculaCommand extends Command
{
    protected $signature = 'sices:report-duplicados-matricula';

    protected $description = 'Lista alumnos con más de una matrícula activa (no eliminada por soft-delete).';

    public function handle(): int
    {
        $rows = DB::table('matriculas')
            ->select('alumno_id', DB::raw('COUNT(*) as total'))
            ->whereNull('deleted_at')
            ->groupBy('alumno_id')
            ->having('total', '>', 1)
            ->orderBy('alumno_id')
            ->get();

        if ($rows->isEmpty()) {
            $this->info('Sin duplicados detectados en matrículas activas.');

            return self::SUCCESS;
        }

        foreach ($rows as $row) {
            $this->line(sprintf('alumno_id=%s total_matriculas=%s', $row->alumno_id, $row->total));
        }

        $this->warn('Antes de forzar restricciones UNIQUE en base de datos, sane datos o migra registros históricos.');

        return self::SUCCESS;
    }
}

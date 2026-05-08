<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DetectarMatriculasDuplicadasCommand extends Command
{
    protected $signature = 'sices:detectar-matriculas-duplicadas';

    protected $description = 'Detecta matrículas repetidas y conflictos de simultaneidad académica.';

    public function handle(): int
    {
        $duplicadasMatricula = DB::table('matriculas')
            ->select('matricula', DB::raw('COUNT(*) as total'))
            ->whereNull('deleted_at')
            ->whereNotNull('matricula')
            ->whereRaw("TRIM(matricula) <> ''")
            ->groupBy('matricula')
            ->having('total', '>', 1)
            ->orderBy('matricula')
            ->get();

        $activos = ['activa', 'suspendida'];
        $rows = DB::table('matriculas')
            ->select('alumno_id', DB::raw('COUNT(*) as total'))
            ->whereNull('deleted_at')
            ->whereIn('estado', $activos)
            ->groupBy('alumno_id')
            ->having('total', '>', 1)
            ->orderBy('alumno_id')
            ->get();

        $inscripcionesActivas = ['inscrita', 'cursando'];
        $simultaneasCiclo = DB::table('inscripciones_periodo as ip')
            ->join('matriculas as m', 'm.id', '=', 'ip.matricula_id')
            ->select('m.alumno_id', 'ip.ciclo_escolar_id', DB::raw('COUNT(*) as total'))
            ->whereNull('m.deleted_at')
            ->whereIn('m.estado', $activos)
            ->whereIn('ip.estatus', $inscripcionesActivas)
            ->groupBy('m.alumno_id', 'ip.ciclo_escolar_id')
            ->having('total', '>', 1)
            ->orderBy('m.alumno_id')
            ->orderBy('ip.ciclo_escolar_id')
            ->get();

        $ok = true;
        if ($duplicadasMatricula->isNotEmpty()) {
            $ok = false;
            $this->warn('Matrículas repetidas (clave global):');
            foreach ($duplicadasMatricula as $row) {
                $this->line(sprintf(' - matricula=%s total=%s', $row->matricula, $row->total));
            }
            $this->newLine();
        }

        if ($rows->isNotEmpty()) {
            $ok = false;
            $this->warn('Alumno con más de una matrícula activa (activa/suspendida):');
            foreach ($rows as $row) {
                $this->line(sprintf(' - alumno_id=%s total_activas=%s', $row->alumno_id, $row->total));
            }
            $this->newLine();
        }

        if ($simultaneasCiclo->isNotEmpty()) {
            $ok = false;
            $this->warn('Inscripciones activas simultáneas en el mismo ciclo escolar:');
            foreach ($simultaneasCiclo as $row) {
                $this->line(sprintf(
                    ' - alumno_id=%s ciclo_escolar_id=%s total_inscripciones_activas=%s',
                    $row->alumno_id,
                    $row->ciclo_escolar_id,
                    $row->total
                ));
            }
            $this->newLine();
        }

        if ($ok) {
            $this->info('Sin conflictos detectados de matrícula/inscripción activa.');

            return self::SUCCESS;
        }

        $this->warn('Corrija los conflictos antes de aplicar validaciones estrictas o constraints.');

        return self::FAILURE;
    }
}

<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Alumno;
use App\Services\Certificacion\AuditoriaService;
use Illuminate\Support\Facades\Auth;

class AlumnoObserver
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    public function created(Alumno $alumno): void
    {
        $this->auditoria->registrar(
            'alumno.creado',
            Alumno::class,
            $alumno->id,
            ['curp' => $alumno->curp],
            Auth::id(),
        );
    }

    public function updated(Alumno $alumno): void
    {
        if ($alumno->wasChanged()) {
            $this->auditoria->registrar(
                'alumno.actualizado',
                Alumno::class,
                $alumno->id,
                ['cambios' => $alumno->getChanges()],
                Auth::id(),
            );
        }
    }
}

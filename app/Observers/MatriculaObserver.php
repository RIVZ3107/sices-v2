<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Matricula;
use App\Services\Certificacion\AuditoriaService;
use Illuminate\Support\Facades\Auth;

class MatriculaObserver
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    public function created(Matricula $matricula): void
    {
        $this->auditoria->registrar(
            'matricula.creada',
            Matricula::class,
            $matricula->id,
            [
                'alumno_id' => $matricula->alumno_id,
                'oferta_academica_id' => $matricula->oferta_academica_id,
            ],
            Auth::id(),
        );
    }

    public function updated(Matricula $matricula): void
    {
        if ($matricula->wasChanged()) {
            $this->auditoria->registrar(
                'matricula.actualizada',
                Matricula::class,
                $matricula->id,
                ['cambios' => $matricula->getChanges()],
                Auth::id(),
            );
        }
    }
}

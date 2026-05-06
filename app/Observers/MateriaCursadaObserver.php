<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\MateriaCursada;
use App\Services\Certificacion\AuditoriaService;
use Illuminate\Support\Facades\Auth;

class MateriaCursadaObserver
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    public function created(MateriaCursada $materiaCursada): void
    {
        $this->auditoria->registrar(
            'materia_cursada.creada',
            MateriaCursada::class,
            $materiaCursada->id,
            [
                'matricula_id' => $materiaCursada->matricula_id,
                'clave' => $materiaCursada->clave,
                'ciclo_escolar_id' => $materiaCursada->ciclo_escolar_id,
            ],
            Auth::id(),
        );
    }

    public function updated(MateriaCursada $materiaCursada): void
    {
        if ($materiaCursada->wasChanged()) {
            $this->auditoria->registrar(
                'materia_cursada.actualizada',
                MateriaCursada::class,
                $materiaCursada->id,
                ['cambios' => $materiaCursada->getChanges()],
                Auth::id(),
            );
        }
    }
}

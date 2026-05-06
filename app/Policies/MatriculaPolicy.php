<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;

class MatriculaPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function view(User $user, Matricula $matricula): bool
    {
        if (! $user->can('ver_matriculas')) {
            return false;
        }

        return $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id);
    }

    public function create(User $user): bool
    {
        return $user->can('gestionar_matriculas');
    }

    public function capturarMaterias(User $user, Matricula $matricula): bool
    {
        if (! $user->can('gestionar_materias')) {
            return false;
        }

        if (! $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id)) {
            return false;
        }

        $tieneDocumentoFirmado = DocumentoAcademico::query()
            ->where('matricula_id', $matricula->id)
            ->where('estado_firma', 'firmado')
            ->exists();

        return ! $tieneDocumentoFirmado;
    }

    public function sincronizarTrayectoria(User $user, Matricula $matricula): bool
    {
        if (! $user->can('gestionar_trayectorias')) {
            return false;
        }

        return $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id);
    }
}

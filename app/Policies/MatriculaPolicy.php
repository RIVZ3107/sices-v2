<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Support\SicesAuth;

class MatriculaPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function view(User $user, Matricula $matricula): bool
    {
        if (! SicesAuth::canAny($user, 'ver_matriculas', 'matriculas.ver')) {
            return false;
        }

        return $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id);
    }

    public function create(User $user): bool
    {
        return SicesAuth::canAny($user, 'asignar_matricula', 'matriculas.asignar');
    }

    public function capturarMaterias(User $user, Matricula $matricula): bool
    {
        if (! SicesAuth::canAny($user, 'gestionar_materias', 'calificaciones.capturar', 'materias.editar', 'calificaciones.capturar_propias')) {
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
        if (! SicesAuth::canAny($user, 'gestionar_trayectorias', 'trayectoria.editar', 'trayectoria.recalcular')) {
            return false;
        }

        return $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id);
    }
}

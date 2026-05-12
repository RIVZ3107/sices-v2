<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\Alumno;
use App\Models\User;

final class AspiranteDashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $asp = Alumno::query()
            ->where('metadata->usuario_visual_email', $user->email)
            ->first();

        $estado = $asp?->estatus ?? 'sin_registro';

        return [
            'variant' => 'aspirante_preinscrito',
            'technical' => false,
            'solo_datos_propios' => true,
            'estado_admision' => $estado,
            'cards' => [
                ['key' => 'estado', 'title' => 'Estado de admisión', 'value' => $asp ? 1 : 0, 'href' => '/app/dashboard'],
                ['key' => 'documentos', 'title' => 'Documentos cargados', 'value' => $asp ? 2 : 0, 'href' => '/app/dashboard'],
                ['key' => 'observaciones', 'title' => 'Observaciones', 'value' => 0, 'href' => '/app/dashboard'],
                ['key' => 'resultado', 'title' => 'Resultado', 'value' => $estado === 'aspirante' ? 0 : 0, 'href' => '/app/dashboard'],
            ],
            'historial' => $asp ? [
                ['paso' => 'Registro completado', 'estado' => 'registro_completado'],
                ['paso' => 'Documentos cargados', 'estado' => 'documentos_cargados'],
                ['paso' => 'En revisión', 'estado' => 'en_revision'],
            ] : [],
            'notas' => ['Flujo aspirante simulado sin pagos de derechos (no hay módulo financiero formal vinculado).'],
        ];
    }
}

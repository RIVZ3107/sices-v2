<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\InscripcionPeriodo;
use App\Models\MateriaCursada;
use App\Models\User;

final class AlumnoEgresadoDashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $alumno = Alumno::query()
            ->where('metadata->usuario_visual_email', $user->email)
            ->first();

        if ($alumno === null) {
            return [
                'variant' => 'alumno_egresado',
                'technical' => false,
                'solo_datos_propios' => true,
                'cards' => [
                    ['key' => 'expediente', 'title' => 'Mi expediente', 'value' => 0, 'href' => '/app/dashboard'],
                    ['key' => 'calificaciones', 'title' => 'Mis calificaciones', 'value' => 0, 'href' => '/app/dashboard'],
                    ['key' => 'kardex', 'title' => 'Mi Kardex', 'value' => 0, 'href' => '/app/dashboard'],
                    ['key' => 'documentos', 'title' => 'Mis documentos', 'value' => 0, 'href' => '/app/dashboard'],
                    ['key' => 'tramites', 'title' => 'Mis trámites', 'value' => 0, 'href' => '/app/dashboard'],
                ],
                'notas' => ['Sin expediente académico vinculado a este usuario. Ejecute el dataset visual o asigne el vínculo institucional.'],
            ];
        }

        $mat = $alumno->matriculaActiva;
        $inscripciones = $mat
            ? InscripcionPeriodo::query()->where('matricula_id', $mat->id)->count()
            : 0;
        $calificaciones = $mat
            ? MateriaCursada::query()->where('matricula_id', $mat->id)->whereNotNull('calificacion')->count()
            : 0;
        $documentos = DocumentoAcademico::query()->where('alumno_id', $alumno->id)->count();

        return [
            'variant' => 'alumno_egresado',
            'technical' => false,
            'solo_datos_propios' => true,
            'contexto_alumno' => [
                'nombre' => trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido]))),
                'curp' => $alumno->curp,
            ],
            'cards' => [
                ['key' => 'expediente', 'title' => 'Mi expediente', 'value' => 1, 'href' => '/app/dashboard'],
                ['key' => 'calificaciones', 'title' => 'Mis calificaciones', 'value' => $calificaciones, 'href' => '/app/dashboard'],
                ['key' => 'kardex', 'title' => 'Mi Kardex', 'value' => $mat ? 1 : 0, 'href' => '/app/dashboard'],
                ['key' => 'documentos', 'title' => 'Mis documentos', 'value' => $documentos, 'href' => '/app/dashboard'],
                ['key' => 'inscripciones', 'title' => 'Mis inscripciones', 'value' => $inscripciones, 'href' => '/app/dashboard'],
            ],
            'notas' => ['Vista portal alumno: sin módulo de pagos/colegiaturas.'],
        ];
    }
}

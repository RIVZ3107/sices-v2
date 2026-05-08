<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\FirmanteAutorizado;
use App\Models\TrayectoriaAcademica;
use Illuminate\Validation\ValidationException;

class DecNormal2025PayloadBuilder
{
    /**
     * @return array<string, mixed>
     */
    public function build(DocumentoAcademico $documento): array
    {
        $documento->loadMissing([
            'alumno',
            'matricula.ofertaAcademica.planEstudio.programaEstudio',
            'subsistema',
            'institucion',
            'sede',
            'materiasSnapshot',
        ]);

        if ($documento->materiasSnapshot->isEmpty()) {
            throw ValidationException::withMessages([
                'materias_snapshot' => ['No se puede construir payload DEC: el documento no tiene snapshot de materias.'],
            ]);
        }

        $alumno = $documento->alumno;
        if ($alumno === null) {
            throw ValidationException::withMessages(['alumno_id' => ['El documento no tiene alumno asociado.']]);
        }

        $matricula = $documento->matricula;
        $oferta = $matricula?->ofertaAcademica;
        $plan = $oferta?->planEstudio;
        $programa = $plan?->programaEstudio;
        $trayectoria = TrayectoriaAcademica::query()
            ->where('matricula_id', $documento->matricula_id)
            ->latest('id')
            ->first();
        $firmante = $this->resolverFirmante($documento);

        if ($documento->subsistema === null || strtoupper((string) $documento->subsistema->clave) !== 'NORMAL') {
            throw ValidationException::withMessages([
                'subsistema_id' => ['El payload DEC controlado solo está habilitado para subsistema NORMAL.'],
            ]);
        }

        $asignaturas = [];
        foreach ($documento->materiasSnapshot as $m) {
            // `semestre` y `periodo` en snapshot están congelados: DEC XML vs periodo/ciclo cursado.
            $asignaturas[] = [
                'clave' => (string) $m->clave,
                'nombre' => (string) $m->nombre,
                'calificacionFinal' => $m->calificacion_final !== null ? (string) $m->calificacion_final : '',
                'semestre' => $m->semestre !== null ? (string) $m->semestre : '',
                'periodo' => (string) ($m->periodo ?? ''),
                'creditos' => $m->creditos !== null ? (string) $m->creditos : '',
            ];
        }

        return [
            'Dec' => [
                'version' => '1.1',
                'tipoCertificado' => '9',
            ],
            'ServicioFirmante' => [
                'servicio' => 'educacionNormal',
                'idEntidad' => (string) ($documento->region_id ?? ''),
            ],
            'FirmaResponsable' => [
                'curp' => (string) $firmante->curp,
                'cargo' => (string) $firmante->cargo,
            ],
            'ServicioEducativo' => [
                'nombreSecretariaInstituto' => (string) ($documento->institucion->nombre ?? ''),
                'nombreEscuelaDependencia' => (string) ($documento->sede->nombre ?? $documento->institucion->nombre ?? ''),
                'cct' => (string) ($documento->sede->clave ?? ''),
                'nombreEscuelaDesaparecida' => '',
                'cctDesaparecida' => '',
                'claveInstitucion' => (string) ($documento->institucion->clave ?? ''),
                'idEntidadFederativa' => (string) ($documento->region_id ?? ''),
                'idMunicipio' => '',
                'estatusEscuela' => 'ACTIVA',
            ],
            'Carrera' => [
                'claveCarrera' => (string) ($oferta->clave ?? ''),
                'carrera' => (string) ($programa->nombre ?? ''),
                'idModalidad' => (string) ($oferta->modalidad ?? ''),
                'planEstudios' => (string) ($plan->clave ?? ''),
            ],
            'Alumno' => [
                'curp' => (string) $alumno->curp,
                'nombre' => (string) $alumno->nombre,
                'primerApellido' => (string) $alumno->primer_apellido,
                'segundoApellido' => (string) ($alumno->segundo_apellido ?? ''),
                'idGenero' => (string) ($alumno->genero ?? ''),
            ],
            'Acreditacion' => [
                'idTipoCertificacion' => (string) ($documento->tipo_certificacion ?? ''),
                'fechaExpedicion' => optional($documento->fecha_aprobacion)->format('Y-m-d') ?? '',
                'asignaturasCursadas' => (string) count($asignaturas),
                'asignaturasTotal' => (string) ($trayectoria?->asignaturas_total ?? count($asignaturas)),
                'creditosTotales' => (string) ($trayectoria?->creditos_obtenidos ?? collect($asignaturas)->sum(fn (array $a) => (int) ($a['creditos'] ?: 0))),
                'promedioAprovechamiento' => (string) number_format(
                    (float) ($trayectoria?->promedio_aprovechamiento ?? collect($asignaturas)->avg(fn (array $a) => (float) ($a['calificacionFinal'] ?: 0.0)) ?: 0.0),
                    2,
                    '.',
                    '',
                ),
            ],
            'AsignaturasCursos' => [
                'AsignaturaCurso' => $asignaturas,
            ],
        ];
    }

    private function resolverFirmante(DocumentoAcademico $documento): FirmanteAutorizado
    {
        $hoy = now()->toDateString();
        $firmante = FirmanteAutorizado::query()
            ->where('subsistema_id', $documento->subsistema_id)
            ->where('institucion_id', $documento->institucion_id)
            ->where('estatus', 'activo')
            ->where(function ($q) use ($hoy) {
                $q->whereNull('vigencia_inicio')->orWhereDate('vigencia_inicio', '<=', $hoy);
            })
            ->where(function ($q) use ($hoy) {
                $q->whereNull('vigencia_fin')->orWhereDate('vigencia_fin', '>=', $hoy);
            })
            ->orderByDesc('id')
            ->first();

        if ($firmante === null) {
            throw ValidationException::withMessages([
                'firmante' => ['No existe responsable firmante activo/vigente para esta institución en subsistema NORMAL.'],
            ]);
        }

        return $firmante;
    }
}

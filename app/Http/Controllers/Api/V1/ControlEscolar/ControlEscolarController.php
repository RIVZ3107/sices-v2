<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Models\Alumno;
use App\Models\OfertaAcademica;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use App\Services\ControlEscolar\ControlEscolarDashboardService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlEscolarController extends Controller
{
    public function __construct(
        protected ControlEscolarDashboardService $dashboardService,
        protected CertificacionAlcanceService $alcanceService
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $request->user()->can('ver_documentos');

        return response()->json([
            'ok' => true,
            'data' => $this->dashboardService->resumen($request->user()),
        ]);
    }

    public function expedientes(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        if ($search === '') {
            return response()->json(['ok' => true, 'data' => []]);
        }

        $ofertas = OfertaAcademica::query();
        $this->alcanceService->aplicarAlcanceOfertasAcademicas($ofertas, $request->user());
        $idsOfertas = $ofertas->pluck('id');

        if ($idsOfertas->isEmpty()) {
            return response()->json(['ok' => true, 'data' => []]);
        }

        $query = Alumno::query()
            ->with([
                'matriculaActiva.ofertaAcademica.institucion.subsistema',
                'matriculaActiva.ofertaAcademica.sede',
                'matriculaActiva.ofertaAcademica.planEstudio.programaEstudio',
                'documentosAcademicos' => fn ($q) => $q->latest('id')->limit(1),
            ])
            ->whereHas('matriculas', fn (Builder $q) => $q->whereIn('oferta_academica_id', $idsOfertas))
            ->where(function (Builder $q) use ($search): void {
                $q->where('curp', 'like', '%'.$search.'%')
                    ->orWhere('nombre', 'like', '%'.$search.'%')
                    ->orWhere('primer_apellido', 'like', '%'.$search.'%')
                    ->orWhere('segundo_apellido', 'like', '%'.$search.'%')
                    ->orWhereHas('matriculas', fn (Builder $m) => $m->where('matricula', 'like', '%'.$search.'%'));
            })
            ->limit(20);

        $rows = $query->get()->map(function (Alumno $alumno): array {
            $mat = $alumno->matriculaActiva;
            $oferta = $mat?->ofertaAcademica;
            $doc = $alumno->documentosAcademicos->first();
            $legacy = (string) data_get($mat?->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY.'.estado');
            $bloqueoNormativo = in_array($legacy, [
                CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION,
                CertificacionImportacionLegacyNormativaGate::ESTADO_RECHAZADO_NORMATIVAMENTE,
            ], true);

            return [
                'folio_expediente' => 'EXP-'.str_pad((string) $alumno->id, 6, '0', STR_PAD_LEFT),
                'alumno_id' => $alumno->id,
                'alumno' => trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido]))),
                'curp' => $alumno->curp,
                'matricula_activa' => $mat?->matricula ?? 'Pendiente de asignación',
                'subsistema' => $oferta?->institucion?->subsistema?->nombre ?? 'Sin subsistema',
                'institucion' => $oferta?->institucion?->nombre ?? 'Sin institucion',
                'sede_subsede' => $oferta?->sede?->nombre ?? '—',
                'programa_plan' => trim(($oferta?->planEstudio?->programaEstudio?->nombre ?? 'Sin programa').' / '.($oferta?->planEstudio?->clave ?? 'Sin plan')),
                'estado_academico' => $this->estadoAcademicoHumano($alumno),
                'estado_documental' => $this->estadoDocumentalHumano($doc?->estado_workflow),
                'ultima_actualizacion' => $alumno->updated_at?->toIso8601String() ?? '',
                'siguiente_accion' => $this->siguienteAccion($alumno, $bloqueoNormativo),
                'expediente_url' => '/app/expedientes?alumno='.$alumno->id,
            ];
        })->values();

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    protected function estadoAcademicoHumano(Alumno $alumno): string
    {
        $mat = $alumno->matriculaActiva;
        if ($mat === null) {
            return 'Expediente incompleto';
        }
        $ins = $mat->inscripcionesPeriodo()->whereIn('estatus', ['activa', 'inscrita'])->exists();
        if (! $ins) {
            return 'Inscripcion pendiente';
        }
        $carga = $mat->inscripcionesPeriodo()->whereHas('cargasAcademicas')->exists();
        if (! $carga) {
            return 'Carga academica pendiente';
        }
        $calif = $mat->inscripcionesPeriodo()
            ->whereHas('cargasAcademicas.materiasCursadas', fn (Builder $q) => $q->whereNotNull('calificacion'))
            ->exists();

        return $calif ? 'En trayectoria' : 'Calificaciones pendientes';
    }

    protected function estadoDocumentalHumano(?string $estado): string
    {
        return match ($estado) {
            'en_revision' => 'Solicitud en revision',
            'rechazado' => 'Con observaciones',
            'aprobado' => 'Validado',
            'borrador' => 'Borrador',
            null => 'Sin solicitud',
            default => 'En proceso',
        };
    }

    protected function siguienteAccion(Alumno $alumno, bool $bloqueoNormativo): string
    {
        $mat = $alumno->matriculaActiva;
        if ($mat === null) {
            return 'Solicitar matrícula a Educación Superior';
        }
        if ($bloqueoNormativo) {
            return 'Atender validación institucional pendiente';
        }
        if (! $mat->inscripcionesPeriodo()->whereIn('estatus', ['activa', 'inscrita'])->exists()) {
            return 'Registrar inscripcion';
        }
        if (! $mat->inscripcionesPeriodo()->whereHas('cargasAcademicas')->exists()) {
            return 'Generar carga academica';
        }
        if (! $mat->inscripcionesPeriodo()->whereHas('cargasAcademicas.materiasCursadas', fn (Builder $q) => $q->whereNotNull('calificacion'))->exists()) {
            return 'Capturar calificaciones';
        }

        return 'Solicitar certificacion';
    }
}

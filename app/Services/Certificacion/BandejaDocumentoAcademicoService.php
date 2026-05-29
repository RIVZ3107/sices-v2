<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\Subsistema;
use App\Models\User;
use App\Services\DocumentosAcademicos\BandejaEtapaInstitucionalService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class BandejaDocumentoAcademicoService
{
    /** @var list<string> */
    private const SORTS_PERMITIDOS = [
        'created_at',
        'updated_at',
        'fecha_solicitud',
        'fecha_aprobacion',
        'fecha_firma',
        'folio_interno',
    ];

    public function __construct(
        protected CertificacionAlcanceService $alcance,
        protected SolicitudMatriculaService $solicitudesMatricula,
        protected BandejaEtapaInstitucionalService $etapasInstitucionales,
    ) {}

    public function listar(Request $request, string $bandeja): LengthAwarePaginator
    {
        $user = $request->user();
        $q = $this->baseQuery($user);

        if ($bandeja !== '' && ! $this->etapasInstitucionales->usuarioPuedeVerBandeja($user, $bandeja)) {
            $q->whereRaw('1 = 0');
        } elseif ($bandeja !== '') {
            $this->aplicarBandeja($q, $bandeja, $user);
        } else {
            $this->etapasInstitucionales->aplicarAlcanceEtapasPorRol($q, $user);
        }

        $this->aplicarFiltros($q, $request);
        $this->aplicarOrden($q, $request);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        return $q->paginate($perPage)->withQueryString();
    }

    /**
     * @return array<string, int>
     */
    public function resumen(Request $request): array
    {
        $user = $request->user();
        $base = $this->baseQuery($user);
        $this->aplicarFiltros($base, $request);

        $resumen = $this->etapasInstitucionales->resumenInstitucionalPorRol($base, $user);

        if ($user->can('ver_solicitud_matricula') && $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            $resumen = array_merge($resumen, $this->solicitudesMatricula->metricasEducacionSuperior($user));
        }

        return $resumen;
    }

    /**
     * @return list<string>
     */
    public function bandejasPorRol(User $user): array
    {
        return $this->etapasInstitucionales->bandejasPorRol($user);
    }

    protected function baseQuery(User $user): Builder
    {
        $q = DocumentoAcademico::query()
            ->with([
                'alumno:id,curp,nombre,primer_apellido,segundo_apellido',
                'matricula:id,matricula',
                'ofertaAcademica.programaEstudio:id,nombre,clave',
                'ofertaAcademica.planEstudio:id,nombre,clave',
                'institucion:id,nombre,clave',
                'sede:id,nombre,clave',
                'cicloEscolar:id,nombre,clave',
                'subsistema:id,clave,nombre,nombre_corto',
                'ultimaObservacion' => fn ($sub) => $sub->select([
                    'documento_observaciones.id',
                    'documento_observaciones.documento_academico_id',
                    'documento_observaciones.tipo',
                    'documento_observaciones.seccion',
                    'documento_observaciones.observacion',
                    'documento_observaciones.estado',
                    'documento_observaciones.prioridad',
                    'documento_observaciones.created_at',
                ]),
            ])
            ->withCount('observaciones')
            ->withCount([
                'observaciones as observaciones_pendientes_count' => fn (Builder $sub) => $sub->where('estado', 'pendiente'),
                'observaciones as observaciones_atendidas_count' => fn (Builder $sub) => $sub->where('estado', 'atendida'),
                'observaciones as observaciones_descartadas_count' => fn (Builder $sub) => $sub->where('estado', 'descartada'),
            ])
            ->select('documentos_academicos.*');

        $this->alcance->aplicarAlcanceDocumentosAcademicos($q, $user);

        return $q;
    }

    protected function aplicarBandeja(Builder $q, string $bandeja, User $user): void
    {
        $etapa = $this->etapasInstitucionales->resolverEtapaDesdeBandeja($bandeja);
        if ($etapa !== null) {
            $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional($q, $etapa);

            return;
        }

        $this->etapasInstitucionales->aplicarAlcanceEtapasPorRol($q, $user);
    }

    protected function aplicarFiltros(Builder $q, Request $request): void
    {
        if ($request->filled('etapa_institucional')) {
            $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional(
                $q,
                $request->string('etapa_institucional')->toString(),
            );
        }
        if ($request->filled('estado_workflow')) {
            $q->where('estado_workflow', $request->string('estado_workflow')->toString());
        }
        if ($request->filled('estado_firma')) {
            $q->where('estado_firma', $request->string('estado_firma')->toString());
        }
        if ($request->filled('tipo_documento')) {
            $q->where('tipo_documento', $request->string('tipo_documento')->toString());
        }
        if ($request->filled('tipo_certificacion')) {
            $q->where('tipo_certificacion', $request->string('tipo_certificacion')->toString());
        }
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('subsistema')) {
            $clave = strtoupper(trim($request->string('subsistema')->toString()));
            $subsistemaId = Subsistema::query()->where('clave', $clave)->value('id');
            if ($subsistemaId !== null) {
                $q->where('subsistema_id', (int) $subsistemaId);
            } else {
                $q->whereRaw('1 = 0');
            }
        }
        if ($request->filled('region_id')) {
            $q->where('region_id', $request->integer('region_id'));
        }
        if ($request->filled('alumno_id')) {
            $q->where('alumno_id', $request->integer('alumno_id'));
        }
        if ($request->filled('institucion_id')) {
            $q->where('institucion_id', $request->integer('institucion_id'));
        }
        if ($request->filled('sede_id')) {
            $q->where('sede_id', $request->integer('sede_id'));
        }
        if ($request->filled('ciclo_escolar_id')) {
            $q->where('ciclo_escolar_id', $request->integer('ciclo_escolar_id'));
        }
        if ($request->filled('folio_interno')) {
            $q->where('folio_interno', 'like', '%'.$request->string('folio_interno')->toString().'%');
        }
        if ($request->filled('curp')) {
            $curp = mb_strtoupper($request->string('curp')->toString());
            $q->whereHas('alumno', fn (Builder $a) => $a->where('curp', 'like', '%'.$curp.'%'));
        }
        if ($request->filled('q')) {
            $needle = trim($request->string('q')->toString());
            if ($needle !== '') {
                $needleUpper = mb_strtoupper($needle);
                $q->where(function (Builder $sub) use ($needle, $needleUpper): void {
                    $sub->where('folio_interno', 'like', '%'.$needle.'%')
                        ->orWhereHas('alumno', function (Builder $a) use ($needle, $needleUpper): void {
                            $a->where('curp', 'like', '%'.$needleUpper.'%')
                                ->orWhere('nombre', 'like', '%'.$needle.'%')
                                ->orWhere('primer_apellido', 'like', '%'.$needle.'%')
                                ->orWhere('segundo_apellido', 'like', '%'.$needle.'%');
                        })
                        ->orWhereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', '%'.$needle.'%'));
                });
            }
        }
        if ($request->filled('fecha_desde')) {
            $q->whereDate('fecha_solicitud', '>=', $request->date('fecha_desde')?->format('Y-m-d'));
        }
        if ($request->filled('fecha_hasta')) {
            $q->whereDate('fecha_solicitud', '<=', $request->date('fecha_hasta')?->format('Y-m-d'));
        }
    }

    protected function aplicarOrden(Builder $q, Request $request): void
    {
        $sort = $request->string('sort', 'updated_at')->toString();
        if (! in_array($sort, self::SORTS_PERMITIDOS, true)) {
            $sort = 'updated_at';
        }

        $direction = strtolower($request->string('direction', 'desc')->toString());
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $q->orderBy($sort, $direction)->orderByDesc('id');
    }
}

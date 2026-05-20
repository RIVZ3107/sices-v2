<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\Alumno;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\SolicitudMatricula;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class SolicitudMatriculaService
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
        protected ValidacionSimultaneidadAcademicaService $simultaneidad,
        protected AcademicRulesResolver $academicRules,
        protected MatriculaUpnService $matriculaUpn,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function crearBorrador(User $user, int $alumnoId, int $ofertaAcademicaId, int $cicloIngresoId, array $metadata = []): SolicitudMatricula
    {
        if (! $user->can('crear_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para crear solicitud de matrícula.');
        }

        $alumno = Alumno::query()->findOrFail($alumnoId);
        $this->assertAlumnoPermitidoParaSolicitud($user, $alumno);

        if (! $this->alcance->ofertaEnAlcance($user, $ofertaAcademicaId)) {
            throw new AccessDeniedHttpException('La oferta académica está fuera de su alcance territorial.');
        }

        if ($this->simultaneidad->alumnoTieneMatriculaActiva($alumno)) {
            throw ValidationException::withMessages([
                'alumno_id' => ['El alumno ya cuenta con matrícula activa; no corresponde solicitar asignación.'],
            ]);
        }

        if ($this->solicitudInstitucionalPendiente($alumno)) {
            throw ValidationException::withMessages([
                'alumno_id' => ['Ya existe una solicitud de matrícula en trámite para este alumno.'],
            ]);
        }

        $oferta = OfertaAcademica::query()->with('institucion.subsistema')->findOrFail($ofertaAcademicaId);
        $inst = $oferta->institucion;
        if ($inst === null || (int) $inst->subsistema_id <= 0) {
            throw ValidationException::withMessages([
                'oferta_academica_id' => ['La oferta no tiene institución o subsistema válido.'],
            ]);
        }

        $existente = SolicitudMatricula::query()
            ->where('alumno_id', $alumnoId)
            ->where('estado', SolicitudMatricula::ESTADO_BORRADOR)
            ->first();

        if ($existente !== null) {
            $existente->fill([
                'subsistema_id' => (int) $inst->subsistema_id,
                'institucion_id' => (int) $oferta->institucion_id,
                'sede_id' => $oferta->sede_id,
                'oferta_academica_id' => $oferta->id,
                'programa_estudio_id' => $oferta->programa_estudio_id,
                'plan_estudio_id' => $oferta->plan_estudio_id,
                'ciclo_ingreso_id' => $cicloIngresoId,
                'metadata' => array_merge((array) ($existente->metadata ?? []), $metadata),
            ]);
            $existente->save();

            return $existente->fresh();
        }

        $s = SolicitudMatricula::query()->create([
            'alumno_id' => $alumnoId,
            'subsistema_id' => (int) $inst->subsistema_id,
            'institucion_id' => (int) $oferta->institucion_id,
            'sede_id' => $oferta->sede_id,
            'oferta_academica_id' => $oferta->id,
            'programa_estudio_id' => $oferta->programa_estudio_id,
            'plan_estudio_id' => $oferta->plan_estudio_id,
            'ciclo_ingreso_id' => $cicloIngresoId,
            'estado' => SolicitudMatricula::ESTADO_BORRADOR,
            'solicitada_por' => $user->id,
            'metadata' => $metadata,
        ]);

        $this->auditar($s, $user, 'crear_solicitud', '', SolicitudMatricula::ESTADO_BORRADOR, null, []);

        return $s;
    }

    public function enviar(User $user, SolicitudMatricula $s): SolicitudMatricula
    {
        if (! $user->can('enviar_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para enviar la solicitud.');
        }
        $this->assertAlcanceSolicitudControlEscolar($user, $s);

        if ($s->estado !== SolicitudMatricula::ESTADO_BORRADOR) {
            throw ValidationException::withMessages(['estado' => ['Solo se puede enviar una solicitud en borrador.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_ENVIADA;
        $s->save();
        $this->auditar($s, $user, 'enviar_solicitud', $prev, $s->estado, null, []);

        return $s->fresh();
    }

    public function tomarEnRevision(User $user, SolicitudMatricula $s): SolicitudMatricula
    {
        if (! $user->can('revisar_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para tomar la solicitud en revisión.');
        }
        $this->assertEducacionSuperior($user);

        if ($s->estado !== SolicitudMatricula::ESTADO_ENVIADA) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes enviadas pueden pasar a revisión.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_EN_REVISION;
        $s->revisada_por = $user->id;
        $s->save();
        $this->auditar($s, $user, 'tomar_en_revision', $prev, $s->estado, null, []);

        return $s->fresh();
    }

    public function devolverConObservaciones(User $user, SolicitudMatricula $s, string $observaciones): SolicitudMatricula
    {
        if (! $user->can('devolver_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para devolver la solicitud con observaciones.');
        }
        $this->assertEducacionSuperior($user);

        if ($s->estado !== SolicitudMatricula::ESTADO_EN_REVISION) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes en revisión pueden devolverse con observaciones.']]);
        }
        $obs = trim($observaciones);
        if ($obs === '') {
            throw ValidationException::withMessages(['observaciones' => ['Debe registrar observaciones institucionales.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_CON_OBSERVACIONES;
        $s->observaciones = $obs;
        $s->save();
        $this->auditar($s, $user, 'devolver_con_observaciones', $prev, $s->estado, null, ['observaciones' => $obs]);

        return $s->fresh();
    }

    public function atenderObservaciones(User $user, SolicitudMatricula $s): SolicitudMatricula
    {
        if (! $user->can('atender_observacion_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para atender observaciones.');
        }
        $this->assertAlcanceSolicitudControlEscolar($user, $s);

        if ($s->estado !== SolicitudMatricula::ESTADO_CON_OBSERVACIONES) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes con observaciones pueden atenderse desde Control Escolar.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_BORRADOR;
        $meta = (array) ($s->metadata ?? []);
        $meta['historial_observaciones_es'] = array_merge(
            (array) ($meta['historial_observaciones_es'] ?? []),
            [['atendido_en' => now()->toIso8601String(), 'usuario_id' => $user->id]]
        );
        $s->metadata = $meta;
        $s->save();
        $this->auditar($s, $user, 'atender_observaciones', $prev, $s->estado, null, []);

        return $s->fresh();
    }

    public function aprobar(User $user, SolicitudMatricula $s): SolicitudMatricula
    {
        if (! $user->can('aprobar_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para aprobar la solicitud.');
        }
        $this->assertEducacionSuperior($user);

        if ($s->estado !== SolicitudMatricula::ESTADO_EN_REVISION) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes en revisión pueden aprobarse.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_APROBADA;
        $s->aprobada_por = $user->id;
        $s->save();
        $this->auditar($s, $user, 'aprobar', $prev, $s->estado, null, []);

        return $s->fresh();
    }

    public function rechazar(User $user, SolicitudMatricula $s, string $motivo): SolicitudMatricula
    {
        if (! $user->can('rechazar_solicitud_matricula')) {
            throw new AuthorizationException('No autorizado para rechazar la solicitud.');
        }
        $this->assertEducacionSuperior($user);

        if (! in_array($s->estado, [SolicitudMatricula::ESTADO_EN_REVISION, SolicitudMatricula::ESTADO_ENVIADA], true)) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes enviadas o en revisión pueden rechazarse.']]);
        }
        $mot = trim($motivo);
        if ($mot === '') {
            throw ValidationException::withMessages(['motivo_rechazo' => ['Debe indicar el motivo del rechazo.']]);
        }

        $prev = $s->estado;
        $s->estado = SolicitudMatricula::ESTADO_RECHAZADA;
        $s->motivo_rechazo = $mot;
        $s->save();
        $this->auditar($s, $user, 'rechazar', $prev, $s->estado, $mot, []);

        return $s->fresh();
    }

    /**
     * @param  array<string, mixed>  $metadataMatricula
     */
    public function asignarMatricula(
        User $user,
        SolicitudMatricula $s,
        string $claveMatricula,
        string $estadoMatricula = 'activa',
        array $metadataMatricula = [],
    ): SolicitudMatricula {
        if (! $user->can('asignar_matricula')) {
            throw new AuthorizationException('No autorizado para asignar matrícula institucional.');
        }
        $this->assertEducacionSuperior($user);

        if ($s->estado !== SolicitudMatricula::ESTADO_APROBADA) {
            throw ValidationException::withMessages(['estado' => ['Solo solicitudes aprobadas admiten asignación de matrícula.']]);
        }

        $alumno = $s->alumno()->firstOrFail();
        if ($this->simultaneidad->alumnoTieneMatriculaActiva($alumno)) {
            throw ValidationException::withMessages([
                'alumno_id' => ['El alumno ya tiene matrícula activa; no se puede asignar otra.'],
            ]);
        }

        $ofertaId = (int) ($s->oferta_academica_id ?? 0);
        $cicloId = (int) ($s->ciclo_ingreso_id ?? 0);
        if ($ofertaId <= 0 || $cicloId <= 0) {
            throw ValidationException::withMessages([
                'solicitud' => ['La solicitud está incompleta: falta oferta académica o ciclo de ingreso.'],
            ]);
        }

        $curp = trim((string) $alumno->curp);
        if ($curp === '') {
            throw ValidationException::withMessages([
                'alumno_id' => ['El expediente está incompleto: falta CURP del alumno.'],
            ]);
        }

        $oferta = OfertaAcademica::query()->with('institucion.subsistema')->findOrFail($ofertaId);
        $subsistemaOferta = (int) ($oferta->institucion?->subsistema_id ?? 0);
        $claveSub = strtoupper((string) ($oferta->institucion?->subsistema?->clave ?? ''));

        $rules = $this->academicRules->forSubsistemaId($subsistemaOferta);
        $metaOferta = is_array($oferta->metadata) ? $oferta->metadata : [];
        $rules->validarModalidadOferta((string) ($oferta->modalidad ?? ''), $metaOferta);

        $claveMat = trim($claveMatricula);
        if ($claveMat === '') {
            throw ValidationException::withMessages(['matricula' => ['Debe indicar la clave de matrícula institucional.']]);
        }

        if ($claveSub === 'UPN') {
            $metadataMatricula = $this->matriculaUpn->prepararMetadataUpn($metadataMatricula);
            $this->matriculaUpn->validarUnicidadGlobal($claveMat);
        } else {
            if ($rules->usaPatronMatriculaEducacionNormal2022() && strlen($claveMat) < 4) {
                throw ValidationException::withMessages([
                    'matricula' => ['Educación Normal: la clave de matrícula debe cumplir el esquema institucional (Plan 2022).'],
                ]);
            }
            $dup = Matricula::query()->where('matricula', $claveMat)->exists();
            if ($dup) {
                throw ValidationException::withMessages([
                    'matricula' => ['La matrícula ya existe en el sistema.'],
                ]);
            }
        }

        $payload = [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ofertaId,
            'ciclo_escolar_id' => $cicloId,
            'subsistema_id' => $subsistemaOferta,
            'matricula' => $claveMat,
            'estado' => $estadoMatricula,
            'metadata' => $metadataMatricula,
        ];

        $this->simultaneidad->validarNuevaMatricula($alumno, $payload);

        return DB::transaction(function () use ($user, $s, $payload, $claveSub, $claveMat): SolicitudMatricula {
            $matricula = Matricula::query()->create($payload);
            $prev = $s->estado;
            $s->matricula_id = $matricula->id;
            $s->estado = SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA;
            $s->save();
            $this->auditar($s, $user, 'asignar_matricula', $prev, $s->estado, null, [
                'matricula_id' => $matricula->id,
                'clave_matricula' => $claveMat,
                'subsistema_clave' => $claveSub,
            ]);

            return $s->fresh();
        });
    }

    /**
     * @return Collection<int, SolicitudMatricula>
     */
    public function listarParaUsuario(User $user, ?string $estado = null)
    {
        $q = SolicitudMatricula::query()
            ->with([
                'alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'subsistema:id,clave,nombre',
                'institucion:id,nombre',
                'sede:id,nombre,clave',
                'programaEstudio:id,nombre,clave',
                'planEstudio:id,nombre,clave',
                'cicloIngreso:id,clave,nombre',
            ])
            ->orderByDesc('updated_at');

        if ($estado !== null && $estado !== '') {
            $q->where('estado', $estado);
        }

        if ($user->hasAnyRole(['superadmin', 'admin']) || $user->hasRole('educacion_superior')) {
            return $q->limit(500)->get();
        }

        if (! $user->can('ver_solicitud_matricula')) {
            return collect();
        }

        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ids = $ofertas->pluck('id');

        return $q->whereIn('oferta_academica_id', $ids)->limit(500)->get();
    }

    public function ultimaVigenteParaAlumno(int $alumnoId): ?SolicitudMatricula
    {
        return SolicitudMatricula::query()
            ->where('alumno_id', $alumnoId)
            ->whereNotIn('estado', [SolicitudMatricula::ESTADO_CANCELADA])
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return array<string, int>
     */
    public function metricasControlEscolar(User $user): array
    {
        $base = SolicitudMatricula::query();
        $this->aplicarAlcanceSolicitudes($base, $user);

        $borrador = SolicitudMatricula::ESTADO_BORRADOR;
        $enviada = SolicitudMatricula::ESTADO_ENVIADA;
        $observaciones = SolicitudMatricula::ESTADO_CON_OBSERVACIONES;
        $asignada = SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA;

        $row = (clone $base)->selectRaw(
            'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) as solicitudes_matricula_borrador, '
            .'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) as solicitudes_matricula_enviadas, '
            .'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) as solicitudes_matricula_con_observaciones, '
            .'SUM(CASE WHEN estado = ? THEN 1 ELSE 0 END) as solicitudes_matricula_matricula_asignada',
            [$borrador, $enviada, $observaciones, $asignada],
        )->first();

        return [
            'solicitudes_matricula_borrador' => (int) ($row?->solicitudes_matricula_borrador ?? 0),
            'solicitudes_matricula_enviadas' => (int) ($row?->solicitudes_matricula_enviadas ?? 0),
            'solicitudes_matricula_con_observaciones' => (int) ($row?->solicitudes_matricula_con_observaciones ?? 0),
            'solicitudes_matricula_matricula_asignada' => (int) ($row?->solicitudes_matricula_matricula_asignada ?? 0),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function metricasEducacionSuperior(User $user): array
    {
        if (! $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            return [
                'solicitudes_matricula_pendientes' => 0,
                'solicitudes_matricula_en_revision' => 0,
                'solicitudes_matricula_asignadas_hoy' => 0,
                'solicitudes_matricula_rechazadas' => 0,
            ];
        }

        $hoy = now()->startOfDay();

        return [
            'solicitudes_matricula_pendientes' => SolicitudMatricula::query()
                ->where('estado', SolicitudMatricula::ESTADO_ENVIADA)
                ->count(),
            'solicitudes_matricula_en_revision' => SolicitudMatricula::query()
                ->where('estado', SolicitudMatricula::ESTADO_EN_REVISION)
                ->count(),
            'solicitudes_matricula_asignadas_hoy' => SolicitudMatricula::query()
                ->where('estado', SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA)
                ->whereDate('updated_at', $hoy)
                ->count(),
            'solicitudes_matricula_rechazadas' => SolicitudMatricula::query()
                ->where('estado', SolicitudMatricula::ESTADO_RECHAZADA)
                ->count(),
        ];
    }

    protected function aplicarAlcanceSolicitudes(Builder $q, User $user): void
    {
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return;
        }

        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ids = $ofertas->pluck('id');
        $q->whereIn('oferta_academica_id', $ids);
    }

    protected function solicitudInstitucionalPendiente(Alumno $alumno): bool
    {
        return SolicitudMatricula::query()
            ->where('alumno_id', $alumno->id)
            ->whereIn('estado', [
                SolicitudMatricula::ESTADO_ENVIADA,
                SolicitudMatricula::ESTADO_EN_REVISION,
                SolicitudMatricula::ESTADO_CON_OBSERVACIONES,
                SolicitudMatricula::ESTADO_APROBADA,
            ])
            ->exists();
    }

    protected function assertAlcanceSolicitudControlEscolar(User $user, SolicitudMatricula $s): void
    {
        if ($user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            return;
        }

        $ofertaId = (int) ($s->oferta_academica_id ?? 0);
        if ($ofertaId <= 0 || ! $this->alcance->ofertaEnAlcance($user, $ofertaId)) {
            throw new AccessDeniedHttpException('La solicitud está fuera de su alcance territorial.');
        }
    }

    protected function assertEducacionSuperior(User $user): void
    {
        if (! $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            throw new AccessDeniedHttpException('Solo Educación Superior u operadores centrales pueden ejecutar esta acción.');
        }
    }

    /**
     * Alumnos sin matrícula aún no pasan por {@see CertificacionAlcanceService::aplicarAlcanceAlumnos};
     * si la oferta está en alcance, se permite preparar la solicitud de asignación.
     */
    protected function assertAlumnoPermitidoParaSolicitud(User $user, Alumno $alumno): void
    {
        if ($this->alcance->alumnoAccesible($user, $alumno)) {
            return;
        }

        if (! $alumno->matriculas()->exists()) {
            return;
        }

        throw new AccessDeniedHttpException('El alumno no está disponible para solicitud de matrícula en su alcance.');
    }

    /**
     * @param  array<string, mixed>  $extraPayload
     */
    protected function auditar(
        SolicitudMatricula $s,
        User $user,
        string $accion,
        string $estadoAnterior,
        string $estadoNuevo,
        ?string $motivo,
        array $extraPayload,
    ): void {
        $this->auditoria->registrar(
            'solicitud_matricula.'.$accion,
            SolicitudMatricula::class,
            (int) $s->id,
            array_merge([
                'solicitud_matricula_id' => $s->id,
                'alumno_id' => $s->alumno_id,
                'accion' => $accion,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $estadoNuevo,
                'motivo' => $motivo,
            ], $extraPayload),
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
            ['contexto' => 'solicitud_matricula'],
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\SolicitudMatricula;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;
use App\Services\Certificacion\SolicitudMatriculaService;

final class EducacionSuperiorDashboardService
{
    public function __construct(
        private readonly BandejaDocumentoAcademicoService $bandejas,
        private readonly SolicitudMatriculaService $solicitudesMatricula,
        private readonly DashboardRequestFactory $requestFactory,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $req = $this->requestFactory->forUser($user);
        $b = $this->bandejas->resumen($req);
        $m = $this->solicitudesMatricula->metricasEducacionSuperior($user);

        $tabla = SolicitudMatricula::query()
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido,curp'])
            ->where('estado', SolicitudMatricula::ESTADO_ENVIADA)
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get()
            ->map(fn (SolicitudMatricula $s) => [
                'id' => $s->id,
                'alumno' => trim(implode(' ', array_filter([
                    $s->alumno?->nombre,
                    $s->alumno?->primer_apellido,
                    $s->alumno?->segundo_apellido,
                ]))),
                'curp' => $s->alumno?->curp,
                'estado' => $s->estado,
                'href' => '/app/solicitudes-matricula',
            ])
            ->values()
            ->all();

        $tablaNormativa = DocumentoAcademico::query()
            ->with(['institucion:id,nombre', 'alumno:id,nombre,primer_apellido,segundo_apellido', 'matricula:id,matricula'])
            ->whereIn('estado_workflow', ['pendiente', 'en_revision'])
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (DocumentoAcademico $d) => [
                'id' => $d->id,
                'institucion' => $d->institucion?->nombre ?? '—',
                'alumno' => trim(implode(' ', array_filter([
                    $d->alumno?->nombre,
                    $d->alumno?->primer_apellido,
                    $d->alumno?->segundo_apellido,
                ]))),
                'estado' => $d->estado_workflow,
                'href' => '/app/documentos/bandejas/pendientes-revision',
            ])
            ->all();

        $tablaLiberar = DocumentoAcademico::query()
            ->with(['institucion:id,nombre', 'alumno:id,nombre,primer_apellido,segundo_apellido'])
            ->where('estado_workflow', 'aprobado')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (DocumentoAcademico $d) => [
                'id' => $d->id,
                'institucion' => $d->institucion?->nombre ?? '—',
                'alumno' => trim(implode(' ', array_filter([
                    $d->alumno?->nombre,
                    $d->alumno?->primer_apellido,
                    $d->alumno?->segundo_apellido,
                ]))),
                'estado' => $d->estado_workflow,
                'href' => '/app/documentos/bandejas/aprobados',
            ])
            ->all();

        $alertas = DocumentoAcademico::query()
            ->with(['institucion:id,nombre'])
            ->where('estado_workflow', 'rechazado')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (DocumentoAcademico $d) => [
                'titulo' => 'Observaciones documentales',
                'institucion' => $d->institucion?->nombre ?? '—',
                'folio' => $d->folio_interno ?? '—',
                'href' => '/app/documentos/bandejas/rechazados',
            ])
            ->all();

        $institucionesActivas = Institucion::query()->where('activo', true)->count();
        $sedesRegistradas = Sede::query()->where('activo', true)->count();
        $programasVigentes = ProgramaEstudio::query()->where('activo', true)->count();
        $planesVigentes = PlanEstudio::query()->where('activo', true)->count();

        $matriculaPorInstitucion = Matricula::query()
            ->join('ofertas_academicas as o', 'o.id', '=', 'matriculas.oferta_academica_id')
            ->join('instituciones as i', 'i.id', '=', 'o.institucion_id')
            ->whereIn('matriculas.estado', ['activa', 'vigente'])
            ->where('o.activo', true)
            ->selectRaw('i.nombre as institucion, COUNT(matriculas.id) as matricula_activa')
            ->groupBy('i.id', 'i.nombre')
            ->orderByDesc('matricula_activa')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'institucion' => (string) $row->institucion,
                'matricula_activa' => (int) $row->matricula_activa,
            ])
            ->all();

        $matriculaPorSubsistema = Institucion::query()
            ->join('subsistemas as s', 's.id', '=', 'instituciones.subsistema_id')
            ->join('ofertas_academicas as o', 'o.institucion_id', '=', 'instituciones.id')
            ->join('matriculas as m', 'm.oferta_academica_id', '=', 'o.id')
            ->where('instituciones.activo', true)
            ->whereIn('m.estado', ['activa', 'vigente'])
            ->selectRaw('s.nombre as subsistema, COUNT(m.id) as matricula_activa')
            ->groupBy('s.id', 's.nombre')
            ->orderByDesc('matricula_activa')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'subsistema' => (string) $row->subsistema,
                'matricula_activa' => (int) $row->matricula_activa,
            ])
            ->all();

        $reportesFrecuentes = [
            ['titulo' => '911. Estadística de inicio de cursos', 'ruta' => '/app/educacion-superior/reportes-oficiales'],
            ['titulo' => '912. Matrícula por programa educativo', 'ruta' => '/app/educacion-superior/reportes-oficiales'],
            ['titulo' => '917. Solicitudes de matrícula', 'ruta' => '/app/solicitudes-matricula'],
            ['titulo' => '916. Validaciones normativas', 'ruta' => '/app/educacion-superior/validaciones-normativas'],
        ];

        $metricas = array_merge($b, $m, [
            'instituciones_activas' => $institucionesActivas,
            'sedes_registradas' => $sedesRegistradas,
            'programas_academicos_vigentes' => $programasVigentes,
            'planes_estudio_vigentes' => $planesVigentes,
            'alumnos_activos' => Alumno::query()->where('estatus', 'activo')->count(),
            'egresados_candidatos' => TrayectoriaAcademica::query()->whereIn('estado', ['consolidada', 'lista_certificacion'])->count(),
            'certificados_emitidos_referencia' => (int) ($b['firmados'] ?? 0),
            'documentos_proceso_tecnico' => (int) ($b['listos_para_firma'] ?? 0),
            'documentos_emitidos' => (int) ($b['firmados'] ?? 0),
            'alertas_normativas' => count($alertas),
        ]);

        return [
            'variant' => 'educacion_superior',
            'technical' => false,
            'contexto' => [
                'subsistema' => 'Educación Normal y UPN (autoridad académica central)',
                'institucion' => 'Ámbito nacional / coordinación',
                'sede' => 'Según asignación de perfil',
                'ciclo_escolar' => now()->format('Y').'-'.(string) ((int) now()->format('Y') + 1),
            ],
            'metricas' => $metricas,
            'cards' => [
                ['key' => 'instituciones_activas', 'title' => 'Instituciones activas', 'value' => $metricas['instituciones_activas'], 'href' => '/app/educacion-superior/instituciones'],
                ['key' => 'sedes_registradas', 'title' => 'Sedes / subsedes registradas', 'value' => $metricas['sedes_registradas'], 'href' => '/app/educacion-superior/sedes'],
                ['key' => 'programas_academicos_vigentes', 'title' => 'Programas académicos vigentes', 'value' => $metricas['programas_academicos_vigentes'], 'href' => '/app/educacion-superior/programas'],
                ['key' => 'planes_estudio_vigentes', 'title' => 'Planes de estudio vigentes', 'value' => $metricas['planes_estudio_vigentes'], 'href' => '/app/educacion-superior/planes'],
                ['key' => 'sol_pen', 'title' => 'Solicitudes de matrícula pendientes', 'value' => $m['solicitudes_matricula_pendientes'] ?? 0, 'href' => '/app/solicitudes-matricula'],
                ['key' => 'pend_rev', 'title' => 'Expedientes en validación normativa', 'value' => $b['pendientes_revision'] ?? 0, 'href' => '/app/educacion-superior/validaciones-normativas'],
                ['key' => 'egreso', 'title' => 'Candidatos a egreso', 'value' => $metricas['egresados_candidatos'], 'href' => '/app/documentos/bandejas/pendientes-revision'],
                ['key' => 'emitidos', 'title' => 'Documentos emitidos', 'value' => $metricas['documentos_emitidos'], 'href' => '/app/documentos/bandejas/aprobados'],
                ['key' => 'alertas', 'title' => 'Alertas normativas', 'value' => $metricas['alertas_normativas'], 'href' => '/app/documentos/bandejas/rechazados'],
            ],
            'matricula_por_institucion' => $matriculaPorInstitucion,
            'matricula_por_subsistema' => $matriculaPorSubsistema,
            'reportes_frecuentes' => $reportesFrecuentes,
            'tabla_solicitudes_matricula' => [
                'titulo' => 'Solicitudes de matrícula pendientes',
                'filas' => $tabla,
            ],
            'tabla_expedientes_normativa' => [
                'titulo' => 'Validaciones normativas — expedientes en revisión',
                'filas' => $tablaNormativa,
            ],
            'tabla_documentos_pendientes_liberar' => [
                'titulo' => 'Documentos listos para envío a proceso técnico',
                'filas' => $tablaLiberar,
            ],
            'alertas_normativas' => $alertas,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\OfertaAcademica;
use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\ControlEscolar\ControlEscolarDashboardService;

final class DirectorEscuelaDashboardService
{
    public function __construct(
        private readonly ControlEscolarDashboardService $controlEscolar,
        private readonly BandejaDocumentoAcademicoService $bandejas,
        private readonly DashboardRequestFactory $requestFactory,
        private readonly CertificacionAlcanceService $alcance,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $operativo = $this->controlEscolar->resumen($user);
        $m = $operativo['metricas'] ?? [];
        $req = $this->requestFactory->forUser($user);
        $b = $this->bandejas->resumen($req);

        $metricas = [
            'alumnos_activos' => (int) ($m['alumnos_activos'] ?? 0),
            'inscripciones_pendientes' => (int) ($m['inscripciones_pendientes'] ?? 0),
            'reinscripciones_seguimiento' => (int) ($m['cargas_academicas_pendientes'] ?? 0),
            'calificaciones_pendientes' => (int) ($m['calificaciones_pendientes'] ?? 0),
            'candidatos_egreso' => (int) ($m['trayectorias_listas_para_certificar'] ?? 0),
            'incidencias' => (int) (($m['documentos_con_observaciones'] ?? 0) + ($m['solicitudes_en_revision'] ?? 0)),
            'por_enviar' => (int) ($b['por_enviar'] ?? 0),
            'en_revision' => (int) ($b['en_revision'] ?? 0),
            'aprobados' => (int) ($b['aprobados'] ?? 0),
            'rechazados' => (int) ($b['rechazados'] ?? 0),
        ];

        $cards = [
            ['key' => 'alumnos_activos', 'title' => 'Alumnos activos', 'value' => $metricas['alumnos_activos'], 'href' => '/app/direccion/alumnos'],
            ['key' => 'inscripciones_pendientes', 'title' => 'Inscripciones', 'value' => $metricas['inscripciones_pendientes'], 'href' => '/app/direccion/inscripciones'],
            ['key' => 'reinscripciones_seguimiento', 'title' => 'Reinscripciones', 'value' => $metricas['reinscripciones_seguimiento'], 'href' => '/app/direccion/reinscripciones'],
            ['key' => 'calificaciones_pendientes', 'title' => 'Calificaciones pendientes', 'value' => $metricas['calificaciones_pendientes'], 'href' => '/app/direccion/calificaciones'],
            ['key' => 'candidatos_egreso', 'title' => 'Candidatos a egreso', 'value' => $metricas['candidatos_egreso'], 'href' => '/app/direccion/egreso-titulacion'],
            ['key' => 'incidencias', 'title' => 'Incidencias', 'value' => $metricas['incidencias'], 'href' => '/app/direccion/documentos'],
        ];

        return [
            'variant' => 'director_escuela',
            'technical' => false,
            'contexto' => $operativo['contexto'] ?? [],
            'metricas' => $metricas,
            'cards' => $cards,
            'pendientes_prioritarios' => $this->mapearPendientesDireccion($operativo['pendientes_prioritarios'] ?? []),
            'matricula_por_programa' => $this->matriculaPorPrograma($user),
            'avance_procesos' => $this->avanceProcesos($metricas),
            'pendientes_criticos_sugeridos' => $this->pendientesCriticosSugeridos($metricas),
            'decisiones_recientes_direccion' => $this->decisionesRecientesDireccion(),
            'reportes_frecuentes' => $this->reportesFrecuentes(),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $pendientes
     * @return list<array<string, mixed>>
     */
    private function mapearPendientesDireccion(array $pendientes): array
    {
        $mapaAccion = [
            'Solicitar matricula a Educacion Superior' => 'Dar seguimiento institucional (matricula vía Educacion Superior)',
            'Registrar inscripcion de periodo' => 'Supervisar inscripcion de periodo con Control Escolar',
            'Generar carga academica' => 'Supervisar carga academica e inscripcion',
            'Atender observacion' => 'Revisar observacion institucional',
        ];

        $out = [];
        foreach ($pendientes as $p) {
            $accion = (string) ($p['siguiente_accion'] ?? '');
            $p['siguiente_accion'] = $mapaAccion[$accion] ?? $accion;
            $out[] = $p;
        }

        return $out;
    }

    /**
     * @return list<array{programa: string, matricula_activa: int}>
     */
    private function matriculaPorPrograma(User $user): array
    {
        $q = OfertaAcademica::query()
            ->with('programaEstudio:id,nombre')
            ->where('activo', true);
        $this->alcance->aplicarAlcanceOfertasAcademicas($q, $user);

        return $q
            ->withCount([
                'matriculas as activas_count' => function ($mq): void {
                    $mq->whereIn('estado', ['activa', 'vigente']);
                },
            ])
            ->orderBy('id')
            ->get()
            ->map(fn (OfertaAcademica $o) => [
                'programa' => (string) ($o->programaEstudio?->nombre ?? 'Programa'),
                'matricula_activa' => (int) ($o->activas_count ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, int>  $metricas
     * @return list<array{clave: string, etiqueta: string, avance: int}>
     */
    private function avanceProcesos(array $metricas): array
    {
        $alumnos = max(1, (int) ($metricas['alumnos_activos'] ?? 1));

        $pct = static function (int $num, int $den): int {
            if ($den <= 0) {
                return 0;
            }

            return (int) max(0, min(100, (int) round(100 - ($num / $den) * 100)));
        };

        return [
            ['clave' => 'inscripcion', 'etiqueta' => 'Inscripciones', 'avance' => $pct($metricas['inscripciones_pendientes'] ?? 0, $alumnos)],
            ['clave' => 'reinscripcion', 'etiqueta' => 'Reinscripciones', 'avance' => $pct($metricas['reinscripciones_seguimiento'] ?? 0, $alumnos)],
            ['clave' => 'calificaciones', 'etiqueta' => 'Captura de calificaciones', 'avance' => $pct($metricas['calificaciones_pendientes'] ?? 0, $alumnos)],
            ['clave' => 'egreso', 'etiqueta' => 'Egreso y titulación', 'avance' => $pct($metricas['candidatos_egreso'] ?? 0, $alumnos)],
        ];
    }

    /**
     * @param  array<string, int>  $metricas
     * @return list<string>
     */
    private function pendientesCriticosSugeridos(array $metricas): array
    {
        $items = [];
        if (($metricas['calificaciones_pendientes'] ?? 0) > 0) {
            $items[] = 'Calificaciones sin capturar en el alcance de la escuela';
        }
        if (($metricas['inscripciones_pendientes'] ?? 0) > 0) {
            $items[] = 'Expedientes con inscripcion de periodo pendiente';
        }
        if (($metricas['rechazados'] ?? 0) > 0) {
            $items[] = 'Documentos con observaciones institucionales';
        }
        if (($metricas['candidatos_egreso'] ?? 0) > 0) {
            $items[] = 'Candidatos a egreso pendientes de autorizacion institucional';
        }
        if (($metricas['reinscripciones_seguimiento'] ?? 0) > 0) {
            $items[] = 'Reinscripciones o continuidad con carga academica pendiente';
        }
        if (($metricas['incidencias'] ?? 0) > 0) {
            $items[] = 'Incidencias academicas o documentales abiertas';
        }
        if (($metricas['en_revision'] ?? 0) + ($metricas['por_enviar'] ?? 0) > 0) {
            $items[] = 'Documentos institucionales por validar';
        }

        return $items;
    }

    /**
     * @return list<array{titulo: string, ruta: string}>
     */
    private function reportesFrecuentes(): array
    {
        return [
            ['titulo' => 'Reporte de matricula', 'ruta' => '/app/direccion/reportes'],
            ['titulo' => 'Reporte de inscripciones', 'ruta' => '/app/direccion/reportes'],
            ['titulo' => 'Reporte de reinscripciones', 'ruta' => '/app/direccion/reportes'],
            ['titulo' => 'Reporte de expedientes completos', 'ruta' => '/app/direccion/reportes'],
            ['titulo' => 'Reporte de pendientes', 'ruta' => '/app/direccion/reportes'],
            ['titulo' => 'Reporte de calificaciones pendientes', 'ruta' => '/app/direccion/calificaciones'],
            ['titulo' => 'Reporte de candidatos a egreso', 'ruta' => '/app/direccion/egreso-titulacion'],
            ['titulo' => 'Reporte de incidencias', 'ruta' => '/app/direccion/autorizaciones-observaciones'],
            ['titulo' => 'Reporte de documentos observados', 'ruta' => '/app/direccion/documentos'],
            ['titulo' => 'Reporte de indicadores institucionales', 'ruta' => '/app/direccion/indicadores'],
        ];
    }

    /**
     * @return list<array{fecha: string, tipo: string, asunto: string, descripcion: string, autor: string, estatus: string}>
     */
    private function decisionesRecientesDireccion(): array
    {
        return [
            [
                'fecha' => '20/05/2025 09:12',
                'tipo' => 'Inscripcion',
                'asunto' => 'Autorizacion de inscripcion extemporanea',
                'descripcion' => 'Dictamen favorable con documentacion completa en expediente institucional.',
                'autor' => 'Direccion',
                'estatus' => 'Completado',
            ],
            [
                'fecha' => '19/05/2025 16:40',
                'tipo' => 'Reinscripcion',
                'asunto' => 'Aprobacion de reinscripcion excepcional',
                'descripcion' => 'Excepcion por trayectoria consolidada y sin observaciones academicas abiertas.',
                'autor' => 'Direccion',
                'estatus' => 'En proceso',
            ],
            [
                'fecha' => '19/05/2025 11:05',
                'tipo' => 'Calificaciones',
                'asunto' => 'Validacion institucional de calificaciones',
                'descripcion' => 'Cierre de acta de 6° A Educacion Primaria sin observaciones.',
                'autor' => 'Direccion',
                'estatus' => 'Completado',
            ],
            [
                'fecha' => '18/05/2025 14:22',
                'tipo' => 'Documentos',
                'asunto' => 'Autorizacion de documento',
                'descripcion' => 'Constancia de estudios revisada conforme a lineamientos institucionales.',
                'autor' => 'Direccion',
                'estatus' => 'En revisión',
            ],
            [
                'fecha' => '17/05/2025 15:33',
                'tipo' => 'Egreso',
                'asunto' => 'Autorizacion de egreso',
                'descripcion' => 'Expediente academico completo y dictamen favorable para tramite de egreso.',
                'autor' => 'Direccion',
                'estatus' => 'Completado',
            ],
        ];
    }
}

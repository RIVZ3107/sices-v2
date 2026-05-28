<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\DocumentoAcademico;
use App\Models\IntegracionLog;
use App\Models\Menu;
use App\Models\User;
use App\Models\VisualDatasetEvent;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;
use App\Support\DatasetVisualRolesMetadata;
use Illuminate\Support\Facades\Schema;

final class SistemasDashboardService
{
    public function __construct(
        private readonly BandejaDocumentoAcademicoService $bandejas,
        private readonly DashboardRequestFactory $requestFactory,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $req = $this->requestFactory->forUser($user);
        $b = $this->bandejas->resumen($req);

        $jobsPendientes = 0;
        if (Schema::hasTable('jobs')) {
            $jobsPendientes = (int) \Illuminate\Support\Facades\DB::table('jobs')->count();
        }

        $xmlError = DocumentoAcademico::query()
            ->where('estado_firma', 'error_firma')
            ->count();
        $firmaError = (int) ($b['error_firma'] ?? 0);
        $pdfPendiente = (int) ($b['pendientes_tecnicos'] ?? 0);

        $dataset = DatasetVisualRolesMetadata::DATASET;
        $eventosSim = 0;
        if (Schema::hasTable('visual_dataset_events')) {
            $eventosSim = (int) VisualDatasetEvent::query()->where('metadata->dataset', $dataset)->count();
        }
        $logsDataset = IntegracionLog::query()->where('metadata->dataset', $dataset)->count();

        $telemetria = [];
        if (Schema::hasTable('visual_dataset_events')) {
            $telemetria['buckets'] = VisualDatasetEvent::query()
                ->where('metadata->dataset', $dataset)
                ->selectRaw('bucket, estado, count(*) as total')
                ->groupBy('bucket', 'estado')
                ->orderBy('bucket')
                ->get()
                ->map(fn ($r) => ['bucket' => $r->bucket, 'estado' => $r->estado, 'total' => (int) $r->total])
                ->all();
            $telemetria['recientes'] = VisualDatasetEvent::query()
                ->where('metadata->dataset', $dataset)
                ->latest('id')
                ->limit(12)
                ->get(['id', 'bucket', 'estado', 'summary', 'created_at'])
                ->map(fn (VisualDatasetEvent $e) => [
                    'id' => $e->id,
                    'bucket' => $e->bucket,
                    'estado' => $e->estado,
                    'summary' => $e->summary,
                    'creado' => $e->created_at?->toIso8601String(),
                ])
                ->all();
        }

        return [
            'variant' => 'sistemas',
            'technical' => true,
            'cards' => [
                ['key' => 'jobs', 'title' => 'Jobs en cola', 'value' => $jobsPendientes, 'href' => '/app/sistemas/dashboard'],
                ['key' => 'errores_tecnicos', 'title' => 'Errores técnicos (documentos)', 'value' => $firmaError + $xmlError, 'href' => '/app/documentos/bandejas/errores-firma'],
                ['key' => 'xml_error', 'title' => 'Incidencias XML / firma (estado error)', 'value' => $xmlError, 'href' => '/app/sistemas/configuracion'],
                ['key' => 'firma_error', 'title' => 'Firma con error (bandeja)', 'value' => $firmaError, 'href' => '/app/documentos/bandejas/errores-firma'],
                ['key' => 'pdf_pendiente', 'title' => 'Pendientes técnicos / PDF', 'value' => $pdfPendiente, 'href' => '/app/sistemas/configuracion'],
                ['key' => 'listos_firma', 'title' => 'Listos para firma', 'value' => $b['listos_para_firma'] ?? 0, 'href' => '/app/sistemas/proceso-tecnico-certificacion'],
                ['key' => 'integraciones', 'title' => 'Integraciones (simulación / logs)', 'value' => max(1, $logsDataset), 'href' => '/app/sistemas/configuracion'],
                ['key' => 'logs', 'title' => 'Logs técnicos (referencia)', 'value' => max(1, $logsDataset), 'href' => '/app/sistemas/logs'],
                ['key' => 'jobs_sim', 'title' => 'Eventos técnicos simulados (dataset)', 'value' => $eventosSim, 'href' => '/app/sistemas/dashboard'],
                ['key' => 'menus', 'title' => 'Menús configurados', 'value' => Menu::query()->count(), 'href' => '/app/admin/menus'],
                ['key' => 'usuarios_activos', 'title' => 'Usuarios', 'value' => User::query()->count(), 'href' => '/app/admin/usuarios-roles'],
            ],
            'bandeja_resumen' => $b,
            'telemetria_visual' => $telemetria,
            'notas' => [
                'No se ejecuta XML real, firma real ni PDF oficial desde este panel; solo monitoreo y enlaces operativos.',
            ],
        ];
    }
}

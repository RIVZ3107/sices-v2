<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Models\User;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use App\Support\Demo\DemoDataScope;
use Illuminate\Support\Facades\DB;

final class DemoDataCleanupService
{
    public function __construct(
        private readonly ResetDemoControlEscolarService $resetCe = new ResetDemoControlEscolarService,
        private readonly DemoDataScope $scope = new DemoDataScope,
        private readonly DemoSoftDeletedPurgeService $purgeSoftDeleted = new DemoSoftDeletedPurgeService,
    ) {}

    /**
     * @return array<string, int>
     */
    public function plan(bool $incluirUsuariosDemo): array
    {
        $plan = $this->scope->conteos();
        if ($incluirUsuariosDemo) {
            $plan['usuarios_demo'] = $this->scope->queryUsuariosDemo()->count();
        }

        return $plan;
    }

    /**
     * @return array<string, int>
     */
    public function planPurgeSoftDeleted(bool $incluirUsuariosDemo): array
    {
        return $this->purgeSoftDeleted->plan($incluirUsuariosDemo);
    }

    /**
     * @return array<string, int>
     */
    public function ejecutar(bool $incluirUsuariosDemo): array
    {
        $antes = $this->scope->conteos();

        DB::transaction(function () use ($incluirUsuariosDemo): void {
            $this->resetCe->ejecutar();

            if ($incluirUsuariosDemo) {
                $this->scope->queryUsuariosDemo()->each(static function (User $user): void {
                    $user->roles()->detach();
                    $user->sedes()->detach();
                    $user->delete();
                });
            }
        });

        $despues = $this->scope->conteos();
        $eliminados = [];
        foreach ($antes as $clave => $valor) {
            $eliminados[$clave] = max(0, $valor - ($despues[$clave] ?? 0));
        }
        if ($incluirUsuariosDemo) {
            $eliminados['usuarios_demo'] = max(
                0,
                ($antes['usuarios_demo'] ?? 0) - ($despues['usuarios_demo'] ?? 0),
            );
        }

        return $eliminados;
    }

    /**
     * @return array{antes: array<string, int>, eliminados: array<string, int>, despues: array<string, int>}
     */
    public function ejecutarPurgeSoftDeleted(bool $incluirUsuariosDemo): array
    {
        return $this->purgeSoftDeleted->ejecutar($incluirUsuariosDemo);
    }
}

<?php

namespace App\Providers;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Infrastructure\ControlEscolar\DatabaseControlEscolarSourceAdapter;
use App\Infrastructure\SicesLegacy\InformixSicesLegacyCertificadoRepository;
use App\Models\Alumno;
use App\Models\ConfiguracionVisualSistema;
use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Observers\AlumnoObserver;
use App\Observers\MateriaCursadaObserver;
use App\Observers\MatriculaObserver;
use App\Policies\AlumnoPolicy;
use App\Policies\ConfiguracionVisualSistemaPolicy;
use App\Policies\DocumentoAcademicoPolicy;
use App\Policies\MatriculaPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            ControlEscolarSourceAdapterInterface::class,
            DatabaseControlEscolarSourceAdapter::class,
        );

        $this->app->bind(
            SicesLegacyCertificadoRepositoryInterface::class,
            InformixSicesLegacyCertificadoRepository::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(DocumentoAcademico::class, DocumentoAcademicoPolicy::class);
        Gate::policy(Matricula::class, MatriculaPolicy::class);
        Gate::policy(Alumno::class, AlumnoPolicy::class);
        Gate::policy(ConfiguracionVisualSistema::class, ConfiguracionVisualSistemaPolicy::class);

        Alumno::observe(AlumnoObserver::class);
        Matricula::observe(MatriculaObserver::class);
        MateriaCursada::observe(MateriaCursadaObserver::class);
    }
}

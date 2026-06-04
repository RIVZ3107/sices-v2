<?php



declare(strict_types=1);



namespace App\Console\Commands;



use App\Services\Demo\DemoDataCleanupService;

use Database\Seeders\Concerns\GuardsDemoSeeders;

use Database\Seeders\Demo\CertificacionControlEscolarDemoSeeder;

use Illuminate\Console\Command;



/**

 * @deprecated Use `php artisan sices:limpiar-demo --confirm` and, si aplica, `--purge-soft-deleted`.

 */

final class ResetDemoControlEscolarCommand extends Command

{

    protected $signature = 'sices:reset-demo-control-escolar

                            {--seed : Tras borrar, re-ejecuta CertificacionControlEscolarDemoSeeder (requiere ALLOW_DEMO_SEEDERS)}

                            {--force : Requerido en entorno production}';



    protected $description = '[DEPRECATED] Use sices:limpiar-demo. Reset demo Control Escolar (metadata.origen=demo_control_escolar).';



    public function handle(DemoDataCleanupService $cleanup): int

    {

        $this->warn('Comando deprecado. Preferir: php artisan sices:limpiar-demo --confirm [--purge-soft-deleted]');



        if ($this->laravel->environment('production') && ! $this->option('force')) {

            $this->error('En production esta operación requiere el flag explícito --force.');



            return self::FAILURE;

        }



        $cleanup->ejecutar(false);

        $this->info('Datos demo Control Escolar eliminados (misma lógica que sices:limpiar-demo --confirm).');



        if ($this->option('seed')) {

            if (! GuardsDemoSeeders::demoSeedersAllowed()) {

                $this->error('Los seeders demo están deshabilitados. Active ALLOW_DEMO_SEEDERS=true solo en local/testing.');



                return self::FAILURE;

            }

            $this->call('db:seed', ['--class' => CertificacionControlEscolarDemoSeeder::class]);

        }



        return self::SUCCESS;

    }

}



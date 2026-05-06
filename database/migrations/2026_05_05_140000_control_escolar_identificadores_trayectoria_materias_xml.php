<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumnos', function (Blueprint $table) {
            $table->string('rfc', 13)->nullable();
            $table->string('curp_raiz', 16)->nullable();
            $table->string('curp_digito', 2)->nullable();
            $table->string('rfc_raiz', 10)->nullable();
            $table->string('rfc_homoclave', 3)->nullable();
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE documentos_academicos MODIFY COLUMN estado_xml ENUM('no_generado','generado','sellado','timbrado','validado','error_xml') NOT NULL DEFAULT 'no_generado'");
        }

        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->dropUnique(['alumno_id', 'matricula_id']);
        });

        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->unique('matricula_id');
        });

        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->unique(
                ['matricula_id', 'ciclo_escolar_id', 'clave', 'periodo'],
                'materias_cursadas_matricula_ciclo_clave_periodo_unique'
            );
        });

        DB::table('alumnos')->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $c = (string) $row->curp;
                if (strlen($c) !== 18) {
                    continue;
                }
                $u = strtoupper($c);
                DB::table('alumnos')->where('id', $row->id)->update([
                    'curp' => $u,
                    'curp_raiz' => substr($u, 0, 16),
                    'curp_digito' => substr($u, 16, 2),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('materias_cursadas', function (Blueprint $table) {
            $table->dropUnique('materias_cursadas_matricula_ciclo_clave_periodo_unique');
        });

        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->dropUnique(['matricula_id']);
        });

        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->unique(['alumno_id', 'matricula_id']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE documentos_academicos MODIFY COLUMN estado_xml ENUM('no_generado','generado','sellado','timbrado','error_xml') NOT NULL DEFAULT 'no_generado'");
        }

        Schema::table('alumnos', function (Blueprint $table) {
            $table->dropColumn(['rfc', 'curp_raiz', 'curp_digito', 'rfc_raiz', 'rfc_homoclave']);
        });
    }
};

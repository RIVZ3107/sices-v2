<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->unsignedSmallInteger('asignaturas_cursadas')->nullable()->after('materias_reprobadas');
            $table->unsignedSmallInteger('asignaturas_total')->nullable()->after('asignaturas_cursadas');
            $table->decimal('promedio_aprovechamiento', 5, 2)->nullable()->after('asignaturas_total');
            $table->unsignedSmallInteger('materias_acreditadas')->nullable()->after('promedio_aprovechamiento');
            $table->unsignedSmallInteger('materias_no_acreditadas')->nullable()->after('materias_acreditadas');
            $table->string('estatus_trayectoria', 40)->nullable()->after('materias_no_acreditadas');
        });
    }

    public function down(): void
    {
        Schema::table('trayectorias_academicas', function (Blueprint $table) {
            $table->dropColumn([
                'asignaturas_cursadas',
                'asignaturas_total',
                'promedio_aprovechamiento',
                'materias_acreditadas',
                'materias_no_acreditadas',
                'estatus_trayectoria',
            ]);
        });
    }
};

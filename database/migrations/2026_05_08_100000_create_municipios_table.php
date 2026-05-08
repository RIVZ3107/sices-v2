<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('municipios', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('entidad_federativa_id');
            $table->string('clave_municipio', 3);
            $table->string('nombre', 150);
            $table->string('nombre_oficial', 150);
            $table->string('estatus', 20)->default('activo');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['entidad_federativa_id', 'clave_municipio'], 'municipios_entidad_clave_unique');
            $table->index('entidad_federativa_id', 'municipios_entidad_idx');
            $table->index('clave_municipio', 'municipios_clave_idx');
            $table->index('nombre', 'municipios_nombre_idx');
            $table->index('estatus', 'municipios_estatus_idx');

            $table->foreign('entidad_federativa_id', 'municipios_entidad_fk')
                ->references('id')
                ->on('entidades_federativas')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('municipios', function (Blueprint $table): void {
            $table->dropForeign('municipios_entidad_fk');
        });

        Schema::dropIfExists('municipios');
    }
};

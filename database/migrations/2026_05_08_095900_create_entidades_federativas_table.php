<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entidades_federativas', function (Blueprint $table): void {
            $table->unsignedBigInteger('id')->primary();
            $table->string('clave_entidad', 2)->unique();
            $table->string('nombre', 150);
            $table->string('nombre_oficial', 150);
            $table->string('abreviatura', 10);
            $table->string('estatus', 20)->default('activo');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('nombre', 'entidades_federativas_nombre_idx');
            $table->index('abreviatura', 'entidades_federativas_abr_idx');
            $table->index('estatus', 'entidades_federativas_estatus_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entidades_federativas');
    }
};

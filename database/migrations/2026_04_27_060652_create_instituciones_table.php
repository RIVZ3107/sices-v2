<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('instituciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->constrained('subsistemas')->restrictOnDelete();
            // Se declara como columna simple porque `regiones` se crea en una migración posterior.
            $table->unsignedBigInteger('region_id')->nullable();
            $table->string('clave', 40)->unique();
            $table->string('nombre', 180);
            $table->string('nombre_corto', 60)->nullable();
            $table->string('rvoe', 80)->nullable();
            $table->string('email_contacto', 150)->nullable();
            $table->string('telefono_contacto', 30)->nullable();
            $table->boolean('activo')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('subsistema_id');
            $table->index('region_id');
            $table->index(['subsistema_id', 'region_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instituciones');
    }
};

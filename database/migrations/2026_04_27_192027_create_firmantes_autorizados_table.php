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
        Schema::create('firmantes_autorizados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subsistema_id')->nullable()->constrained('subsistemas')->nullOnDelete();
            $table->foreignId('institucion_id')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->string('nombre', 120);
            $table->string('primer_apellido', 120);
            $table->string('segundo_apellido', 120)->nullable();
            $table->string('curp', 18)->nullable();
            $table->string('rfc', 13)->nullable();
            $table->string('cargo', 120);
            $table->string('email', 150)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->date('vigencia_inicio')->nullable();
            $table->date('vigencia_fin')->nullable();
            $table->enum('estatus', ['activo', 'inactivo', 'vencido', 'revocado'])->default('activo');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['subsistema_id', 'estatus']);
            $table->index(['institucion_id', 'estatus']);
            $table->index('curp');
            $table->index('rfc');
            $table->index('estatus');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firmantes_autorizados');
    }
};

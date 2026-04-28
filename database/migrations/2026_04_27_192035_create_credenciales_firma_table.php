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
        Schema::create('credenciales_firma', function (Blueprint $table) {
            $table->id();
            $table->foreignId('firmante_autorizado_id')->constrained('firmantes_autorizados')->restrictOnDelete();
            $table->enum('tipo', ['pfx', 'pem', 'key', 'hsm', 'servicio_externo']);
            $table->string('alias', 120);
            $table->string('serial_certificado', 120)->nullable();
            $table->string('certificado_publico_path', 255)->nullable();
            $table->string('llave_privada_path', 255)->nullable();
            $table->string('pfx_path', 255)->nullable();
            $table->text('password_encrypted')->nullable();
            $table->date('vigencia_inicio')->nullable();
            $table->date('vigencia_fin')->nullable();
            $table->enum('estatus', ['activa', 'inactiva', 'vencida', 'revocada'])->default('activa');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['firmante_autorizado_id', 'estatus']);
            $table->index('serial_certificado');
            $table->index('alias');
            $table->index(['vigencia_inicio', 'vigencia_fin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credenciales_firma');
    }
};

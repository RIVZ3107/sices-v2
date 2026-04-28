<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matriculas', function (Blueprint $table) {
            $table->foreign('oferta_academica_id')
                ->references('id')
                ->on('ofertas_academicas')
                ->restrictOnDelete();
        });

        Schema::table('documentos_academicos', function (Blueprint $table) {
            $table->foreign('oferta_academica_id')
                ->references('id')
                ->on('ofertas_academicas')
                ->nullOnDelete();
            $table->foreign('region_id')
                ->references('id')
                ->on('regiones')
                ->nullOnDelete();
        });

        Schema::table('cadena_original_generadas', function (Blueprint $table) {
            $table->foreign('documento_payload_id')
                ->references('id')
                ->on('documento_payloads')
                ->restrictOnDelete();
        });

        Schema::table('documento_versiones', function (Blueprint $table) {
            $table->foreign('documento_payload_id')
                ->references('id')
                ->on('documento_payloads')
                ->nullOnDelete();
        });

        Schema::table('documento_firmas', function (Blueprint $table) {
            $table->foreign('firma_configuracion_id')
                ->references('id')
                ->on('firma_configuraciones')
                ->nullOnDelete();
            $table->foreign('firmante_autorizado_id')
                ->references('id')
                ->on('firmantes_autorizados')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documento_firmas', function (Blueprint $table) {
            $table->dropForeign(['firma_configuracion_id']);
            $table->dropForeign(['firmante_autorizado_id']);
        });

        Schema::table('documento_versiones', function (Blueprint $table) {
            $table->dropForeign(['documento_payload_id']);
        });

        Schema::table('cadena_original_generadas', function (Blueprint $table) {
            $table->dropForeign(['documento_payload_id']);
        });

        Schema::table('documentos_academicos', function (Blueprint $table) {
            $table->dropForeign(['oferta_academica_id']);
            $table->dropForeign(['region_id']);
        });

        Schema::table('matriculas', function (Blueprint $table) {
            $table->dropForeign(['oferta_academica_id']);
        });
    }
};

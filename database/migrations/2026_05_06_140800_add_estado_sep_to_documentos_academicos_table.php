<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documentos_academicos', function (Blueprint $table) {
            $table->string('estado_sep', 30)
                ->default('no_enviado')
                ->after('estado_firma')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('documentos_academicos', function (Blueprint $table) {
            $table->dropIndex(['estado_sep']);
            $table->dropColumn('estado_sep');
        });
    }
};

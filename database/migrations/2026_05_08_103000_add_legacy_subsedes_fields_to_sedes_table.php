<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sedes', function (Blueprint $table): void {
            if (! Schema::hasColumn('sedes', 'cct')) {
                $table->string('cct', 20)->nullable()->after('clave');
                $table->index('cct', 'sedes_cct_idx');
            }
            if (! Schema::hasColumn('sedes', 'legacy_kcve_subsede')) {
                $table->unsignedBigInteger('legacy_kcve_subsede')->nullable()->after('metadata');
                $table->unique('legacy_kcve_subsede', 'sedes_legacy_kcve_subsede_unique');
            }
            if (! Schema::hasColumn('sedes', 'legacy_rcve_institucion')) {
                $table->unsignedBigInteger('legacy_rcve_institucion')->nullable()->after('legacy_kcve_subsede');
                $table->index('legacy_rcve_institucion', 'sedes_legacy_rcve_institucion_idx');
            }
            if (! Schema::hasColumn('sedes', 'legacy_rcvect')) {
                $table->unsignedBigInteger('legacy_rcvect')->nullable()->after('legacy_rcve_institucion');
                $table->index('legacy_rcvect', 'sedes_legacy_rcvect_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sedes', function (Blueprint $table): void {
            if (Schema::hasColumn('sedes', 'legacy_rcvect')) {
                $table->dropIndex('sedes_legacy_rcvect_idx');
                $table->dropColumn('legacy_rcvect');
            }
            if (Schema::hasColumn('sedes', 'legacy_rcve_institucion')) {
                $table->dropIndex('sedes_legacy_rcve_institucion_idx');
                $table->dropColumn('legacy_rcve_institucion');
            }
            if (Schema::hasColumn('sedes', 'legacy_kcve_subsede')) {
                $table->dropUnique('sedes_legacy_kcve_subsede_unique');
                $table->dropColumn('legacy_kcve_subsede');
            }
            if (Schema::hasColumn('sedes', 'cct')) {
                $table->dropIndex('sedes_cct_idx');
                $table->dropColumn('cct');
            }
        });
    }
};

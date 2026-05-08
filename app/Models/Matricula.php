<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Matricula extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (Matricula $matricula): void {
            if ($matricula->subsistema_id !== null || (int) $matricula->oferta_academica_id <= 0) {
                return;
            }
            $subsistemaId = OfertaAcademica::query()
                ->join('instituciones as i', 'i.id', '=', 'ofertas_academicas.institucion_id')
                ->where('ofertas_academicas.id', $matricula->oferta_academica_id)
                ->value('i.subsistema_id');
            if ($subsistemaId !== null) {
                $matricula->subsistema_id = (int) $subsistemaId;
            }
        });
    }

    protected $table = 'matriculas';

    protected $fillable = [
        'alumno_id',
        'oferta_academica_id',
        'ciclo_escolar_id',
        'subsistema_id',
        'matricula',
        'estado',
        'fecha_ingreso',
        'fecha_egreso',
        'metadata',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_egreso' => 'date',
        'metadata' => 'array',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function ofertaAcademica(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function materiasCursadas(): HasMany
    {
        return $this->hasMany(MateriaCursada::class);
    }

    public function trayectoriaAcademica(): HasOne
    {
        return $this->hasOne(TrayectoriaAcademica::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }

    public function inscripcionesPeriodo(): HasMany
    {
        return $this->hasMany(InscripcionPeriodo::class);
    }
}

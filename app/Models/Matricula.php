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

    protected $table = 'matriculas';

    protected $fillable = [
        'alumno_id',
        'oferta_academica_id',
        'ciclo_escolar_id',
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
}

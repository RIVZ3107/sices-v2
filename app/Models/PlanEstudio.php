<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlanEstudio extends Model
{
    use SoftDeletes;

    protected $table = 'planes_estudio';

    protected $fillable = [
        'programa_estudio_id',
        'subsistema_id',
        'clave',
        'nombre',
        'anio_aprobacion',
        'vigencia_inicio',
        'vigencia_fin',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'anio_aprobacion' => 'integer',
        'vigencia_inicio' => 'date',
        'vigencia_fin' => 'date',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function programaEstudio(): BelongsTo
    {
        return $this->belongsTo(ProgramaEstudio::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function materias(): HasMany
    {
        return $this->hasMany(Materia::class);
    }

    public function ofertasAcademicas(): HasMany
    {
        return $this->hasMany(OfertaAcademica::class);
    }

    public function planMaterias(): HasMany
    {
        return $this->hasMany(PlanMateria::class);
    }
}

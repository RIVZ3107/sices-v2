<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CicloEscolar extends Model
{
    use SoftDeletes;

    protected $table = 'ciclos_escolares';

    protected $fillable = [
        'clave',
        'nombre',
        'fecha_inicio',
        'fecha_fin',
        'es_actual',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'es_actual' => 'boolean',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function ofertasAcademicasInicio(): HasMany
    {
        return $this->hasMany(OfertaAcademica::class, 'ciclo_escolar_id');
    }

    public function ofertasAcademicasFin(): HasMany
    {
        return $this->hasMany(OfertaAcademica::class, 'ciclo_escolar_id');
    }

    public function ventanasOperacion(): HasMany
    {
        return $this->hasMany(VentanaOperacion::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }

    public function folios(): HasMany
    {
        return $this->hasMany(Folio::class);
    }
}

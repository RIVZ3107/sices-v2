<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class NivelAcademico extends Model
{
    use SoftDeletes;

    protected $table = 'niveles_academicos';

    protected $fillable = [
        'clave',
        'nombre',
        'tipo',
        'orden',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function programasEstudio(): HasMany
    {
        return $this->hasMany(ProgramaEstudio::class);
    }

    public function cadenaOriginalReglas(): HasMany
    {
        return $this->hasMany(CadenaOriginalRegla::class);
    }

    public function xmlPlantillas(): HasMany
    {
        return $this->hasMany(XmlPlantilla::class);
    }

    public function firmaConfiguraciones(): HasMany
    {
        return $this->hasMany(FirmaConfiguracion::class);
    }

    public function plantillasDocumentos(): HasMany
    {
        return $this->hasMany(PlantillaDocumento::class);
    }
}

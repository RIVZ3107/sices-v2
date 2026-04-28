<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Institucion extends Model
{
    use SoftDeletes;

    protected $table = 'instituciones';

    protected $fillable = [
        'subsistema_id',
        'region_id',
        'clave',
        'nombre',
        'nombre_corto',
        'rvoe',
        'email_contacto',
        'telefono_contacto',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function sedes(): HasMany
    {
        return $this->hasMany(Sede::class);
    }

    public function ofertasAcademicas(): HasMany
    {
        return $this->hasMany(OfertaAcademica::class);
    }

    public function documentosAcademicos(): HasMany
    {
        return $this->hasMany(DocumentoAcademico::class);
    }

    public function firmantesAutorizados(): HasMany
    {
        return $this->hasMany(FirmanteAutorizado::class);
    }

    public function firmaConfiguraciones(): HasMany
    {
        return $this->hasMany(FirmaConfiguracion::class);
    }

    public function plantillasDocumentos(): HasMany
    {
        return $this->hasMany(PlantillaDocumento::class);
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'usuario_instituciones')
            ->withPivot('metadata')
            ->withTimestamps();
    }
}

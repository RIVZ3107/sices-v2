<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BajaCambioSolicitud extends Model
{
    protected $table = 'bajas_cambios_solicitudes';

    protected $fillable = [
        'folio',
        'alumno_id',
        'matricula_id',
        'ciclo_escolar_id',
        'periodo_escolar_id',
        'institucion_id',
        'sede_id',
        'tipo_cambio',
        'motivo',
        'descripcion',
        'estatus',
        'etapa',
        'prioridad',
        'fecha_efectiva',
        'fecha_inicio',
        'fecha_fin',
        'grupo_origen_id',
        'grupo_destino_id',
        'turno_origen',
        'turno_destino',
        'oferta_origen_id',
        'oferta_destino_id',
        'inscripcion_periodo_id',
        'dictamen',
        'clasificacion_rechazo',
        'documentacion_completa',
        'impacto_academico_alto',
        'fecha_vencimiento',
        'responsable_id',
        'solicitado_por',
        'aplicado_at',
        'metadata',
    ];

    protected $casts = [
        'fecha_efectiva' => 'date',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_vencimiento' => 'datetime',
        'aplicado_at' => 'datetime',
        'documentacion_completa' => 'boolean',
        'impacto_academico_alto' => 'boolean',
        'metadata' => 'array',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    public function cicloEscolar(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class);
    }

    public function grupoOrigen(): BelongsTo
    {
        return $this->belongsTo(Grupo::class, 'grupo_origen_id');
    }

    public function grupoDestino(): BelongsTo
    {
        return $this->belongsTo(Grupo::class, 'grupo_destino_id');
    }

    public function ofertaOrigen(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class, 'oferta_origen_id');
    }

    public function ofertaDestino(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class, 'oferta_destino_id');
    }

    public function inscripcionPeriodo(): BelongsTo
    {
        return $this->belongsTo(InscripcionPeriodo::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitado_por');
    }

    public function historiales(): HasMany
    {
        return $this->hasMany(BajaCambioHistorial::class, 'solicitud_id');
    }
}

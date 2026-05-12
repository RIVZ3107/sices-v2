<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudMatricula extends Model
{
    public const ESTADO_BORRADOR = 'borrador';

    public const ESTADO_ENVIADA = 'enviada';

    public const ESTADO_EN_REVISION = 'en_revision';

    public const ESTADO_CON_OBSERVACIONES = 'con_observaciones';

    public const ESTADO_APROBADA = 'aprobada';

    public const ESTADO_MATRICULA_ASIGNADA = 'matricula_asignada';

    public const ESTADO_RECHAZADA = 'rechazada';

    public const ESTADO_CANCELADA = 'cancelada';

    protected $table = 'solicitudes_matricula';

    protected $fillable = [
        'alumno_id',
        'subsistema_id',
        'institucion_id',
        'sede_id',
        'oferta_academica_id',
        'programa_estudio_id',
        'plan_estudio_id',
        'ciclo_ingreso_id',
        'estado',
        'solicitada_por',
        'revisada_por',
        'aprobada_por',
        'matricula_id',
        'observaciones',
        'motivo_rechazo',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function subsistema(): BelongsTo
    {
        return $this->belongsTo(Subsistema::class);
    }

    public function institucion(): BelongsTo
    {
        return $this->belongsTo(Institucion::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function ofertaAcademica(): BelongsTo
    {
        return $this->belongsTo(OfertaAcademica::class);
    }

    public function programaEstudio(): BelongsTo
    {
        return $this->belongsTo(ProgramaEstudio::class);
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class);
    }

    public function cicloIngreso(): BelongsTo
    {
        return $this->belongsTo(CicloEscolar::class, 'ciclo_ingreso_id');
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitada_por');
    }

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revisada_por');
    }

    public function aprobador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobada_por');
    }

    public function matricula(): BelongsTo
    {
        return $this->belongsTo(Matricula::class);
    }

    /**
     * @return list<string>
     */
    public static function estadosFinales(): array
    {
        return [self::ESTADO_MATRICULA_ASIGNADA, self::ESTADO_RECHAZADA, self::ESTADO_CANCELADA];
    }

    /**
     * @return list<string>
     */
    public static function estadosAbiertos(): array
    {
        return [
            self::ESTADO_BORRADOR,
            self::ESTADO_ENVIADA,
            self::ESTADO_EN_REVISION,
            self::ESTADO_CON_OBSERVACIONES,
            self::ESTADO_APROBADA,
        ];
    }
}

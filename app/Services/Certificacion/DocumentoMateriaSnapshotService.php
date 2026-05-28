<?php



declare(strict_types=1);



namespace App\Services\Certificacion;



use App\Enums\Certificacion\EstadoCadena;

use App\Enums\Certificacion\EstadoFirma;

use App\Enums\Certificacion\EstadoXml;

use App\Models\DocumentoAcademico;

use App\Models\DocumentoMateriaSnapshot;

use App\Models\MateriaCursada;

use App\Models\User;

use App\Support\Certificacion\PeriodoCurricularDecMapper;

use App\Support\SicesAuth;

use Illuminate\Support\Facades\DB;

use Illuminate\Validation\ValidationException;



class DocumentoMateriaSnapshotService

{

    public function __construct(

        protected AuditoriaService $auditoria,

    ) {}



    /**

     * @return array{total:int, created:bool}

     */

    public function generarSiNoExiste(DocumentoAcademico $documento, ?int $actorId = null): array

    {

        $documento->loadMissing('materiasSnapshot');

        if ($documento->materiasSnapshot->isNotEmpty()) {

            return ['total' => $documento->materiasSnapshot->count(), 'created' => false];

        }



        return $this->forzarRegeneracion($documento, $actorId);

    }



    /**

     * @return array{total:int, created:bool}

     */

    public function forzarRegeneracion(

        DocumentoAcademico $documento,

        ?int $actorId = null,

        bool $reprocesoExplicito = false,

        ?string $motivoReproceso = null,

    ): array {

        if ($documento->matricula_id === null) {

            throw ValidationException::withMessages([

                'matricula_id' => ['El documento no tiene matrícula asociada para generar snapshot de materias.'],

            ]);

        }



        $this->assertRegeneracionPermitida($documento, $actorId, $reprocesoExplicito, $motivoReproceso);



        $materias = MateriaCursada::query()

            ->where('matricula_id', $documento->matricula_id)

            ->with('planMateria')

            ->orderBy('tipo_periodo_curricular')

            ->orderBy('numero_periodo_curricular')

            ->orderBy('semestre')

            ->orderBy('clave')

            ->orderBy('id')

            ->get();



        if ($materias->isEmpty()) {

            throw ValidationException::withMessages([

                'materias' => ['No se puede generar snapshot: la matrícula no tiene materias cursadas.'],

            ]);

        }



        $total = DB::transaction(function () use ($documento, $materias, $actorId): int {

            DocumentoMateriaSnapshot::query()

                ->where('documento_academico_id', $documento->id)

                ->delete();



            $nextOrden = 1;

            $ordenesUsados = [];



            foreach ($materias as $materia) {

                $semestreDec = PeriodoCurricularDecMapper::semestreDecParaMateriaCursada($materia);

                if ($semestreDec === null) {

                    throw ValidationException::withMessages([

                        'materias' => [

                            'No hay mapeo DEC claro (atributo semestre XML) para la materia cursada '.$materia->clave

                            .'; corrija `semestre` / plan o revisión institucional sin inferencias automáticas.',

                        ],

                    ]);

                }



                $tipoInt = PeriodoCurricularDecMapper::normalizarTipo($materia->tipo_periodo_curricular ?? 'semestre');

                $ordenAsignado = $this->resolverOrdenSnapshot($materia->orden, $nextOrden, $ordenesUsados);

                $nextOrden = max($nextOrden, $ordenAsignado + 1);



                DocumentoMateriaSnapshot::query()->create([

                    'documento_academico_id' => $documento->id,

                    'materia_cursada_id' => $materia->id,

                    'clave' => $materia->clave,

                    'nombre' => $materia->nombre,

                    'calificacion_final' => $materia->calificacion_final ?? $materia->calificacion,

                    'tipo_periodo_curricular' => $tipoInt,

                    'numero_periodo_curricular' => $materia->numero_periodo_curricular,

                    'etiqueta_periodo_curricular' => $materia->etiqueta_periodo_curricular,

                    'semestre' => $semestreDec,

                    'periodo' => $materia->periodo,

                    'creditos' => $materia->creditos,

                    'orden' => $ordenAsignado,

                    'metadata' => [

                        'estado_materia' => $materia->estado,

                        'calificacion_texto' => $materia->calificacion_texto,

                        'congelacion' => [

                            'semestre_dec_xml' => $semestreDec,

                            'periodo_cursado' => $materia->periodo,

                            'tipo_periodo_curricular' => $tipoInt,

                            'numero_periodo_curricular' => $materia->numero_periodo_curricular,

                            'generado_en' => now()->toIso8601String(),

                        ],

                    ],

                ]);

            }



            $count = DocumentoMateriaSnapshot::query()

                ->where('documento_academico_id', $documento->id)

                ->count();



            $this->auditoria->registrar(

                'documento_materias_snapshot.generado',

                DocumentoAcademico::class,

                $documento->id,

                ['total_materias' => $count],

                $actorId,

            );



            return $count;

        });



        return ['total' => $total, 'created' => true];

    }



    protected function assertRegeneracionPermitida(

        DocumentoAcademico $documento,

        ?int $actorId,

        bool $reprocesoExplicito,

        ?string $motivoReproceso,

    ): void {

        if (! $this->documentoSnapshotCongelado($documento)) {

            return;

        }



        $motivo = trim((string) $motivoReproceso);

        if (! $reprocesoExplicito || $motivo === '') {

            throw ValidationException::withMessages([

                'snapshot' => ['El documento ya tiene artefactos técnicos o firma; requiere reproceso explícito con motivo auditado.'],

            ]);

        }



        $usuario = $actorId !== null ? User::query()->find($actorId) : null;

        if ($usuario === null || ! SicesAuth::canAny(

            $usuario,

            'firma.reintentar',

            'cadena_original.generar',

            'xml.generar',

            'generar_cadena',

            'generar_xml',

        )) {

            throw ValidationException::withMessages([

                'snapshot' => ['No tiene permiso técnico para reprocesar el snapshot de materias.'],

            ]);

        }



        $this->auditoria->registrar(

            'documento_materias_snapshot.reproceso',

            DocumentoAcademico::class,

            $documento->id,

            [

                'motivo' => $motivo,

                'estado_firma' => $documento->estado_firma,

                'estado_cadena' => $documento->estado_cadena,

                'estado_xml' => $documento->estado_xml,

            ],

            $actorId,

        );

    }



    protected function documentoSnapshotCongelado(DocumentoAcademico $documento): bool

    {

        if (in_array($documento->estado_firma, [

            EstadoFirma::FIRMADO->value,

            EstadoFirma::FIRMANDO->value,

        ], true)) {

            return true;

        }



        if ($documento->estado_cadena === EstadoCadena::GENERADA->value) {

            return true;

        }



        return in_array($documento->estado_xml, [

            EstadoXml::GENERADO->value,

            EstadoXml::VALIDADO->value,

            EstadoXml::SELLADO->value,

            EstadoXml::TIMBRADO->value,

        ], true);

    }



    /**

     * @param  array<int, true>  $ordenesUsados

     */

    protected function resolverOrdenSnapshot(mixed $ordenFuente, int $nextOrden, array &$ordenesUsados): int

    {

        $candidato = is_numeric($ordenFuente) && (int) $ordenFuente > 0

            ? (int) $ordenFuente

            : $nextOrden;



        while (isset($ordenesUsados[$candidato])) {

            $candidato++;

        }



        $ordenesUsados[$candidato] = true;



        return $candidato;

    }

}


<?php

declare(strict_types=1);

namespace App\Infrastructure\ControlEscolar;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Data\ControlEscolar\ControlEscolarAlumnoData;
use App\Data\ControlEscolar\ControlEscolarCertificacionData;
use App\Data\ControlEscolar\ControlEscolarMateriaData;
use App\Data\ControlEscolar\ControlEscolarTrayectoriaData;
use App\Exceptions\ControlEscolar\ControlEscolarNotEnabledException;
use App\Exceptions\ControlEscolar\ControlEscolarQueryNotConfiguredException;
use Illuminate\Support\Facades\DB;
use Throwable;

class DatabaseControlEscolarSourceAdapter implements ControlEscolarSourceAdapterInterface
{
    public function buscarAlumnoPorCurp(string $curp): ?ControlEscolarAlumnoData
    {
        $this->assertEnabled();

        $row = $this->queryAlumnoPorCurp($curp);

        return $row === null ? null : $this->mapAlumnoRow($row);
    }

    public function buscarAlumnoPorMatricula(string $matricula): ?ControlEscolarAlumnoData
    {
        $this->assertEnabled();

        $row = $this->queryAlumnoPorMatricula($matricula);

        return $row === null ? null : $this->mapAlumnoRow($row);
    }

    public function obtenerMateriasPorMatricula(string $matricula): array
    {
        $this->assertEnabled();

        return array_map(
            fn (object $row): ControlEscolarMateriaData => $this->mapMateriaRow($row),
            $this->queryMateriasPorMatricula($matricula),
        );
    }

    public function obtenerTrayectoriaPorMatricula(string $matricula): ?ControlEscolarTrayectoriaData
    {
        $this->assertEnabled();

        $row = $this->queryTrayectoriaPorMatricula($matricula);

        return $row === null ? null : $this->mapTrayectoriaRow($row);
    }

    public function obtenerDatosCertificacion(string $matricula): ?ControlEscolarCertificacionData
    {
        $this->assertEnabled();

        $row = $this->queryDatosCertificacion($matricula);

        return $row === null ? null : $this->mapCertificacionRow($row);
    }

    public function health(): array
    {
        if (! config('control_escolar.enabled')) {
            return [
                'ok' => false,
                'message' => 'Integración Control Escolar deshabilitada (CONTROL_ESCOLAR_ENABLED=false).',
            ];
        }

        try {
            $this->connection()->select('SELECT 1 AS ok');

            return [
                'ok' => true,
                'message' => 'Conexión Control Escolar operativa.',
                'driver' => (string) config('control_escolar.driver'),
            ];
        } catch (Throwable $e) {
            return [
                'ok' => false,
                'message' => 'Error de conexión Control Escolar: '.$e->getMessage(),
                'driver' => (string) config('control_escolar.driver'),
            ];
        }
    }

    protected function assertEnabled(): void
    {
        if (! config('control_escolar.enabled')) {
            throw new ControlEscolarNotEnabledException(
                'La integración con Control Escolar está deshabilitada. Active CONTROL_ESCOLAR_ENABLED y configure la conexión.',
            );
        }
    }

    /**
     * @return object|null
     */
    protected function queryAlumnoPorCurp(string $curp): ?object
    {
        throw new ControlEscolarQueryNotConfiguredException(
            'TODO: mapear queryAlumnoPorCurp() a tablas/columnas reales de Control Escolar (alumnos, matrícula, sede/CCT, carrera, plan).',
        );
    }

    /**
     * @return object|null
     */
    protected function queryAlumnoPorMatricula(string $matricula): ?object
    {
        throw new ControlEscolarQueryNotConfiguredException(
            'TODO: mapear queryAlumnoPorMatricula() a tablas/columnas reales de Control Escolar.',
        );
    }

    /**
     * @return list<object>
     */
    protected function queryMateriasPorMatricula(string $matricula): array
    {
        throw new ControlEscolarQueryNotConfiguredException(
            'TODO: mapear queryMateriasPorMatricula() (clave, calificación, periodo, semestre) sin defaults peligrosos.',
        );
    }

    /**
     * @return object|null
     */
    protected function queryTrayectoriaPorMatricula(string $matricula): ?object
    {
        throw new ControlEscolarQueryNotConfiguredException(
            'TODO: mapear queryTrayectoriaPorMatricula() (promedio, créditos, totales).',
        );
    }

    /**
     * @return object|null
     */
    protected function queryDatosCertificacion(string $matricula): ?object
    {
        throw new ControlEscolarQueryNotConfiguredException(
            'TODO: mapear queryDatosCertificacion() (tipo certificado, modalidad, egreso).',
        );
    }

    protected function connection(): \Illuminate\Database\Connection
    {
        return DB::connection((string) config('control_escolar.connection'));
    }

    /**
     * @param  object|array<string, mixed>  $row
     */
    protected function mapAlumnoRow(object|array $row): ControlEscolarAlumnoData
    {
        $r = (array) $row;

        return new ControlEscolarAlumnoData(
            curp: $this->normalizeString($r['curp'] ?? ''),
            nombre: $this->normalizeString($r['nombre'] ?? ''),
            primerApellido: $this->normalizeString($r['primer_apellido'] ?? $r['paterno'] ?? ''),
            segundoApellido: $this->nullableString($r['segundo_apellido'] ?? $r['materno'] ?? null),
            matricula: $this->nullableString($r['matricula'] ?? null),
            rfc: $this->nullableString($r['rfc'] ?? null),
            fechaNacimiento: $this->nullableString($r['fecha_nacimiento'] ?? null),
            genero: $this->nullableString($r['genero'] ?? null),
            institucionClave: isset($r['institucion_id']) ? (int) $r['institucion_id'] : null,
            institucionNombre: $this->nullableString($r['institucion_nombre'] ?? null),
            sedeCct: $this->nullableString($r['sede_cct'] ?? $r['cct'] ?? null),
            sedeNombre: $this->nullableString($r['sede_nombre'] ?? null),
            programaClave: $this->nullableString($r['programa_clave'] ?? null),
            programaNombre: $this->nullableString($r['programa_nombre'] ?? null),
            planClave: $this->nullableString($r['plan_clave'] ?? null),
            planNombre: $this->nullableString($r['plan_nombre'] ?? null),
            cicloClave: $this->nullableString($r['ciclo_clave'] ?? null),
            modalidad: $this->nullableString($r['modalidad'] ?? null),
            raw: $r,
        );
    }

    /**
     * @param  object|array<string, mixed>  $row
     */
    protected function mapMateriaRow(object|array $row): ControlEscolarMateriaData
    {
        $r = (array) $row;

        return new ControlEscolarMateriaData(
            clave: $this->normalizeString($r['clave'] ?? ''),
            nombre: $this->normalizeString($r['nombre'] ?? ''),
            calificacion: $this->nullableString($r['calificacion'] ?? null),
            periodo: $this->nullableString($r['periodo'] ?? null),
            semestre: isset($r['semestre']) && $r['semestre'] !== '' && $r['semestre'] !== null
                ? (int) $r['semestre']
                : null,
            tipoPeriodoCurricular: $this->nullableString($r['tipo_periodo_curricular'] ?? null),
            numeroPeriodoCurricular: isset($r['numero_periodo_curricular']) && $r['numero_periodo_curricular'] !== ''
                ? (int) $r['numero_periodo_curricular']
                : null,
            creditos: isset($r['creditos']) ? (float) $r['creditos'] : null,
            estatusAcreditacion: $this->nullableString($r['estatus_acreditacion'] ?? null),
            raw: $r,
        );
    }

    /**
     * @param  object|array<string, mixed>  $row
     */
    protected function mapTrayectoriaRow(object|array $row): ControlEscolarTrayectoriaData
    {
        $r = (array) $row;

        return new ControlEscolarTrayectoriaData(
            promedioGeneral: isset($r['promedio_general']) ? (float) $r['promedio_general'] : null,
            creditosAcumulados: isset($r['creditos_acumulados']) ? (float) $r['creditos_acumulados'] : null,
            totalMaterias: isset($r['total_materias']) ? (int) $r['total_materias'] : null,
            materiasAcreditadas: isset($r['materias_acreditadas']) ? (int) $r['materias_acreditadas'] : null,
            estatusTrayectoria: $this->nullableString($r['estatus_trayectoria'] ?? null),
            raw: $r,
        );
    }

    /**
     * @param  object|array<string, mixed>  $row
     */
    protected function mapCertificacionRow(object|array $row): ControlEscolarCertificacionData
    {
        $r = (array) $row;

        return new ControlEscolarCertificacionData(
            matricula: $this->normalizeString($r['matricula'] ?? ''),
            tipoCertificado: $this->nullableString($r['tipo_certificado'] ?? null),
            tipoCertificacion: $this->nullableString($r['tipo_certificacion'] ?? null),
            fechaEgreso: $this->nullableString($r['fecha_egreso'] ?? null),
            promedio: isset($r['promedio']) ? (float) $r['promedio'] : null,
            creditos: isset($r['creditos']) ? (float) $r['creditos'] : null,
            totalAsignaturas: isset($r['total_asignaturas']) ? (int) $r['total_asignaturas'] : null,
            modalidad: $this->nullableString($r['modalidad'] ?? null),
            sedeCct: $this->nullableString($r['sede_cct'] ?? $r['cct'] ?? null),
            raw: $r,
        );
    }

    protected function normalizeString(mixed $value): string
    {
        $s = trim((string) $value);
        $encoding = (string) config('control_escolar.encoding', 'UTF-8');

        if ($encoding !== 'UTF-8' && $s !== '') {
            $converted = @mb_convert_encoding($s, 'UTF-8', $encoding);

            return is_string($converted) ? $converted : $s;
        }

        return $s;
    }

    protected function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $this->normalizeString($value);
    }
}

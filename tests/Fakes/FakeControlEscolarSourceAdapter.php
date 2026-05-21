<?php

declare(strict_types=1);

namespace Tests\Fakes;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Data\ControlEscolar\ControlEscolarAlumnoData;
use App\Data\ControlEscolar\ControlEscolarCertificacionData;
use App\Data\ControlEscolar\ControlEscolarMateriaData;
use App\Data\ControlEscolar\ControlEscolarTrayectoriaData;

class FakeControlEscolarSourceAdapter implements ControlEscolarSourceAdapterInterface
{
    public static string $curp = 'AAAA000000HDFXXX01';

    public static string $matricula = 'MAT-CE-001';

    public function buscarAlumnoPorCurp(string $curp): ?ControlEscolarAlumnoData
    {
        return $curp === self::$curp ? $this->alumnoBase() : null;
    }

    public function buscarAlumnoPorMatricula(string $matricula): ?ControlEscolarAlumnoData
    {
        return $matricula === self::$matricula ? $this->alumnoBase() : null;
    }

    public function obtenerMateriasPorMatricula(string $matricula): array
    {
        if ($matricula !== self::$matricula) {
            return [];
        }

        return [
            new ControlEscolarMateriaData(
                clave: 'MAT101',
                nombre: 'Didáctica',
                calificacion: '9.0',
                periodo: '2024-1',
                semestre: 1,
                tipoPeriodoCurricular: 'semestre',
                numeroPeriodoCurricular: 1,
                creditos: 8.0,
                estatusAcreditacion: 'acreditada',
            ),
            new ControlEscolarMateriaData(
                clave: 'MAT102',
                nombre: 'Práctica',
                calificacion: '8.5',
                periodo: '2024-2',
                semestre: 2,
                tipoPeriodoCurricular: 'semestre',
                numeroPeriodoCurricular: 2,
                creditos: 6.0,
                estatusAcreditacion: 'acreditada',
            ),
        ];
    }

    public function obtenerTrayectoriaPorMatricula(string $matricula): ?ControlEscolarTrayectoriaData
    {
        if ($matricula !== self::$matricula) {
            return null;
        }

        return new ControlEscolarTrayectoriaData(
            promedioGeneral: 8.75,
            creditosAcumulados: 14.0,
            totalMaterias: 2,
            materiasAcreditadas: 2,
            estatusTrayectoria: 'egresado',
        );
    }

    public function obtenerDatosCertificacion(string $matricula): ?ControlEscolarCertificacionData
    {
        if ($matricula !== self::$matricula) {
            return null;
        }

        return new ControlEscolarCertificacionData(
            matricula: $matricula,
            tipoCertificado: 'certificado',
            tipoCertificacion: 'total',
            promedio: 8.75,
            creditos: 14.0,
            totalAsignaturas: 2,
            sedeCct: '12DPR0001A',
        );
    }

    public function health(): array
    {
        return ['ok' => true, 'message' => 'Fake Control Escolar.'];
    }

    protected function alumnoBase(): ControlEscolarAlumnoData
    {
        return new ControlEscolarAlumnoData(
            curp: self::$curp,
            nombre: 'Juan',
            primerApellido: 'Pérez',
            segundoApellido: 'López',
            matricula: self::$matricula,
            sedeCct: '12DPR0001A',
        );
    }
}

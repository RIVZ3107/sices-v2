<?php

declare(strict_types=1);

namespace App\Support\Certificacion;

use Illuminate\Support\Str;

/**
 * Extrae campos útiles de un XML DEC/SEP para vista PDF (sin validar XSD aquí).
 */
final class CertificadoXmlParser
{
    /**
     * @return array<string, mixed>
     */
    public function parse(string $xml): array
    {
        $xml = trim($xml);
        if ($xml === '') {
            return [];
        }

        $prev = libxml_use_internal_errors(true);
        try {
            $doc = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOCDATA);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($prev);
        }

        if ($doc === false) {
            return ['_parse_error' => 'XML no legible'];
        }

        $namespaces = $doc->getNamespaces(true);
        $dec = $doc;
        foreach ($namespaces as $ns) {
            if (str_contains(strtolower($ns), 'dec') || str_contains(strtolower((string) $ns), 'sep')) {
                $children = $doc->children($ns);
                if ($children->count() > 0) {
                    $dec = $children;
                    break;
                }
            }
        }

        return array_filter([
            'folio_digital' => $this->texto($dec, ['FolioDigital', 'folioDigital', 'folio_digital']),
            'curp' => $this->texto($dec, ['Curp', 'curp', 'CURP']),
            'nombre' => $this->texto($dec, ['Nombre', 'nombre']),
            'primer_apellido' => $this->texto($dec, ['PrimerApellido', 'primer_apellido']),
            'segundo_apellido' => $this->texto($dec, ['SegundoApellido', 'segundo_apellido']),
            'institucion' => $this->texto($dec, ['NombreInstitucion', 'Institucion', 'institucion']),
            'carrera' => $this->texto($dec, ['NombreCarrera', 'Carrera', 'carrera']),
            'plan_estudios' => $this->texto($dec, ['PlanEstudios', 'plan_estudios']),
            'tipo_certificado' => $this->texto($dec, ['TipoCertificado', 'tipo_certificado']),
            'materias' => $this->materias($dec),
        ], fn ($v) => $v !== null && $v !== [] && $v !== '');
    }

    /**
     * @param  list<string>  $nombres
     */
    private function texto(\SimpleXMLElement $node, array $nombres): ?string
    {
        foreach ($nombres as $nombre) {
            if (isset($node->{$nombre})) {
                $t = trim((string) $node->{$nombre});

                return $t !== '' ? $t : null;
            }
        }

        foreach ($node->children() as $child) {
            $local = $child->getName();
            if (in_array($local, $nombres, true) || Str::lower($local) === Str::lower($nombres[0] ?? '')) {
                $t = trim((string) $child);

                return $t !== '' ? $t : null;
            }
        }

        return null;
    }

    /**
     * @return list<array{clave: ?string, nombre: ?string, calificacion: ?string, semestre: ?string}>
     */
    private function materias(\SimpleXMLElement $node): array
    {
        $items = [];
        $candidatos = ['Materia', 'materia', 'Asignatura', 'asignatura'];

        foreach ($candidatos as $tag) {
            if (! isset($node->{$tag})) {
                continue;
            }
            foreach ($node->{$tag} as $materia) {
                $items[] = array_filter([
                    'clave' => $this->texto($materia, ['Clave', 'clave']),
                    'nombre' => $this->texto($materia, ['Nombre', 'nombre']),
                    'calificacion' => $this->texto($materia, ['Calificacion', 'calificacion', 'CalificacionUAC']),
                    'semestre' => $this->texto($materia, ['Semestre', 'semestre']),
                ]);
            }
        }

        return $items;
    }
}

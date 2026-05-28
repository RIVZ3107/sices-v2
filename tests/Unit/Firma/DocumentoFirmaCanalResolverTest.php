<?php

declare(strict_types=1);

namespace Tests\Unit\Firma;

use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;
use App\Models\Subsistema;
use App\Services\Firma\DocumentoFirmaCanalResolver;
use Tests\TestCase;

class DocumentoFirmaCanalResolverTest extends TestCase
{
    private DocumentoFirmaCanalResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new DocumentoFirmaCanalResolver;
    }

    public function test_resuelve_normal_certificado(): void
    {
        $doc = $this->documento('NORMAL', 'certificado');

        $this->assertSame(
            CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP,
            $this->resolver->resolver($doc),
        );
    }

    public function test_resuelve_upn_antes_que_tipo(): void
    {
        $doc = $this->documento('UPN', 'certificado');

        $this->assertSame(
            CanalFirmaDocumento::UPN_FIRMA_LOCAL,
            $this->resolver->resolver($doc),
        );
    }

    public function test_resuelve_titulo_y_grado(): void
    {
        $this->assertSame(
            CanalFirmaDocumento::TITULO_SEP,
            $this->resolver->resolver($this->documento('NORMAL', 'titulo')),
        );
        $this->assertSame(
            CanalFirmaDocumento::GRADO_SEP,
            $this->resolver->resolver($this->documento('NORMAL', 'grado')),
        );
    }

    private function documento(string $subsistemaClave, string $tipo): DocumentoAcademico
    {
        $doc = new DocumentoAcademico([
            'tipo_documento' => $tipo,
        ]);
        $doc->setRelation('subsistema', new Subsistema(['clave' => $subsistemaClave]));

        return $doc;
    }
}

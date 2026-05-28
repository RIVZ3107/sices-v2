<?php

declare(strict_types=1);

namespace Tests\Unit\SicesLegacy;

use App\Infrastructure\SicesLegacy\InformixSicesLegacyCertificadoRepository;
use ReflectionClass;
use Tests\TestCase;

class InformixSicesLegacyCertificadoRepositoryReadOnlyTest extends TestCase
{
    public function test_repositorio_no_contiene_operaciones_de_escritura(): void
    {
        $ref = new ReflectionClass(InformixSicesLegacyCertificadoRepository::class);
        $source = file_get_contents($ref->getFileName()) ?: '';

        $this->assertStringNotContainsString('->insert(', $source);
        $this->assertStringNotContainsString('->update(', $source);
        $this->assertStringNotContainsString('->delete(', $source);
        $this->assertStringNotContainsString('->upsert(', $source);
        $this->assertStringNotContainsString('DB::statement(', $source);
        $this->assertStringContainsString('No ejecuta INSERT/UPDATE/DELETE', $source);
    }
}

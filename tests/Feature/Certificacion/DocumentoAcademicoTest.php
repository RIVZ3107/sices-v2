<?php

namespace Tests\Feature\Certificacion;

use Tests\TestCase;

class DocumentoAcademicoTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_example(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}

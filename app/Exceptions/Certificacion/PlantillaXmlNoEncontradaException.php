<?php

declare(strict_types=1);

namespace App\Exceptions\Certificacion;

use RuntimeException;

/**
 * Opcional: uso cuando una operación exige plantilla SEP concreta y no existe coincidencia.
 */
class PlantillaXmlNoEncontradaException extends RuntimeException {}

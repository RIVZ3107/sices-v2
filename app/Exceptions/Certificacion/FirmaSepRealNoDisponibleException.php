<?php

declare(strict_types=1);

namespace App\Exceptions\Certificacion;

use RuntimeException;

/**
 * Lanzada cuando la configuración pide firma real (SEP/since-service) pero aún no hay cliente HTTP integrado.
 */
class FirmaSepRealNoDisponibleException extends RuntimeException {}

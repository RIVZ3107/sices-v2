<?php

declare(strict_types=1);

namespace App\Exceptions\Legacy;

use RuntimeException;

class SicesLegacyConnectionException extends RuntimeException
{
    public function __construct(
        string $message = 'No se pudo conectar a SICES legacy (Informix).',
        public readonly ?string $connection = null,
    ) {
        parent::__construct($message);
    }
}

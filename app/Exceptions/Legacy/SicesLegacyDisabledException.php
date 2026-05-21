<?php

declare(strict_types=1);

namespace App\Exceptions\Legacy;

use RuntimeException;

class SicesLegacyDisabledException extends RuntimeException
{
    public function __construct(string $message = 'SICES legacy deshabilitado (SICES_LEGACY_ENABLED=false).')
    {
        parent::__construct($message);
    }
}

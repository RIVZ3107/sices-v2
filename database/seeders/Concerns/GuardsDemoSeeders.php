<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

trait GuardsDemoSeeders
{
    public static function demoSeedersAllowed(): bool
    {
        return filter_var(env('ALLOW_DEMO_SEEDERS', false), FILTER_VALIDATE_BOOL);
    }

    protected function ensureDemoSeedersAllowed(): void
    {
        if (! self::demoSeedersAllowed()) {
            throw new \RuntimeException(
                'Los seeders demo están deshabilitados. Active ALLOW_DEMO_SEEDERS=true solo en local/testing.',
            );
        }
    }
}

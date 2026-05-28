<?php

declare(strict_types=1);

namespace Tests\Support;

/**
 * Rutas estáticas registradas en resources/js/router.jsx (prefijo /app).
 */
final class SpaRouteRegistry
{
    /** @return list<string> */
    public static function staticAppPaths(): array
    {
        $content = (string) file_get_contents(base_path('resources/js/router.jsx'));

        $paths = [];

        if (preg_match_all("/path:\s*'([^']+)'/", $content, $matches)) {
            foreach ($matches[1] as $segment) {
                $paths[] = self::toAppPath($segment);
            }
        }

        if (preg_match_all('/to="(\/app\/[^"]+)"/', $content, $navMatches)) {
            foreach ($navMatches[1] as $target) {
                $paths[] = self::normalizePath($target);
            }
        }

        $paths[] = '/app';
        $paths[] = '/app/dashboard';
        $paths[] = '/app/educacion-superior/upn/certificacion';
        $paths[] = '/app/educacion-superior/revision';

        return array_values(array_unique($paths));
    }

    public static function toAppPath(string $segment): string
    {
        $segment = trim($segment, '/');

        return $segment === '' ? '/app' : '/app/'.$segment;
    }

    public static function normalizePath(string $route): string
    {
        $path = parse_url($route, PHP_URL_PATH);

        if (! is_string($path) || $path === '') {
            return '/';
        }

        $path = rtrim($path, '/');

        return $path === '' ? '/' : $path;
    }

    public static function pathMatchesRegistry(string $menuRoute, array $registry): bool
    {
        if ($menuRoute === '#' || $menuRoute === '') {
            return true;
        }

        $path = self::normalizePath($menuRoute);

        if (in_array($path, $registry, true)) {
            return true;
        }

        // Rutas con parámetro dinámico en router (:id) no deben aparecer en menús estáticos.
        foreach ($registry as $registered) {
            if (str_contains($registered, ':')) {
                continue;
            }
            if (str_starts_with($path, $registered.'/')) {
                return true;
            }
        }

        return false;
    }
}

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
            $stack = [];
            $lines = explode("\n", $content);
            foreach ($lines as $line) {
                if (preg_match("/path:\s*'([^']+)'/", $line, $m)) {
                    $segment = $m[1];
                    if ($segment === '*' || str_contains($segment, ':')) {
                        continue;
                    }
                    $depth = (int) floor((strlen($line) - strlen(ltrim($line))) / 4);
                    $stack = array_slice($stack, 0, $depth);
                    $stack[$depth] = $segment;
                    $full = implode('/', array_filter($stack));
                    if ($full !== '') {
                        $paths[] = self::toAppPath($full);
                    }
                }
            }
        }

        if (preg_match_all('/to="(\/app\/[^"]+)"/', $content, $navMatches)) {
            foreach ($navMatches[1] as $target) {
                $paths[] = self::normalizePath($target);
            }
        }

        if (preg_match_all('/to=\{([A-Z_]+)\}/', $content, $constMatches)) {
            foreach ($constMatches[1] as $const) {
                $paths = array_merge($paths, self::pathsFromRouteConstant($const));
            }
        }

        $paths[] = '/app';
        $paths[] = '/app/dashboard';
        $paths[] = '/app/educacion-superior/normales/certificacion';
        $paths[] = '/app/educacion-superior/upn/certificacion';
        $paths[] = '/app/educacion-superior/certificacion';
        $paths[] = '/app/educacion-superior/upn-certificacion';
        $paths[] = '/app/educacion-superior/revision';
        $paths[] = '/app/sistemas/documento-proceso-tecnico';
        $paths[] = '/app/sistemas/proceso-tecnico-certificacion';
        $paths[] = '/app/certificacion/dashboard';

        return array_values(array_unique($paths));
    }

    /** @return list<string> */
    private static function pathsFromRouteConstant(string $const): array
    {
        $map = [
            'NORMALES_CERTIFICACION_PATH' => '/app/educacion-superior/normales/certificacion',
            'UPN_CERTIFICACION_PATH' => '/app/educacion-superior/upn/certificacion',
            'ES_CERTIFICACION_LEGACY_PATH' => '/app/educacion-superior/certificacion',
            'UPN_CERTIFICACION_LEGACY_PATH' => '/app/educacion-superior/upn-certificacion',
            'PROCESO_TECNICO_BANDEJA_PATH' => '/app/sistemas/proceso-tecnico-certificacion',
            'DOCUMENTO_PROCESO_TECNICO_PATH' => '/app/sistemas/documento-proceso-tecnico',
        ];

        return isset($map[$const]) ? [$map[$const]] : [];
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

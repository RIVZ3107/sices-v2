<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autoriza si el usuario autenticado tiene al menos uno de los permisos listados (separados por |).
 */
final class PermissionOrMiddleware
{
    public function handle(Request $request, Closure $next, string $permissionList): Response
    {
        $user = $request->user();
        if ($user === null) {
            abort(Response::HTTP_FORBIDDEN);
        }

        foreach (explode('|', $permissionList) as $raw) {
            $permission = trim($raw);
            if ($permission !== '' && $user->can($permission)) {
                return $next($request);
            }
        }

        abort(Response::HTTP_FORBIDDEN);
    }
}

<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;

final class SicesAuth
{
    /**
     * @param  list<string>  $abilities
     */
    public static function canAny(?Authenticatable $user, string ...$abilities): bool
    {
        if ($user === null || ! method_exists($user, 'can')) {
            return false;
        }

        foreach ($abilities as $ability) {
            if ($ability !== '' && $user->can($ability)) {
                return true;
            }
        }

        return false;
    }
}

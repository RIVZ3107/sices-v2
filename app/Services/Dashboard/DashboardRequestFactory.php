<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use Illuminate\Http\Request;

final class DashboardRequestFactory
{
    public function forUser(User $user): Request
    {
        return tap(Request::create('/api/v1/dashboard', 'GET'), static function (Request $r) use ($user): void {
            $r->setUserResolver(static fn (): User => $user);
        });
    }
}

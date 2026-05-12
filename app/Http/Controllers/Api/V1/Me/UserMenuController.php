<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Me;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Menus\UserMenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserMenuController extends Controller
{
    public function __construct(
        private readonly UserMenuService $userMenus,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('roles');

        return response()->json([
            'data' => $this->userMenus->menusTreeFor($user),
        ]);
    }
}

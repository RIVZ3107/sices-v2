<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMenuRequest;
use App\Http\Requests\Admin\UpdateMenuRequest;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class MenuAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $menus = Menu::query()
            ->with(['roles:id,name', 'extraPermissions:id,name'])
            ->orderBy('order')
            ->get();

        return response()->json(['data' => $menus]);
    }

    public function store(StoreMenuRequest $request): JsonResponse
    {
        $menu = Menu::query()->create($request->validatedPayload());

        return response()->json(['data' => $menu->fresh(['roles', 'extraPermissions'])], 201);
    }

    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $menu->update($request->validatedPayload());

        return response()->json(['data' => $menu->fresh(['roles', 'extraPermissions'])]);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $menu->delete();

        return response()->json(null, 204);
    }

    public function syncRoles(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'role_names' => ['required', 'array'],
            'role_names.*' => ['string', 'max:255'],
        ]);

        $ids = Role::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $data['role_names'])
            ->pluck('id');

        $menu->roles()->sync($ids->all());

        return response()->json(['data' => $menu->fresh(['roles', 'extraPermissions'])]);
    }

    public function syncPermissions(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'permission_names' => ['required', 'array'],
            'permission_names.*' => ['string', 'max:255'],
        ]);

        $ids = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $data['permission_names'])
            ->pluck('id');

        $menu->extraPermissions()->sync($ids->all());

        return response()->json(['data' => $menu->fresh(['roles', 'extraPermissions'])]);
    }
}

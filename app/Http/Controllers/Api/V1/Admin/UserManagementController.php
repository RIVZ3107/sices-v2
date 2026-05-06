<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Requests\Admin\UpdateAdminUserRequest;
use App\Http\Resources\Admin\UserAdminResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserManagementController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $query = User::query()
            ->with('roles')
            ->when(
                (string) request()->string('search') !== '',
                function ($builder): void {
                    $term = '%'.(string) request()->string('search').'%';
                    $builder->where(function ($nested) use ($term): void {
                        $nested->where('name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    });
                }
            )
            ->when(
                (string) request()->string('rol') !== '',
                fn ($builder) => $builder->role((string) request()->string('rol'))
            )
            ->orderBy('name');

        return UserAdminResource::collection(
            $query->paginate((int) request()->integer('per_page', 20))->withQueryString()
        );
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $payload = $request->validated();

        $user = User::query()->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => $payload['password'],
        ]);
        $user->syncRoles($payload['roles']);

        return (new UserAdminResource($user->fresh('roles')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateAdminUserRequest $request, User $user): UserAdminResource
    {
        $payload = $request->validated();

        $user->fill([
            'name' => $payload['name'] ?? $user->name,
            'email' => $payload['email'] ?? $user->email,
        ]);
        if (isset($payload['password']) && (string) $payload['password'] !== '') {
            $user->password = $payload['password'];
        }
        $user->save();

        if (array_key_exists('roles', $payload)) {
            $user->syncRoles($payload['roles']);
        }

        return new UserAdminResource($user->fresh('roles'));
    }
}

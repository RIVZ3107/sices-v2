<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son inválidas.'],
            ]);
        }

        $deviceName = $data['device_name'] ?? ($request->userAgent() ?: 'api-client');
        $token = $user->createToken((string) $deviceName)->plainTextToken;

        return response()->json([
            'data' => [
                'token_type' => 'Bearer',
                'access_token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $plainTextToken = $request->bearerToken();
        if ($user === null || $plainTextToken === null || trim($plainTextToken) === '') {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }
        $token = PersonalAccessToken::findToken($plainTextToken);
        if ($token === null || (int) $token->tokenable_id !== (int) $user->id) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $plainTextToken = $request->bearerToken();
        if ($plainTextToken !== null && trim($plainTextToken) !== '') {
            $token = PersonalAccessToken::findToken($plainTextToken);
            if ($token !== null) {
                $token->delete();
            }
        } elseif ($user !== null) {
            // Fallback: revoca todos los tokens si no se envía bearer token explícito.
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}

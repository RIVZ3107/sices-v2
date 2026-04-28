<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_me_logout_flow_with_sanctum_tokens(): void
    {
        $password = 'Secret123*';
        $user = User::factory()->create([
            'password' => $password,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => $password,
            'device_name' => 'test-suite',
        ]);

        $login->assertOk();
        $token = $login->json('data.access_token');
        $this->assertNotEmpty($token);

        $me = $this->withToken($token)->getJson('/api/v1/auth/me');
        $me->assertOk()->assertJsonPath('data.email', $user->email);

        $logout = $this->withToken($token)->postJson('/api/v1/auth/logout');
        $logout->assertOk();

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}

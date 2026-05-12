<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Sistema;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionVisualSistema;
use App\Models\User;
use App\Services\Sistema\ConfiguracionVisualSistemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConfiguracionVisualSistemaController extends Controller
{
    public function index(Request $request, ConfiguracionVisualSistemaService $service): JsonResponse
    {
        $this->authorize('viewAny', ConfiguracionVisualSistema::class);

        return response()->json(['data' => $service->listar()]);
    }

    public function actual(Request $request, ConfiguracionVisualSistemaService $service): JsonResponse
    {
        $this->authorize('viewAny', ConfiguracionVisualSistema::class);

        return response()->json(['data' => $service->dtoPublico()]);
    }

    public function store(Request $request, ConfiguracionVisualSistemaService $service): JsonResponse
    {
        $this->authorize('create', ConfiguracionVisualSistema::class);
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validate($this->rules());

        return response()->json(['data' => $service->crear($user, $validated)], 201);
    }

    public function update(Request $request, ConfiguracionVisualSistemaService $service, ConfiguracionVisualSistema $configuracion): JsonResponse
    {
        $this->authorize('update', $configuracion);
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validate($this->rules(false));

        return response()->json(['data' => $service->actualizar($user, $configuracion, $validated)]);
    }

    public function activar(Request $request, ConfiguracionVisualSistemaService $service, ConfiguracionVisualSistema $configuracion): JsonResponse
    {
        $this->authorize('publicar', $configuracion);
        /** @var User $user */
        $user = $request->user();

        return response()->json(['data' => $service->publicar($user, $configuracion)]);
    }

    public function restaurarDefault(Request $request, ConfiguracionVisualSistemaService $service, ConfiguracionVisualSistema $configuracion): JsonResponse
    {
        $this->authorize('restaurar', $configuracion);
        /** @var User $user */
        $user = $request->user();

        return response()->json(['data' => $service->restaurarDefault($user, $configuracion)]);
    }

    public function upload(Request $request, ConfiguracionVisualSistemaService $service): JsonResponse
    {
        $u = $request->user();
        if (! $u->can('apariencia_sistema.administrar') && ! $u->can('apariencia_sistema.subir_imagenes')) {
            abort(403);
        }
        /** @var User $user */
        $user = $u;
        $request->validate([
            'campo' => ['required', Rule::in(['logo_path', 'escudo_path', 'favicon_path', 'sidebar_image_path', 'login_background_path'])],
            'file' => ['required', 'file'],
        ]);
        $path = $service->subirArchivo($request, $user, (string) $request->string('campo'));

        return response()->json(['data' => ['path' => $path, 'url' => \Illuminate\Support\Facades\Storage::disk('public')->url($path)]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(bool $create = true): array
    {
        $r = [
            'nombre_configuracion' => [$create ? 'required' : 'sometimes', 'string', 'max:120'],
            'app_name' => ['sometimes', 'string', 'max:120'],
            'app_subtitle' => ['nullable', 'string', 'max:255'],
            'logo_path' => ['nullable', 'string', 'max:500'],
            'escudo_path' => ['nullable', 'string', 'max:500'],
            'favicon_path' => ['nullable', 'string', 'max:500'],
            'sidebar_image_path' => ['nullable', 'string', 'max:500'],
            'login_background_path' => ['nullable', 'string', 'max:500'],
            'primary_color' => ['sometimes', 'string', 'max:32'],
            'secondary_color' => ['sometimes', 'string', 'max:32'],
            'accent_color' => ['sometimes', 'string', 'max:32'],
            'success_color' => ['sometimes', 'string', 'max:32'],
            'warning_color' => ['sometimes', 'string', 'max:32'],
            'danger_color' => ['sometimes', 'string', 'max:32'],
            'info_color' => ['sometimes', 'string', 'max:32'],
            'sidebar_bg_color' => ['sometimes', 'string', 'max:32'],
            'sidebar_text_color' => ['sometimes', 'string', 'max:32'],
            'topbar_bg_color' => ['sometimes', 'string', 'max:32'],
            'content_bg_color' => ['sometimes', 'string', 'max:32'],
            'card_radius' => ['sometimes', 'string', 'max:16'],
            'card_shadow' => ['sometimes', 'string', 'max:32'],
            'font_family' => ['sometimes', 'string', 'max:255'],
            'theme_mode' => ['sometimes', Rule::in(['claro', 'oscuro', 'institucional'])],
            'metadata' => ['nullable', 'array'],
        ];

        return $r;
    }
}

<?php

declare(strict_types=1);

namespace App\Services\Sistema;

use App\Models\ConfiguracionVisualAuditoria;
use App\Models\ConfiguracionVisualSistema;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ConfiguracionVisualSistemaService
{
    private const DISK = 'public';

    private const BRANDING_DIR = 'branding';

    private const IMAGE_MAX_KB = 4096;

    private const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];

    public function activa(): ?ConfiguracionVisualSistema
    {
        return ConfiguracionVisualSistema::query()->where('activo', true)->orderByDesc('id')->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function dtoPublico(?ConfiguracionVisualSistema $c = null): array
    {
        $c ??= $this->activa();
        if ($c === null) {
            return $this->defaultsPublicos();
        }

        return [
            'app_name' => $c->app_name,
            'app_subtitle' => $c->app_subtitle ?? '',
            'logo_url' => $this->url($c->logo_path),
            'escudo_url' => $this->url($c->escudo_path),
            'favicon_url' => $this->url($c->favicon_path),
            'sidebar_image_url' => $this->url($c->sidebar_image_path),
            'login_background_url' => $this->url($c->login_background_path),
            'colors' => [
                'primary' => $c->primary_color,
                'secondary' => $c->secondary_color,
                'accent' => $c->accent_color,
                'success' => $c->success_color,
                'warning' => $c->warning_color,
                'danger' => $c->danger_color,
                'info' => $c->info_color,
                'sidebar_bg' => $c->sidebar_bg_color,
                'sidebar_text' => $c->sidebar_text_color,
                'topbar_bg' => $c->topbar_bg_color,
                'content_bg' => $c->content_bg_color,
            ],
            'theme_mode' => $c->theme_mode,
            'card_radius' => $c->card_radius,
            'card_shadow' => $c->card_shadow,
            'font_family' => $c->font_family,
        ];
    }

    /**
     * @return list<ConfiguracionVisualSistema>
     */
    public function listar(): array
    {
        return ConfiguracionVisualSistema::query()->orderByDesc('updated_at')->get()->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crear(User $actor, array $data): ConfiguracionVisualSistema
    {
        $data['creado_por'] = $actor->id;
        $data['activo'] = false;

        return DB::transaction(function () use ($actor, $data): ConfiguracionVisualSistema {
            $c = ConfiguracionVisualSistema::query()->create($this->onlyFillable($data));
            $this->auditar($actor, $c, 'apariencia_sistema.actualizada', null, $c->only($this->auditKeys()));

            return $c;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizar(User $actor, ConfiguracionVisualSistema $c, array $data): ConfiguracionVisualSistema
    {
        return DB::transaction(function () use ($actor, $c, $data): ConfiguracionVisualSistema {
            $antes = $c->only($this->auditKeys());
            $c->fill($this->onlyFillable($data));
            $c->save();
            $this->auditar($actor, $c, 'apariencia_sistema.actualizada', $antes, $c->only($this->auditKeys()));

            return $c->fresh();
        });
    }

    public function publicar(User $actor, ConfiguracionVisualSistema $c): ConfiguracionVisualSistema
    {
        return DB::transaction(function () use ($actor, $c): ConfiguracionVisualSistema {
            ConfiguracionVisualSistema::query()->update(['activo' => false]);
            $antes = $c->only($this->auditKeys());
            $c->activo = true;
            $c->publicado_por = $actor->id;
            $c->publicado_en = now();
            $c->save();
            $this->auditar($actor, $c, 'apariencia_sistema.publicada', $antes, $c->only($this->auditKeys()));

            return $c->fresh();
        });
    }

    public function restaurarDefault(User $actor, ConfiguracionVisualSistema $c): ConfiguracionVisualSistema
    {
        return DB::transaction(function () use ($actor, $c): ConfiguracionVisualSistema {
            $antes = $c->only($this->auditKeys());
            $defaults = $this->defaultsModelo();
            $c->fill($defaults);
            $c->save();
            $this->auditar($actor, $c, 'apariencia_sistema.restaurada', $antes, $c->only($this->auditKeys()));

            return $c->fresh();
        });
    }

    public function subirArchivo(Request $request, User $actor, string $campo): string
    {
        if (! $request->hasFile('file')) {
            throw ValidationException::withMessages(['file' => ['Archivo requerido.']]);
        }

        $file = $request->file('file');
        if ($file === null) {
            throw ValidationException::withMessages(['file' => ['Archivo inválido.']]);
        }

        $mime = (string) $file->getMimeType();
        if (! in_array($mime, self::IMAGE_MIMES, true)) {
            throw ValidationException::withMessages(['file' => ['Formato no permitido. Use PNG, JPG, JPEG, SVG, WEBP o ICO.']]);
        }

        if ($file->getSize() > self::IMAGE_MAX_KB * 1024) {
            throw ValidationException::withMessages(['file' => ['El archivo supera el tamaño máximo permitido ('.self::IMAGE_MAX_KB.' KB).']]);
        }

        $ext = strtolower((string) $file->getClientOriginalExtension()) ?: 'bin';
        $name = Str::uuid()->toString().'.'.$ext;
        $path = $file->storeAs(self::BRANDING_DIR, $name, self::DISK);

        $this->auditar($actor, null, 'apariencia_sistema.imagen_subida', null, [
            'campo' => $campo,
            'path' => $path,
        ]);

        return $path;
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultsPublicos(): array
    {
        $m = $this->defaultsModelo();

        return [
            'app_name' => $m['app_name'],
            'app_subtitle' => $m['app_subtitle'] ?? '',
            'logo_url' => null,
            'escudo_url' => null,
            'favicon_url' => null,
            'sidebar_image_url' => null,
            'login_background_url' => null,
            'colors' => [
                'primary' => $m['primary_color'],
                'secondary' => $m['secondary_color'],
                'accent' => $m['accent_color'],
                'success' => $m['success_color'],
                'warning' => $m['warning_color'],
                'danger' => $m['danger_color'],
                'info' => $m['info_color'],
                'sidebar_bg' => $m['sidebar_bg_color'],
                'sidebar_text' => $m['sidebar_text_color'],
                'topbar_bg' => $m['topbar_bg_color'],
                'content_bg' => $m['content_bg_color'],
            ],
            'theme_mode' => $m['theme_mode'],
            'card_radius' => $m['card_radius'],
            'card_shadow' => $m['card_shadow'],
            'font_family' => $m['font_family'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultsModelo(): array
    {
        return [
            'nombre_configuracion' => 'Institucional por defecto',
            'app_name' => 'SICES v2',
            'app_subtitle' => 'Control Escolar para Educación Superior',
            'primary_color' => '#0B5ED7',
            'secondary_color' => '#003B73',
            'accent_color' => '#00A3FF',
            'success_color' => '#198754',
            'warning_color' => '#FFC107',
            'danger_color' => '#DC3545',
            'info_color' => '#0DCAF0',
            'sidebar_bg_color' => '#001F3F',
            'sidebar_text_color' => '#FFFFFF',
            'topbar_bg_color' => '#FFFFFF',
            'content_bg_color' => '#F5F7FB',
            'card_radius' => '18px',
            'card_shadow' => 'soft',
            'font_family' => 'Inter, system-ui, sans-serif',
            'theme_mode' => 'institucional',
        ];
    }

    /**
     * @param  array<string, mixed>|null  $antes
     * @param  array<string, mixed>|null  $despues
     */
    private function auditar(User $actor, ?ConfiguracionVisualSistema $c, string $evento, ?array $antes, ?array $despues): void
    {
        $req = request();
        ConfiguracionVisualAuditoria::query()->create([
            'configuracion_visual_sistema_id' => $c?->id,
            'user_id' => $actor->id,
            'evento' => $evento,
            'valores_anteriores' => $antes,
            'valores_nuevos' => $despues,
            'ip' => $req?->ip(),
            'user_agent' => $req ? substr((string) $req->userAgent(), 0, 2000) : null,
        ]);
    }

    /**
     * @return list<string>
     */
    private function auditKeys(): array
    {
        return [
            'nombre_configuracion', 'activo', 'app_name', 'app_subtitle',
            'logo_path', 'escudo_path', 'favicon_path', 'sidebar_image_path', 'login_background_path',
            'primary_color', 'secondary_color', 'accent_color', 'success_color', 'warning_color', 'danger_color', 'info_color',
            'sidebar_bg_color', 'sidebar_text_color', 'topbar_bg_color', 'content_bg_color',
            'card_radius', 'card_shadow', 'font_family', 'theme_mode',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function onlyFillable(array $data): array
    {
        $m = new ConfiguracionVisualSistema;
        $allowed = array_flip($m->getFillable());
        $out = [];
        foreach ($data as $k => $v) {
            if (isset($allowed[$k])) {
                $out[$k] = $v;
            }
        }

        return $out;
    }

    private function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return Storage::disk(self::DISK)->url($path);
    }
}

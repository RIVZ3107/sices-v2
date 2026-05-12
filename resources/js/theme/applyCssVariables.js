/**
 * Aplica variables CSS globales a partir del DTO de GET /me/apariencia (data).
 * @param {Record<string, unknown>|null|undefined} dto
 */
export function applyCssVariables(dto) {
    const root = document.documentElement;
    if (!dto || typeof dto !== 'object') {
        return;
    }

    const colors = dto.colors && typeof dto.colors === 'object' ? dto.colors : {};

    const set = (name, value) => {
        if (value != null && value !== '') {
            root.style.setProperty(name, String(value));
        }
    };

    set('--sices-primary', colors.primary);
    set('--sices-secondary', colors.secondary);
    set('--sices-accent', colors.accent);
    set('--sices-success', colors.success);
    set('--sices-warning', colors.warning);
    set('--sices-danger', colors.danger);
    set('--sices-info', colors.info);
    set('--sices-sidebar-bg', colors.sidebar_bg);
    set('--sices-sidebar-text', colors.sidebar_text);
    set('--sices-topbar-bg', colors.topbar_bg);
    set('--sices-content-bg', colors.content_bg);

    /* Compatibilidad con estilos existentes (.sices-ui, admin) */
    set('--sices-primary-dark', colors.sidebar_bg);
    set('--sices-bg', colors.content_bg);

    if (dto.card_radius) {
        set('--sices-card-radius', dto.card_radius);
        set('--sices-radius', dto.card_radius);
    }
    if (dto.font_family) {
        set('--sices-font-family', dto.font_family);
    }

    const shadowMap = {
        none: 'none',
        soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
        medium: '0 18px 40px rgba(15, 23, 42, 0.12)',
        strong: '0 22px 50px rgba(15, 23, 42, 0.18)',
    };
    const sh = shadowMap[dto.card_shadow] ?? shadowMap.soft;
    set('--sices-card-shadow', sh);
    set('--sices-shadow', sh);

    const mode = dto.theme_mode;
    if (mode === 'oscuro') {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.remove('theme-dark');
    }
}

export function clearInlineThemeVariables() {
    const root = document.documentElement;
    const keys = [
        '--sices-primary',
        '--sices-secondary',
        '--sices-accent',
        '--sices-success',
        '--sices-warning',
        '--sices-danger',
        '--sices-info',
        '--sices-sidebar-bg',
        '--sices-sidebar-text',
        '--sices-topbar-bg',
        '--sices-content-bg',
        '--sices-primary-dark',
        '--sices-bg',
        '--sices-card-radius',
        '--sices-radius',
        '--sices-font-family',
        '--sices-card-shadow',
        '--sices-shadow',
    ];
    keys.forEach((k) => root.style.removeProperty(k));
}

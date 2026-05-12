import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    activarSistemaApariencia,
    createSistemaApariencia,
    fetchSistemaAparienciaList,
    restaurarDefaultSistemaApariencia,
    updateSistemaApariencia,
    uploadSistemaAparienciaAsset,
} from '../../api/apariencia';
import { useSicesTheme } from '../../theme/useSicesTheme';

function ColorField({ label, value, onChange }) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">{label}</span>
            <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1" value={value} onChange={(e) => onChange(e.target.value)} />
                <input className="sices-input flex-1 font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
            </div>
        </label>
    );
}

function PreviewPane({ draft }) {
    const c = draft?.colors ?? {};
    const radius = draft?.card_radius ?? '18px';
    const shadow = draft?.card_shadow === 'none' ? 'none' : '0 12px 28px rgba(15,23,42,0.12)';
    return (
        <div
            className="grid gap-3 rounded-2xl border border-slate-200 p-4"
            style={{
                background: c.content_bg ?? '#f5f7fb',
                fontFamily: draft?.font_family ?? 'Inter, system-ui, sans-serif',
            }}
        >
            <div className="flex gap-3">
                <aside
                    className="w-28 shrink-0 rounded-xl p-2 text-[10px] leading-tight"
                    style={{ background: `linear-gradient(180deg, ${c.sidebar_bg ?? '#001f3f'}, #0b1738)`, color: c.sidebar_text ?? '#fff' }}
                >
                    <p className="font-bold">{draft?.app_name ?? 'SICES'}</p>
                    <p className="mt-2 opacity-80">Inicio</p>
                    <p className="opacity-80">Menú</p>
                </aside>
                <div className="min-w-0 flex-1 space-y-2">
                    <header
                        className="flex items-center justify-between rounded-xl border px-3 py-2 text-[11px]"
                        style={{ background: c.topbar_bg ?? '#fff', borderColor: '#e2e8f0' }}
                    >
                        <span className="font-semibold text-slate-800">Vista previa</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">Topbar</span>
                    </header>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" style={{ borderRadius: radius, boxShadow: shadow }}>
                        <p className="text-xs font-semibold text-slate-800">Tarjeta de métrica</p>
                        <p className="mt-1 text-2xl font-bold" style={{ color: c.primary ?? '#0b5ed7' }}>
                            128
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button type="button" className="rounded-lg px-3 py-1 text-[11px] font-semibold text-white" style={{ background: c.primary }}>
                                Primario
                            </button>
                            <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                                Secundario
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                            <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: c.success }}>
                                Éxito
                            </span>
                            <span className="rounded-full px-2 py-0.5 font-semibold text-slate-900" style={{ background: c.warning }}>
                                Advertencia
                            </span>
                            <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: c.danger }}>
                                Error
                            </span>
                        </div>
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 text-[10px]">
                            <div className="grid grid-cols-2 bg-slate-50 px-2 py-1 font-semibold text-slate-600">
                                <span>Campo</span>
                                <span>Valor</span>
                            </div>
                            <div className="grid grid-cols-2 border-t border-slate-100 px-2 py-1 text-slate-700">
                                <span>Ejemplo</span>
                                <span>1</span>
                            </div>
                        </div>
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-900">Alerta de ejemplo para contraste.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function emptyDraft() {
    return {
        nombre_configuracion: 'Borrador',
        app_name: 'SICES v2',
        app_subtitle: 'Control Escolar para Educación Superior',
        primary_color: '#0B5ED7',
        secondary_color: '#003B73',
        accent_color: '#00A3FF',
        success_color: '#198754',
        warning_color: '#FFC107',
        danger_color: '#DC3545',
        info_color: '#0DCAF0',
        sidebar_bg_color: '#001F3F',
        sidebar_text_color: '#FFFFFF',
        topbar_bg_color: '#FFFFFF',
        content_bg_color: '#F5F7FB',
        card_radius: '18px',
        card_shadow: 'soft',
        font_family: 'Inter, system-ui, sans-serif',
        theme_mode: 'institucional',
        logo_path: null,
        escudo_path: null,
        favicon_path: null,
        sidebar_image_path: null,
        login_background_path: null,
    };
}

function modelToDraft(row) {
    if (!row) {
        return emptyDraft();
    }
    return {
        nombre_configuracion: row.nombre_configuracion ?? 'Configuración',
        app_name: row.app_name ?? 'SICES v2',
        app_subtitle: row.app_subtitle ?? '',
        primary_color: row.primary_color ?? '#0B5ED7',
        secondary_color: row.secondary_color ?? '#003B73',
        accent_color: row.accent_color ?? '#00A3FF',
        success_color: row.success_color ?? '#198754',
        warning_color: row.warning_color ?? '#FFC107',
        danger_color: row.danger_color ?? '#DC3545',
        info_color: row.info_color ?? '#0DCAF0',
        sidebar_bg_color: row.sidebar_bg_color ?? '#001F3F',
        sidebar_text_color: row.sidebar_text_color ?? '#FFFFFF',
        topbar_bg_color: row.topbar_bg_color ?? '#FFFFFF',
        content_bg_color: row.content_bg_color ?? '#F5F7FB',
        card_radius: row.card_radius ?? '18px',
        card_shadow: row.card_shadow ?? 'soft',
        font_family: row.font_family ?? 'Inter, system-ui, sans-serif',
        theme_mode: row.theme_mode ?? 'institucional',
        logo_path: row.logo_path ?? null,
        escudo_path: row.escudo_path ?? null,
        favicon_path: row.favicon_path ?? null,
        sidebar_image_path: row.sidebar_image_path ?? null,
        login_background_path: row.login_background_path ?? null,
        id: row.id,
        activo: !!row.activo,
    };
}

function draftColors(draft) {
    return {
        primary: draft.primary_color,
        secondary: draft.secondary_color,
        accent: draft.accent_color,
        success: draft.success_color,
        warning: draft.warning_color,
        danger: draft.danger_color,
        info: draft.info_color,
        sidebar_bg: draft.sidebar_bg_color,
        sidebar_text: draft.sidebar_text_color,
        topbar_bg: draft.topbar_bg_color,
        content_bg: draft.content_bg_color,
    };
}

export function AparienciaSistemaPage() {
    const { refreshTheme } = useSicesTheme();
    const [rows, setRows] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState(emptyDraft());
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setErr(null);
        const res = await fetchSistemaAparienciaList();
        const list = res?.data?.data ?? [];
        setRows(list);
        const active = list.find((r) => r.activo) ?? list[0];
        if (active) {
            setSelectedId(active.id);
            setDraft(modelToDraft(active));
        } else {
            setSelectedId(null);
            setDraft(emptyDraft());
        }
    }, []);

    useEffect(() => {
        void load().catch((e) => setErr(e?.response?.data?.message ?? 'No se pudo cargar la configuración'));
    }, [load]);

    const previewDto = useMemo(
        () => ({
            ...draft,
            colors: draftColors(draft),
        }),
        [draft],
    );

    function patchDraft(partial) {
        setDraft((d) => ({ ...d, ...partial }));
    }

    async function onSaveBorrador() {
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            const { id: rowId, activo: _a, ...payload } = draft;
            if (rowId) {
                await updateSistemaApariencia(rowId, payload);
                setMsg('Borrador guardado.');
            } else {
                const res = await createSistemaApariencia(payload);
                const created = res?.data?.data;
                if (created?.id) {
                    patchDraft({ id: created.id });
                    setSelectedId(created.id);
                }
                setMsg('Configuración creada como borrador.');
            }
            await load();
            await refreshTheme();
        } catch (e) {
            setErr(e?.response?.data?.message ?? 'Error al guardar');
        } finally {
            setBusy(false);
        }
    }

    async function onPublicar() {
        if (!draft.id) {
            setErr('Guarde el borrador antes de publicar.');
            return;
        }
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            await activarSistemaApariencia(draft.id);
            setMsg('Cambios publicados. La configuración quedó activa.');
            await load();
            await refreshTheme();
        } catch (e) {
            setErr(e?.response?.data?.message ?? 'Error al publicar');
        } finally {
            setBusy(false);
        }
    }

    async function onRestaurar() {
        if (!draft.id) {
            return;
        }
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            await restaurarDefaultSistemaApariencia(draft.id);
            setMsg('Valores institucionales restaurados en esta configuración.');
            await load();
            await refreshTheme();
        } catch (e) {
            setErr(e?.response?.data?.message ?? 'Error al restaurar');
        } finally {
            setBusy(false);
        }
    }

    async function onUpload(campo, file) {
        if (!file || !draft.id) {
            setErr('Seleccione una configuración guardada y un archivo válido.');
            return;
        }
        const fd = new FormData();
        fd.append('campo', campo);
        fd.append('file', file);
        setBusy(true);
        setErr(null);
        try {
            const res = await uploadSistemaAparienciaAsset(fd);
            const path = res?.data?.data?.path;
            patchDraft({ [campo]: path });
            setMsg('Archivo subido. Guarde el borrador para conservar la ruta en la configuración.');
            await load();
        } catch (e) {
            setErr(e?.response?.data?.message ?? 'Error al subir archivo');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="sices-page space-y-6 px-4 py-6">
            <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apariencia del sistema</h1>
                    <p className="text-sm text-slate-600">Identidad visual, colores y parámetros globales. Solo personal técnico autorizado.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className="sices-btn sices-btn-secondary" disabled={busy} onClick={() => void onSaveBorrador()}>
                        Guardar borrador
                    </button>
                    <button type="button" className="sices-btn sices-btn-primary" disabled={busy} onClick={() => void onPublicar()}>
                        Publicar cambios
                    </button>
                    <button type="button" className="sices-btn sices-btn-secondary" disabled={busy || !draft.id} onClick={() => void onRestaurar()}>
                        Restaurar institucional
                    </button>
                </div>
            </header>

            {msg ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{msg}</p> : null}
            {err ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">{err}</p> : null}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="sices-card space-y-5 p-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Configuración
                            <select
                                className="sices-select mt-1"
                                value={selectedId ?? ''}
                                onChange={(e) => {
                                    const id = e.target.value ? Number(e.target.value) : null;
                                    setSelectedId(id);
                                    const row = rows.find((r) => r.id === id);
                                    setDraft(modelToDraft(row ?? emptyDraft()));
                                }}
                            >
                                <option value="">— Nueva borrador —</option>
                                {rows.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.nombre_configuracion}
                                        {r.activo ? ' (activa)' : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Nombre interno</span>
                            <input className="sices-input" value={draft.nombre_configuracion} onChange={(e) => patchDraft({ nombre_configuracion: e.target.value })} />
                        </label>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Identidad</h2>
                        <label className="grid gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Nombre del sistema</span>
                            <input className="sices-input" value={draft.app_name} onChange={(e) => patchDraft({ app_name: e.target.value })} />
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Subtítulo institucional</span>
                            <input className="sices-input" value={draft.app_subtitle} onChange={(e) => patchDraft({ app_subtitle: e.target.value })} />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ['logo_path', 'Logotipo'],
                                ['escudo_path', 'Escudo'],
                                ['favicon_path', 'Favicon'],
                                ['sidebar_image_path', 'Imagen sidebar'],
                                ['login_background_path', 'Fondo login'],
                            ].map(([campo, lab]) => (
                                <label key={campo} className="grid gap-1 text-xs font-semibold text-slate-700">
                                    {lab}
                                    <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp,.ico" className="text-xs" onChange={(e) => void onUpload(campo, e.target.files?.[0])} />
                                    <span className="break-all font-mono text-[10px] font-normal text-slate-500">{draft[campo] ?? '—'}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <h2 className="sm:col-span-2 text-sm font-bold uppercase tracking-wide text-slate-500">Colores</h2>
                        <ColorField label="Primario" value={draft.primary_color} onChange={(v) => patchDraft({ primary_color: v })} />
                        <ColorField label="Secundario" value={draft.secondary_color} onChange={(v) => patchDraft({ secondary_color: v })} />
                        <ColorField label="Acento" value={draft.accent_color} onChange={(v) => patchDraft({ accent_color: v })} />
                        <ColorField label="Éxito" value={draft.success_color} onChange={(v) => patchDraft({ success_color: v })} />
                        <ColorField label="Advertencia" value={draft.warning_color} onChange={(v) => patchDraft({ warning_color: v })} />
                        <ColorField label="Error" value={draft.danger_color} onChange={(v) => patchDraft({ danger_color: v })} />
                        <ColorField label="Informativo" value={draft.info_color} onChange={(v) => patchDraft({ info_color: v })} />
                        <ColorField label="Fondo sidebar" value={draft.sidebar_bg_color} onChange={(v) => patchDraft({ sidebar_bg_color: v })} />
                        <ColorField label="Texto sidebar" value={draft.sidebar_text_color} onChange={(v) => patchDraft({ sidebar_text_color: v })} />
                        <ColorField label="Fondo topbar" value={draft.topbar_bg_color} onChange={(v) => patchDraft({ topbar_bg_color: v })} />
                        <ColorField label="Fondo contenido" value={draft.content_bg_color} onChange={(v) => patchDraft({ content_bg_color: v })} />
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <h2 className="sm:col-span-2 text-sm font-bold uppercase tracking-wide text-slate-500">Estilo</h2>
                        <label className="grid gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Radio de tarjetas</span>
                            <input className="sices-input" value={draft.card_radius} onChange={(e) => patchDraft({ card_radius: e.target.value })} />
                        </label>
                        <label className="grid gap-1 text-sm">
                            <span className="font-semibold text-slate-700">Sombra</span>
                            <select className="sices-select" value={draft.card_shadow} onChange={(e) => patchDraft({ card_shadow: e.target.value })}>
                                <option value="none">Ninguna</option>
                                <option value="soft">Suave</option>
                                <option value="medium">Media</option>
                                <option value="strong">Fuerte</option>
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                            <span className="font-semibold text-slate-700">Tipografía (CSS)</span>
                            <input className="sices-input" value={draft.font_family} onChange={(e) => patchDraft({ font_family: e.target.value })} />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                            <span className="font-semibold text-slate-700">Modo visual</span>
                            <select className="sices-select" value={draft.theme_mode} onChange={(e) => patchDraft({ theme_mode: e.target.value })}>
                                <option value="institucional">Institucional</option>
                                <option value="claro">Claro</option>
                                <option value="oscuro">Oscuro</option>
                            </select>
                        </label>
                    </section>
                </div>

                <div className="sices-card space-y-3 p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Vista previa en vivo</h2>
                    <PreviewPane draft={previewDto} />
                    <p className="text-xs text-slate-500">La vista previa usa los valores del formulario; publicar aplica el tema a toda la aplicación autenticada.</p>
                </div>
            </div>

            <div className="sices-card-soft p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Historial</p>
                <p className="mt-1 text-xs">Los eventos de auditoría (actualización, publicación, restauración, carga de imagen) quedan registrados en el servidor con usuario, fecha, IP y valores previos/nuevos cuando aplica.</p>
            </div>
        </div>
    );
}

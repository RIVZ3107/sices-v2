import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogosAcademicosApi } from '../../api/catalogosAcademicos';
import { getUser } from '../../authStore';
import { userCanAny } from '../../utils/userPermissions';
import {
    EsHeaderAction,
    EsPageLayout,
    EsSearchInput,
    esTheme,
} from '../../components/educacionSuperior';
import { CicloDetailPanel } from '../../components/catalogos/ciclos/CicloDetailPanel';
import { CicloEmptyState } from '../../components/catalogos/ciclos/CicloEmptyState';
import { CicloFormDrawer } from '../../components/catalogos/ciclos/CicloFormDrawer';
import { CicloSummaryCards } from '../../components/catalogos/ciclos/CicloSummaryCards';
import { CiclosList } from '../../components/catalogos/ciclos/CiclosList';
import { PeriodoFormDrawer } from '../../components/catalogos/ciclos/PeriodoFormDrawer';
import {
    buildCicloPayload,
    buildPeriodoPayload,
    CICLO_VACIO,
    formErrorMessage,
    PERIODO_VACIO,
    PERM_ESCRITURA,
    ROLES_EDICION,
    validarFechasCiclo,
    validarFechasPeriodo,
} from '../../components/catalogos/ciclos/ciclosShared';
import { cpStyles } from '../../components/catalogos/ciclos/ciclosPeriodosStyles';

function CicloToast({ message, type = 'success', onDismiss }) {
    if (!message) return null;
    const style = type === 'error' ? cpStyles.toastError : cpStyles.toastSuccess;

    return (
        <div style={{ ...cpStyles.toast, ...style }} role="status">
            <span style={{ flex: 1 }}>{message}</span>
            <button type="button" onClick={onDismiss} style={{ ...esTheme.iconBtn, border: 'none', background: 'transparent' }}>
                ×
            </button>
        </div>
    );
}

export function CiclosPeriodosPage() {
    const roles = getUser()?.roles ?? [];
    const puedeEditar = ROLES_EDICION.some((r) => roles.includes(r)) || userCanAny(PERM_ESCRITURA);

    const [resumen, setResumen] = useState(null);
    const [ciclos, setCiclos] = useState([]);
    const [periodos, setPeriodos] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [loadingPeriodos, setLoadingPeriodos] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [activo, setActivo] = useState('');
    const [anio, setAnio] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(null);
    const [modalCiclo, setModalCiclo] = useState(null);
    const [modalPeriodo, setModalPeriodo] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const hayFiltros = Boolean(search.trim() || activo !== '' || anio.trim());
    const sinCiclos = !loading && ciclos.length === 0 && !hayFiltros;
    const conCiclos = !loading && (ciclos.length > 0 || hayFiltros);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 5000);
    }, []);

    const cargarResumen = useCallback(() => {
        catalogosAcademicosApi.ciclosResumen()
            .then((res) => setResumen(res?.data ?? null))
            .catch(() => {});
    }, []);

    const listParams = useMemo(() => {
        const params = { page, per_page: 25 };
        if (search.trim()) params.search = search.trim();
        if (activo !== '') params.activo = activo === '1' ? 1 : 0;
        if (anio.trim()) params.anio = anio.trim();
        return params;
    }, [page, search, activo, anio]);

    const cargarCiclos = useCallback(() => {
        let cancelled = false;
        setLoading(true);
        catalogosAcademicosApi.ciclosEscolares(listParams)
            .then((res) => {
                if (cancelled) return;
                const lista = res?.data ?? [];
                setCiclos(lista);
                setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
                if (res?.resumen) setResumen(res.resumen);
                setSelected((prev) => {
                    if (prev?.id) {
                        const updated = lista.find((c) => c.id === prev.id);
                        return updated ?? (lista[0] ?? null);
                    }
                    return lista[0] ?? null;
                });
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message ?? 'No fue posible cargar los ciclos escolares.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [listParams]);

    const cargarPeriodos = useCallback((cicloId) => {
        if (!cicloId) {
            setPeriodos([]);
            return;
        }
        setLoadingPeriodos(true);
        catalogosAcademicosApi.periodosPorCiclo(cicloId, { per_page: 50 })
            .then((res) => setPeriodos(res?.data ?? []))
            .catch(() => setPeriodos([]))
            .finally(() => setLoadingPeriodos(false));
    }, []);

    useEffect(() => { cargarResumen(); }, [cargarResumen]);

    useEffect(() => {
        const c = cargarCiclos();
        return c;
    }, [cargarCiclos]);

    useEffect(() => {
        cargarPeriodos(selected?.id);
    }, [selected?.id, cargarPeriodos]);

    const refrescar = useCallback(async (cicloId = selected?.id) => {
        cargarResumen();
        try {
            const res = await catalogosAcademicosApi.ciclosEscolares(listParams);
            const lista = res?.data ?? [];
            setCiclos(lista);
            setMeta(res?.meta ?? { current_page: 1, last_page: 1, total: 0 });
            if (res?.resumen) setResumen(res.resumen);
            if (cicloId) {
                const actualizado = lista.find((c) => c.id === cicloId);
                if (actualizado) {
                    setSelected(actualizado);
                    const pRes = await catalogosAcademicosApi.periodosPorCiclo(cicloId, { per_page: 50 });
                    setPeriodos(pRes?.data ?? []);
                }
            }
        } catch (e) {
            setError(formErrorMessage(e, 'No fue posible actualizar la información.'));
        }
    }, [listParams, selected?.id, cargarResumen]);

    const abrirCrearCiclo = () => {
        setFormError('');
        setModalCiclo({ ...CICLO_VACIO });
    };

    const guardarCiclo = async (e) => {
        e.preventDefault();
        setFormError('');
        const localErr = validarFechasCiclo(modalCiclo);
        if (localErr) {
            setFormError(localErr);
            return;
        }
        const isEdit = Boolean(modalCiclo.id);
        const payload = buildCicloPayload(modalCiclo);
        setSaving(true);
        try {
            const res = isEdit
                ? await catalogosAcademicosApi.actualizarCicloEscolar(modalCiclo.id, payload)
                : await catalogosAcademicosApi.crearCicloEscolar(payload);
            setModalCiclo(null);
            const id = res?.data?.id ?? modalCiclo.id;
            if (!isEdit && res?.data) setSelected(res.data);
            await refrescar(id);
            showToast(isEdit ? 'Ciclo escolar actualizado correctamente.' : 'Ciclo escolar creado correctamente.');
        } catch (err) {
            setFormError(formErrorMessage(err, 'No fue posible guardar la información.'));
        } finally {
            setSaving(false);
        }
    };

    const guardarPeriodo = async (e) => {
        e.preventDefault();
        setFormError('');
        const localErr = validarFechasPeriodo(modalPeriodo, selected);
        if (localErr) {
            setFormError(localErr);
            return;
        }
        const cicloId = selected?.id ?? modalPeriodo.ciclo_escolar_id;
        const payload = buildPeriodoPayload(modalPeriodo);
        const isEdit = Boolean(modalPeriodo.id);
        setSaving(true);
        try {
            if (isEdit) {
                await catalogosAcademicosApi.actualizarPeriodoEscolar(modalPeriodo.id, payload);
            } else {
                await catalogosAcademicosApi.crearPeriodoEscolar(cicloId, payload);
            }
            setModalPeriodo(null);
            await refrescar(cicloId);
            showToast(isEdit ? 'Periodo actualizado correctamente.' : 'Periodo agregado correctamente.');
        } catch (err) {
            setFormError(formErrorMessage(err, 'No fue posible guardar la información.'));
        } finally {
            setSaving(false);
        }
    };

    const marcarActual = async () => {
        if (!selected?.id || !selected.activo) return;
        try {
            await catalogosAcademicosApi.marcarCicloActual(selected.id);
            await refrescar(selected.id);
            showToast('Ciclo marcado como actual.');
        } catch (e) {
            setError(formErrorMessage(e, 'Solo puede existir un ciclo actual.'));
        }
    };

    const toggleCicloActivo = async () => {
        if (!selected?.id) return;
        try {
            await catalogosAcademicosApi.activarCicloEscolar(selected.id, !selected.activo);
            await refrescar(selected.id);
            showToast(selected.activo ? 'Ciclo desactivado.' : 'Ciclo activado.');
        } catch (e) {
            setError(formErrorMessage(e, 'No fue posible cambiar el estatus del ciclo.'));
        }
    };

    const togglePeriodoActivo = async (periodo) => {
        try {
            await catalogosAcademicosApi.activarPeriodoEscolar(periodo.id, !periodo.activo);
            await refrescar(selected?.id);
            showToast(periodo.activo ? 'Periodo desactivado.' : 'Periodo activado.');
        } catch (e) {
            setError(formErrorMessage(e, 'No fue posible cambiar el estatus del periodo.'));
        }
    };

    const headerActions = conCiclos && puedeEditar ? (
        <EsHeaderAction label="Crear ciclo escolar" variant="primary" icon="folder" onClick={abrirCrearCiclo} />
    ) : null;

    if (loading && ciclos.length === 0 && !hayFiltros) {
        return <EsPageLayout loading loadingText="Cargando ciclos y periodos…" title="" />;
    }

    return (
        <EsPageLayout
            breadcrumbCurrent="Ciclos y periodos"
            title="Ciclos y periodos"
            subtitle="Configura ciclos escolares, periodos académicos y ventanas operativas para matrícula, inscripción y calificaciones."
            showSplit={false}
            error={error || undefined}
            actions={headerActions}
        >
            <div style={cpStyles.pageStack}>
                <CicloToast
                    message={toast?.message}
                    type={toast?.type}
                    onDismiss={() => setToast(null)}
                />

                {!sinCiclos ? <CicloSummaryCards resumen={resumen} /> : null}

                {sinCiclos ? (
                    <CicloEmptyState puedeEditar={puedeEditar} onCrear={abrirCrearCiclo} />
                ) : null}

                {conCiclos ? (
                    <>
                        <div style={cpStyles.toolbar}>
                            <div style={cpStyles.toolbarFilters}>
                                <EsSearchInput
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Buscar por clave o nombre…"
                                    width={260}
                                />
                                <select
                                    value={activo}
                                    onChange={(e) => { setActivo(e.target.value); setPage(1); }}
                                    style={esTheme.inputSearch}
                                >
                                    <option value="">Todos los estatus</option>
                                    <option value="1">Activos</option>
                                    <option value="0">Inactivos</option>
                                </select>
                                <input
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={anio}
                                    onChange={(e) => { setAnio(e.target.value); setPage(1); }}
                                    placeholder="Año"
                                    style={{ ...esTheme.inputSearch, width: 100 }}
                                />
                            </div>
                        </div>

                        <div style={selected ? cpStyles.masterDetail : cpStyles.masterDetailSingle}>
                            <CiclosList
                                ciclos={ciclos}
                                selectedId={selected?.id}
                                loading={loading}
                                meta={meta}
                                page={page}
                                onSelect={setSelected}
                                onPageChange={setPage}
                                puedeEditar={puedeEditar}
                                onEdit={(c) => setModalCiclo({ ...c, id: c.id })}
                            />
                            {selected ? (
                                <CicloDetailPanel
                                    ciclo={selected}
                                    periodos={periodos}
                                    loadingPeriodos={loadingPeriodos}
                                    puedeEditar={puedeEditar}
                                    onEditar={() => setModalCiclo({ ...selected, id: selected.id })}
                                    onMarcarActual={marcarActual}
                                    onToggleActivo={toggleCicloActivo}
                                    onAgregarPeriodo={() => setModalPeriodo({ ...PERIODO_VACIO, ciclo_escolar_id: selected.id })}
                                    onEditarPeriodo={(p) => setModalPeriodo({ ...p, id: p.id })}
                                    onTogglePeriodo={togglePeriodoActivo}
                                />
                            ) : null}
                        </div>
                    </>
                ) : null}
            </div>

            <CicloFormDrawer
                open={Boolean(modalCiclo)}
                form={modalCiclo}
                onChange={setModalCiclo}
                onClose={() => { setModalCiclo(null); setFormError(''); }}
                onSubmit={guardarCiclo}
                error={formError}
                saving={saving}
                isEdit={Boolean(modalCiclo?.id)}
            />

            <PeriodoFormDrawer
                open={Boolean(modalPeriodo)}
                form={modalPeriodo}
                onChange={setModalPeriodo}
                onClose={() => { setModalPeriodo(null); setFormError(''); }}
                onSubmit={guardarPeriodo}
                error={formError}
                saving={saving}
                isEdit={Boolean(modalPeriodo?.id)}
                cicloLabel={selected?.clave}
            />
        </EsPageLayout>
    );
}

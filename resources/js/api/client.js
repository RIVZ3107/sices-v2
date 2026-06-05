import axios from '../bootstrap';

function normalizeApiError(error) {
    const status = error?.response?.status ?? 500;
    const payload = error?.response?.data ?? {};
    const rawMessage = String(payload?.message ?? '').trim();
    const fallback =
        status === 403
            ? 'No tienes permisos para realizar esta accion.'
            : status === 422
                ? 'Hay errores de validacion en el formulario.'
                : status === 500
                    ? 'Ocurrio un error inesperado. Intenta nuevamente o contacta a soporte.'
                    : 'No se pudo completar la solicitud.';

    const legacyPayload = payload?.data;
    const legacyMessage =
        legacyPayload && typeof legacyPayload.error === 'string' && legacyPayload.error !== ''
            ? legacyPayload.error
            : null;

    return {
        status,
        message:
            status === 403 && rawMessage.toLowerCase() === 'this action is unauthorized.'
                ? 'No tienes permisos para esta accion en tu rol actual.'
                : legacyMessage ?? payload?.message ?? fallback,
        errors: payload?.errors ?? {},
        legacy: legacyPayload ?? null,
        original: error,
    };
}

export async function apiGet(url, config = {}) {
    try {
        const { data } = await axios.get(url, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function apiPost(url, payload = {}, config = {}) {
    try {
        const { data } = await axios.post(url, payload, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function apiPut(url, payload = {}, config = {}) {
    try {
        const { data } = await axios.put(url, payload, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function apiPatch(url, payload = {}, config = {}) {
    try {
        const { data } = await axios.patch(url, payload, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function apiDelete(url, config = {}) {
    try {
        const { data } = await axios.delete(url, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

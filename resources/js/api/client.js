import axios from '../bootstrap';

function normalizeApiError(error) {
    const status = error?.response?.status ?? 500;
    const payload = error?.response?.data ?? {};
    const fallback =
        status === 403
            ? 'No tienes permisos para realizar esta accion.'
            : status === 422
                ? 'Hay errores de validacion en el formulario.'
                : status === 500
                    ? 'Ocurrio un error inesperado. Intenta nuevamente o contacta a soporte.'
                    : 'No se pudo completar la solicitud.';

    return {
        status,
        message: payload?.message ?? fallback,
        errors: payload?.errors ?? {},
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

export async function apiDelete(url, config = {}) {
    try {
        const { data } = await axios.delete(url, config);
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

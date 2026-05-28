/**
 * Evita pantallas en "Cargando…" infinito si una petición no responde.
 */
export function withTimeout(promise, ms = 20000, message = 'La solicitud tardó demasiado. Intente de nuevo.') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error(message)), ms);
        }),
    ]);
}

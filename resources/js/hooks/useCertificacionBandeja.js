import { useCallback, useEffect, useState } from 'react';
import { bandejasApi } from '../api/bandejas';
import { catalogosApi } from '../api/catalogos';

/**
 * Carga bandeja documentos académicos + catálogos opcionales.
 * @param {string} bandeja - clave de bandeja API
 * @param {object} filters - query params
 */
export function useCertificacionBandeja(bandeja, filters = {}) {
    const [rows, setRows] = useState(null);
    const [meta, setMeta] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [catalogos, setCatalogos] = useState({ instituciones: [], ciclos: [] });

    const cargar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await bandejasApi.listar(bandeja, { ...filters });
            let data = Array.isArray(res?.data) ? res.data : [];
            const term = String(filters.sede_q ?? '').trim().toLowerCase();
            if (term) {
                data = data.filter((row) =>
                    `${row?.sede?.nombre ?? ''} ${row?.sede?.clave ?? ''}`.toLowerCase().includes(term),
                );
            }
            setRows(data);
            setMeta(res?.meta ?? null);
        } catch (err) {
            setRows([]);
            setMeta(null);
            setError(err?.message ?? 'No se pudo cargar la bandeja.');
        } finally {
            setLoading(false);
        }
    }, [bandeja, JSON.stringify(filters)]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        Promise.all([
            catalogosApi.instituciones().catch(() => ({ data: [] })),
            catalogosApi.ciclosEscolares().catch(() => ({ data: [] })),
        ]).then(([ins, cic]) => {
            setCatalogos({
                instituciones: Array.isArray(ins?.data) ? ins.data : [],
                ciclos: Array.isArray(cic?.data) ? cic.data : [],
            });
        });
    }, []);

    return { rows, meta, error, loading, catalogos, recargar: cargar };
}

export function useCertificacionResumen() {
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        bandejasApi
            .resumen()
            .then((res) => {
                if (!cancelled) {
                    setResumen(res?.data ?? {});
                    setError('');
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setResumen({});
                    setError(err?.message ?? '');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { resumen, error, loading };
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../bootstrap';
import { login, me } from '../../api/auth';
import { saveSession } from '../../authStore';
import { ErrorState } from '../../components/ErrorState';
import { FormField } from '../../components/FormField';

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await login({ email, password, device_name: 'web-sices-v2' });
            const token = res?.data?.access_token;
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            const meRes = await me();
            saveSession(token, meRes.data);
            navigate('/app/dashboard');
        } catch (err) {
            const status = err?.status ?? err?.response?.status;
            if (status === 422) {
                setError('Datos invalidos. Verifica correo y contrasena.');
            } else if (status === 401) {
                setError('Credenciales invalidas.');
            } else {
                setError(err?.message ?? err?.response?.data?.message ?? 'No se pudo iniciar sesion');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="grid gap-3" onSubmit={onSubmit}>
            <FormField label="Correo" value={email} onChange={setEmail} placeholder="correo@dominio.com" required />
            <FormField label="Contrasena" value={password} onChange={setPassword} type="password" required />
            {error ? <ErrorState message={error} /> : null}
            <button disabled={loading} className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">
                {loading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
    );
}

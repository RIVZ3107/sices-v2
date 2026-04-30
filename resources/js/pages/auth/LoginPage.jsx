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
                setError('Datos inválidos. Verifica correo y contraseña.');
            } else if (status === 401) {
                setError('Credenciales inválidas.');
            } else {
                setError(err?.message ?? err?.response?.data?.message ?? 'No se pudo iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header className="login-card-head">
                <div className="login-security-icon" aria-hidden="true">
                    <span>Seg</span>
                </div>
                <p className="login-card-brand">SICES v2</p>
                <h1>Bienvenido de nuevo</h1>
                <p>Ingresa tu correo y contraseña para continuar.</p>
            </header>
            <form className="grid gap-4" onSubmit={onSubmit}>
                <FormField
                    label="Correo electrónico"
                    value={email}
                    onChange={setEmail}
                    placeholder="correo@dominio.com"
                    required
                    autoComplete="email"
                />
                <FormField
                    label="Contraseña"
                    value={password}
                    onChange={setPassword}
                    type="password"
                    required
                    autoComplete="current-password"
                />
                {error ? <ErrorState message={error} /> : null}
                <button type="submit" disabled={loading} className="inst-btn inst-btn-primary login-submit" aria-busy={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
            <div className="login-links">
                <a href="#" className="login-link">Recuperar contraseña</a>
            </div>
            <p className="login-card-foot">
                Al continuar aceptas los <a href="#" className="login-inline-link">Términos y condiciones</a> y la{' '}
                <a href="#" className="login-inline-link">Mesa de ayuda</a>.
            </p>
        </>
    );
}

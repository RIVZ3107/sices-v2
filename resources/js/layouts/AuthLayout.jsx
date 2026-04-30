import { Outlet } from 'react-router-dom';

export function AuthLayout() {
    return (
        <div className="login-shell">
            <aside className="login-brand-col" aria-label="SICES v2 — identidad institucional">
                <div className="login-brand-inner">
                    <div>
                        <div className="login-brand-mark" aria-hidden="true">
                            <span className="login-brand-mark-dot" />
                            <span className="login-brand-mark-text">SICES V2</span>
                        </div>
                        <h1 className="login-brand-title">Bienvenido a SICES V2</h1>
                        <p className="login-brand-sub">Bienvenido al entorno seguro de operación académica</p>
                        <p className="login-brand-lede">
                            Gestiona captura, revisión y validación de documentos académicos en un flujo controlado,
                            trazable y diseñado para operación institucional.
                        </p>
                    </div>
                    <ul className="login-brand-list">
                        <li>Acceso exclusivo a personal autorizado.</li>
                        <li>Sesiones protegidas y trazabilidad por rol.</li>
                    </ul>
                </div>
                <p className="login-brand-foot">© SICES v2 · Todos los derechos reservados.</p>
            </aside>

            <div className="login-form-col">
                <div className="login-card">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

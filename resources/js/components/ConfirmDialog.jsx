export function ConfirmDialog({ open, title = 'Confirmar', message = 'Deseas continuar?', onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
            <div className="inst-surface w-full max-w-md p-4">
                <h3 className="inst-title text-sm">{title}</h3>
                <p className="inst-muted mt-2 text-sm">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="inst-btn inst-btn-secondary text-sm">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="inst-btn inst-btn-primary text-sm">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

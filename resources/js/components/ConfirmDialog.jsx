export function ConfirmDialog({ open, title = 'Confirmar', message = 'Deseas continuar?', onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="rounded border border-slate-300 px-3 py-2 text-sm">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ErrorListPanel({ mensajes = [] }) {
    const lista = mensajes.filter(Boolean);
    if (lista.length === 0) return null;

    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <p className="font-medium">Hay pendientes:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {lista.map((m, i) => (
                    <li key={i}>{m}</li>
                ))}
            </ul>
        </div>
    );
}

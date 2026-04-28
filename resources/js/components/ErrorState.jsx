export function ErrorState({ message = 'Ocurrio un error inesperado. Intenta nuevamente o contacta a soporte.' }) {
    return (
        <div className="inst-surface p-4 text-sm text-rose-700">
            {message}
        </div>
    );
}

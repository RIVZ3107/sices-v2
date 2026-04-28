export function ErrorState({ message = 'Ocurrio un error inesperado. Intenta nuevamente o contacta a soporte.' }) {
    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {message}
        </div>
    );
}

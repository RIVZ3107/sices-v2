export function ActionButton({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) {
    const cls =
        variant === 'danger'
            ? 'inst-btn-danger'
            : variant === 'success'
                ? 'inst-btn-success'
            : variant === 'warning'
                ? 'inst-btn-warning'
            : variant === 'secondary'
                ? 'inst-btn-secondary'
                : 'inst-btn-primary';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inst-btn text-sm ${cls} ${disabled ? 'cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );
}

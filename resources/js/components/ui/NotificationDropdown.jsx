export function NotificationDropdown({ items = [] }) {
    return (
        <div className="admin-notifications">
            <p className="admin-notification-title">Notificaciones</p>
            {items.length === 0 ? (
                <p className="admin-notification-item">Sin notificaciones nuevas.</p>
            ) : (
                items.map((item, idx) => (
                    <p key={`${item}-${idx}`} className="admin-notification-item">
                        {item}
                    </p>
                ))
            )}
        </div>
    );
}

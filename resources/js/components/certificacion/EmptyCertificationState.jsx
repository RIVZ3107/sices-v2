import { Link } from 'react-router-dom';
import { esColors, esTheme } from '../educacionSuperior/esTheme';
import { EsIcons } from '../educacionSuperior';

export function EmptyCertificationState({ onVerAprobados, onVerSolicitudes }) {
    return (
        <div
            style={{
                padding: 48,
                textAlign: 'center',
                background: '#fff',
                borderRadius: 12,
                border: `1px solid ${esColors.border}`,
            }}
        >
            <div style={{ color: esColors.muted, marginBottom: 16 }}>{EsIcons.file}</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: esColors.text }}>
                No hay documentos en proceso de certificación
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: esColors.muted, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
                Cuando las instituciones envíen expedientes validados, aparecerán aquí para seguimiento institucional.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {onVerAprobados ? (
                    <button type="button" style={esTheme.btnPrimary} onClick={onVerAprobados}>
                        Ver documentos aprobados
                    </button>
                ) : (
                    <Link to="/app/certificacion/revision?bandeja=aprobados" style={esTheme.btnPrimary}>
                        Ver documentos aprobados
                    </Link>
                )}
                {onVerSolicitudes ? (
                    <button type="button" style={esTheme.btnSecondary} onClick={onVerSolicitudes}>
                        Ver solicitudes
                    </button>
                ) : (
                    <Link to="/app/certificacion/solicitudes" style={esTheme.btnSecondary}>
                        Ver solicitudes
                    </Link>
                )}
            </div>
        </div>
    );
}

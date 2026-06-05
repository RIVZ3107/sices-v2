import { EsIcons } from '../../educacionSuperior/EsIcons';
import { esTheme } from '../../educacionSuperior/esTheme';
import { PASOS_GUIA } from './ciclosShared';
import { cpStyles } from './ciclosPeriodosStyles';

export function CicloEmptyState({ puedeEditar, onCrear }) {
    return (
        <div style={cpStyles.emptyHero}>
            <div style={cpStyles.emptyIconWrap}>
                {EsIcons.clock}
            </div>
            <h2 style={cpStyles.emptyTitle}>No hay ciclos escolares registrados.</h2>
            <p style={cpStyles.emptyMessage}>
                Registra el primer ciclo escolar para habilitar inscripción, matrícula y control académico.
            </p>
            {puedeEditar ? (
                <button type="button" style={esTheme.btnPrimary} onClick={onCrear}>
                    Crear ciclo escolar
                </button>
            ) : (
                <p style={{ ...cpStyles.emptyMessage, marginBottom: 0, fontSize: 13 }}>
                    Consulte con el administrador del sistema para registrar ciclos escolares.
                </p>
            )}
            <div style={cpStyles.stepsGrid}>
                {PASOS_GUIA.map((paso) => (
                    <div key={paso.num} style={cpStyles.stepCard}>
                        <span style={cpStyles.stepNum}>{paso.num}</span>
                        <p style={cpStyles.stepTitle}>{paso.title}</p>
                        <p style={cpStyles.stepDesc}>{paso.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

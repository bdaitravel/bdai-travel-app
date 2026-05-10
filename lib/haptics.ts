import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Toque sutil — cambio de parada, navegación
export const hapticLight = (): void => {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

// Impacto fuerte — tour completado
export const hapticHeavy = (): void => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
};

// Patrón de éxito — badge desbloqueado
export const hapticSuccess = (): void => {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};
